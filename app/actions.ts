"use server";

import { supabase } from "@/lib/supabase";
import { BOROUGHS } from "@/lib/constants";

const PAGE_SIZE = 15;
const SUPABASE_PAGE_CAP = 1000;

/** Fetch every row of a table/query, paging past Supabase's 1000-row cap. */
async function fetchAll<T>(
  table: string,
  columns: string,
  order: string
): Promise<T[]> {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  const total = count ?? 0;
  const pages = Math.ceil(total / SUPABASE_PAGE_CAP);

  const chunks = await Promise.all(
    Array.from({ length: pages }, (_, i) => {
      const from = i * SUPABASE_PAGE_CAP;
      const to = from + SUPABASE_PAGE_CAP - 1;
      return supabase.from(table).select(columns).order(order).range(from, to);
    })
  );

  return chunks.flatMap((c) => (c.data as T[]) ?? []);
}

// ---------------------------------------------------------------------------
// Overview (title screen)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Case Files — browsable, filterable individual sightings
// ---------------------------------------------------------------------------

export type FilteredSighting = {
  sighting_id: string;
  timestamp: string;
  borough: string;
  district: string;
  report_type: string;
  witness_count: number;
  unique_source_count: number;
  latitude: number;
  longitude: number;
  verification_status: string;
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

// ---------------------------------------------------------------------------
// Investigation — the full 86k-point dataset, pre-classified server-side
// ---------------------------------------------------------------------------

export type InvestigationPoint = {
  lat: number;
  lon: number;
  borough: string;
  district: string;
  status: "verified" | "unclear" | "flagged";
  lateNight: boolean;
  firstOfDay: boolean;
  lastOfDay: boolean;
  clearWx: boolean;
};

export type DistrictInfo = {
  district: string;
  borough: string;
  lat: number;
  lon: number;
  patrolActivity: number;
  nightlife: number;
};

export type InvestigationData = {
  points: InvestigationPoint[];
  districts: DistrictInfo[];
  totalCount: number;
};

function statusBucket(status: string): "verified" | "unclear" | "flagged" {
  if (status === "verified") return "verified";
  if (status === "impersonator" || status === "deliberate_fake") return "flagged";
  return "unclear";
}

// Timestamps come back as "YYYY-MM-DD HH:MM:SS.ffffff" — sliced as plain
// strings (never parsed into a Date) so there's no local-timezone reinterpretation.
function dateOf(ts: string) {
  return ts.slice(0, 10);
}
function hourOf(ts: string) {
  return parseInt(ts.slice(11, 13), 10);
}

type RawSighting = {
  latitude: number;
  longitude: number;
  borough: string;
  district: string;
  verification_status: string;
  timestamp: string;
};

type RawWeather = { date: string; hour: number; condition: string };

export async function getInvestigationData(): Promise<InvestigationData> {
  const [rawSightings, rawWeather, { data: rawLocations }] = await Promise.all([
    fetchAll<RawSighting>(
      "sightings",
      "latitude,longitude,borough,district,verification_status,timestamp",
      "timestamp"
    ),
    fetchAll<RawWeather>("weather", "date,hour,condition", "date"),
    supabase
      .from("locations")
      .select("district,borough,centroid_lat,centroid_lon,patrol_activity_score,nightlife_score"),
  ]);

  // date+hour -> condition, for the "clear visibility" filter
  const weatherByKey = new Map<string, string>();
  for (const w of rawWeather) {
    weatherByKey.set(`${w.date}_${w.hour}`, w.condition);
  }

  // first/last sighting of each calendar date. Timestamps are fixed-width
  // zero-padded strings, so plain string comparison is chronological order —
  // no Date parsing needed.
  const dayBounds = new Map<string, { minId: number; minTs: string; maxId: number; maxTs: string }>();
  rawSightings.forEach((s, i) => {
    const d = dateOf(s.timestamp);
    const existing = dayBounds.get(d);
    if (!existing) {
      dayBounds.set(d, { minId: i, minTs: s.timestamp, maxId: i, maxTs: s.timestamp });
    } else {
      if (s.timestamp < existing.minTs) {
        existing.minId = i;
        existing.minTs = s.timestamp;
      }
      if (s.timestamp > existing.maxTs) {
        existing.maxId = i;
        existing.maxTs = s.timestamp;
      }
    }
  });
  const firstOfDayIndices = new Set<number>();
  const lastOfDayIndices = new Set<number>();
  for (const bounds of dayBounds.values()) {
    firstOfDayIndices.add(bounds.minId);
    lastOfDayIndices.add(bounds.maxId);
  }

  const points: InvestigationPoint[] = rawSightings.map((s, i) => {
    const hour = hourOf(s.timestamp);
    const condition = weatherByKey.get(`${dateOf(s.timestamp)}_${hour}`);
    return {
      lat: s.latitude,
      lon: s.longitude,
      borough: s.borough,
      district: s.district,
      status: statusBucket(s.verification_status),
      lateNight: hour >= 22 || hour < 5,
      firstOfDay: firstOfDayIndices.has(i),
      lastOfDay: lastOfDayIndices.has(i),
      clearWx: condition === "clear" || condition === "cloudy",
    };
  });

  const districts: DistrictInfo[] = (rawLocations ?? []).map((l) => ({
    district: l.district,
    borough: l.borough,
    lat: l.centroid_lat,
    lon: l.centroid_lon,
    patrolActivity: l.patrol_activity_score,
    nightlife: l.nightlife_score,
  }));

  return { points, districts, totalCount: points.length };
}
