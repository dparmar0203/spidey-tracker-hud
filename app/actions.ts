"use server";

import { supabase } from "@/lib/supabase";
import {
  BOROUGHS,
  REPORT_TYPES,
  VERIFICATION_STATUSES,
  WEATHER_CONDITIONS,
} from "@/lib/constants";

const PAGE_SIZE = 15;

export type BoroughSighting = {
  sighting_id: string;
  timestamp: string;
  district: string;
  report_type: string;
  witness_count: number;
  unique_source_count: number;
  latitude: number;
  longitude: number;
  verification_status: string;
};

export type BoroughDetail = {
  borough: string;
  sightings: BoroughSighting[];
  avgWitnessCount: number;
  verifiedRate: number;
};

export async function getBoroughDetail(
  borough: string,
  page: number = 0
): Promise<BoroughDetail> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data } = await supabase
    .from("sightings")
    .select(
      "sighting_id,timestamp,district,report_type,witness_count,unique_source_count,latitude,longitude,verification_status"
    )
    .eq("borough", borough)
    .order("timestamp", { ascending: false })
    .range(from, to);

  const sightings = data ?? [];
  const total = sightings.length;

  const avgWitnessCount = total
    ? sightings.reduce((sum, s) => sum + (s.witness_count ?? 0), 0) / total
    : 0;

  const verifiedRate = total
    ? sightings.filter((s) => s.verification_status === "verified").length / total
    : 0;

  return { borough, sightings, avgWitnessCount, verifiedRate };
}

export async function getBoroughCounts() {
  const counts = await Promise.all(
    BOROUGHS.map(async (borough) => {
      const { count } = await supabase
        .from("sightings")
        .select("*", { count: "exact", head: true })
        .eq("borough", borough);
      return { name: borough, count: count ?? 0 };
    })
  );
  return counts;
}

export type OverviewStats = {
  totalSightings: number;
  verifiedRate: number;
  topBorough: { name: string; count: number };
  swingingCount: number;
};

export async function getOverviewStats(): Promise<OverviewStats> {
  const [{ count: total }, { count: verified }, boroughCounts, { count: swinging }] =
    await Promise.all([
      supabase.from("sightings").select("*", { count: "exact", head: true }),
      supabase
        .from("sightings")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "verified"),
      getBoroughCounts(),
      supabase
        .from("sightings")
        .select("*", { count: "exact", head: true })
        .eq("report_type", "swinging"),
    ]);

  const topBorough = boroughCounts.reduce((max, b) => (b.count > max.count ? b : max), {
    name: "—",
    count: 0,
  });

  return {
    totalSightings: total ?? 0,
    verifiedRate: total ? (verified ?? 0) / total : 0,
    topBorough,
    swingingCount: swinging ?? 0,
  };
}

export type CategoryBreakdown = { key: string; count: number }[];

export async function getReportTypeBreakdown(): Promise<CategoryBreakdown> {
  return Promise.all(
    REPORT_TYPES.map(async (key) => {
      const { count } = await supabase
        .from("sightings")
        .select("*", { count: "exact", head: true })
        .eq("report_type", key);
      return { key, count: count ?? 0 };
    })
  );
}

export async function getVerificationBreakdown(): Promise<CategoryBreakdown> {
  return Promise.all(
    VERIFICATION_STATUSES.map(async (key) => {
      const { count } = await supabase
        .from("sightings")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", key);
      return { key, count: count ?? 0 };
    })
  );
}

export async function getWeatherBreakdown(): Promise<CategoryBreakdown> {
  return Promise.all(
    WEATHER_CONDITIONS.map(async (key) => {
      const { count } = await supabase
        .from("sightings")
        .select("*", { count: "exact", head: true })
        .eq("weather_condition", key);
      return { key, count: count ?? 0 };
    })
  );
}

export type MonthlyTrendPoint = { month: string; total: number; verified: number };

export async function getMonthlyTrend(): Promise<MonthlyTrendPoint[]> {
  const months: { label: string; from: string; to: string }[] = [];
  for (let i = 0; i < 18; i++) {
    const from = new Date(Date.UTC(2025, i, 1));
    const to = new Date(Date.UTC(2025, i + 1, 1));
    months.push({
      label: from.toLocaleString("en-US", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
      from: from.toISOString(),
      to: to.toISOString(),
    });
  }

  return Promise.all(
    months.map(async ({ label, from, to }) => {
      const [{ count: total }, { count: verified }] = await Promise.all([
        supabase
          .from("sightings")
          .select("*", { count: "exact", head: true })
          .gte("timestamp", from)
          .lt("timestamp", to),
        supabase
          .from("sightings")
          .select("*", { count: "exact", head: true })
          .gte("timestamp", from)
          .lt("timestamp", to)
          .eq("verification_status", "verified"),
      ]);
      return { month: label, total: total ?? 0, verified: verified ?? 0 };
    })
  );
}

export type FilteredSighting = BoroughSighting & {
  borough: string;
  tracker_confidence: number;
  photo_evidence: boolean;
  video_evidence: boolean;
  audio_evidence: boolean;
  crime_nearby: boolean;
};

export type SightingFilters = {
  borough?: string;
  report_type?: string;
  verification_status?: string;
};

export async function getFilteredSightings(
  filters: SightingFilters,
  page: number = 0
): Promise<{ sightings: FilteredSighting[]; total: number }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("sightings")
    .select(
      "sighting_id,timestamp,borough,district,report_type,witness_count,unique_source_count,latitude,longitude,verification_status,tracker_confidence,photo_evidence,video_evidence,audio_evidence,crime_nearby",
      { count: "exact" }
    )
    .order("timestamp", { ascending: false })
    .range(from, to);

  if (filters.borough) query = query.eq("borough", filters.borough);
  if (filters.report_type) query = query.eq("report_type", filters.report_type);
  if (filters.verification_status)
    query = query.eq("verification_status", filters.verification_status);

  const { data, count } = await query;

  return { sightings: (data as FilteredSighting[]) ?? [], total: count ?? 0 };
}

export type MapSighting = {
  sighting_id: string;
  latitude: number;
  longitude: number;
  borough: string;
  district: string;
  report_type: string;
  witness_count: number;
  verification_status: string;
  timestamp: string;
};

export async function getMapSightings(borough?: string): Promise<MapSighting[]> {
  const targets = borough ? [borough] : BOROUGHS;
  const perBorough = borough ? 400 : 80;

  const results = await Promise.all(
    targets.map(async (b) => {
      const { data } = await supabase
        .from("sightings")
        .select(
          "sighting_id,latitude,longitude,borough,district,report_type,witness_count,verification_status,timestamp"
        )
        .eq("borough", b)
        .order("timestamp", { ascending: false })
        .limit(perBorough);
      return data ?? [];
    })
  );

  return results.flat();
}
