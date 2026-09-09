"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMapSightings, type MapSighting } from "@/app/actions";
import { BOROUGHS } from "@/lib/constants";

const ALL = "all";

const BOROUGH_COLORS: Record<string, string> = {
  Manhattan: "var(--spidey-red)",
  Brooklyn: "var(--spidey-blue)",
  Queens: "oklch(0.7 0.19 25)",
  Bronx: "oklch(0.6 0.15 260)",
  Staten_Island: "oklch(0.8 0.02 260)",
};

const LON_DOMAIN: [number, number] = [-74.27, -73.69];
const LAT_DOMAIN: [number, number] = [40.48, 40.93];

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: MapSighting }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{p.borough.replace("_", " ")}</p>
      <p className="text-muted-foreground capitalize">
        {p.report_type.replace(/_/g, " ")} · {p.witness_count} witnesses
      </p>
    </div>
  );
}

export default function SightingsRadar({ initial }: { initial: MapSighting[] }) {
  const [borough, setBorough] = useState(ALL);
  const [sightings, setSightings] = useState(initial);
  const [selected, setSelected] = useState<MapSighting | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function handleBoroughChange(value: string | null) {
    if (!value) return;
    setBorough(value);
    setSelected(null);
    startTransition(async () => {
      const data = await getMapSightings(value === ALL ? undefined : value);
      setSightings(data);
    });
  }

  function toggleBorough(name: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const grouped = useMemo(() => {
    const map = new Map<string, MapSighting[]>();
    for (const b of BOROUGHS) map.set(b, []);
    for (const s of sightings) {
      map.get(s.borough)?.push(s);
    }
    return map;
  }, [sightings]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {BOROUGHS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => toggleBorough(b)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-opacity ${
                hidden.has(b)
                  ? "border-border/50 text-muted-foreground opacity-40"
                  : "border-border text-foreground"
              }`}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: BOROUGH_COLORS[b] }}
              />
              {b.replace("_", " ")}
            </button>
          ))}
        </div>

        <Select value={borough} onValueChange={handleBoroughChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Focus borough" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All boroughs</SelectItem>
            {BOROUGHS.map((b) => (
              <SelectItem key={b} value={b}>
                {b.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="bg-web border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl tracking-wide text-secondary">
              Spider-Sense Radar
            </CardTitle>
            <CardDescription>
              {sightings.length.toLocaleString()} plotted sightings · click a
              point for details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-[420px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={420}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis
                    type="number"
                    dataKey="longitude"
                    domain={LON_DOMAIN}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickFormatter={(v: number) => v.toFixed(2)}
                  />
                  <YAxis
                    type="number"
                    dataKey="latitude"
                    domain={LAT_DOMAIN}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickFormatter={(v: number) => v.toFixed(2)}
                  />
                  <Tooltip content={<RadarTooltip />} />
                  {BOROUGHS.filter((b) => !hidden.has(b)).map((b) => (
                    <Scatter
                      key={b}
                      data={grouped.get(b)}
                      fill={BOROUGH_COLORS[b]}
                      fillOpacity={0.7}
                      onClick={(point) => setSelected(point as unknown as MapSighting)}
                      cursor="pointer"
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60">
          <CardHeader>
            <CardTitle className="font-heading text-lg tracking-wide text-primary">
              Sighting Detail
            </CardTitle>
            <CardDescription>
              {selected ? selected.sighting_id : "Click a point on the radar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Borough</dt>
                  <dd>{selected.borough.replace("_", " ")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">District</dt>
                  <dd>{selected.district.replace(/_/g, " ")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Report Type</dt>
                  <dd className="capitalize">
                    {selected.report_type.replace(/_/g, " ")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Witnesses</dt>
                  <dd>{selected.witness_count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Coordinates</dt>
                  <dd className="font-mono text-xs">
                    {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reported</dt>
                  <dd className="text-xs">
                    {new Date(selected.timestamp).toLocaleString()}
                  </dd>
                </div>
                <div className="pt-2">
                  {selected.verification_status === "verified" ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    >
                      verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-muted-foreground/30 text-muted-foreground capitalize"
                    >
                      {selected.verification_status.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a dot on the radar to see its report details here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
