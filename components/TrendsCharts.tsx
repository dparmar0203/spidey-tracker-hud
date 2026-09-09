"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CategoryBreakdown, MonthlyTrendPoint } from "@/app/actions";

const PALETTE = [
  "var(--spidey-red)",
  "var(--spidey-blue)",
  "oklch(0.7 0.19 25)",
  "oklch(0.6 0.15 260)",
  "oklch(0.75 0.12 25)",
  "oklch(0.55 0.1 260)",
  "oklch(0.65 0.15 25)",
];

const trendConfig: ChartConfig = {
  total: { label: "Total reports", color: "var(--spidey-blue)" },
  verified: { label: "Verified", color: "var(--spidey-red)" },
};

const barConfig: ChartConfig = {
  count: { label: "Reports", color: "var(--spidey-red)" },
};

function formatKey(key: string) {
  return key.replace(/_/g, " ");
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <Card className="bg-card border-border/60">
      <CardHeader>
        <CardTitle className="font-heading text-xl tracking-wide text-secondary">
          Sightings Over Time
        </CardTitle>
        <CardDescription>Monthly volume, Jan 2025 – Jun 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={trendConfig} className="h-72 w-full">
          <AreaChart data={data} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              interval={1}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="total"
              type="monotone"
              fill="var(--color-total)"
              fillOpacity={0.15}
              stroke="var(--color-total)"
              strokeWidth={2}
            />
            <Area
              dataKey="verified"
              type="monotone"
              fill="var(--color-verified)"
              fillOpacity={0.25}
              stroke="var(--color-verified)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function CategoryBarChart({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: CategoryBreakdown;
}) {
  const chartData = data.map((d) => ({ ...d, label: formatKey(d.key) }));

  return (
    <Card className="bg-card border-border/60">
      <CardHeader>
        <CardTitle className="font-heading text-xl tracking-wide text-primary">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={barConfig} className="h-72 w-full">
          <BarChart data={chartData} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
