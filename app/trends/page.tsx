import {
  getMonthlyTrend,
  getReportTypeBreakdown,
  getVerificationBreakdown,
  getWeatherBreakdown,
} from "@/app/actions";
import { MonthlyTrendChart, CategoryBarChart } from "@/components/TrendsCharts";

export default async function TrendsPage() {
  const [monthly, reportTypes, verification, weather] = await Promise.all([
    getMonthlyTrend(),
    getReportTypeBreakdown(),
    getVerificationBreakdown(),
    getWeatherBreakdown(),
  ]);

  return (
    <section className="bg-web relative min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="font-heading relative text-4xl sm:text-5xl tracking-wide mb-4 text-primary">
            Trends
          </h1>
          <p className="relative text-sm text-muted-foreground">
            18 months of tracker data, broken down every way we could think of.
          </p>
        </div>

        <div className="grid gap-6">
          <MonthlyTrendChart data={monthly} />
          <div className="grid gap-6 md:grid-cols-2">
            <CategoryBarChart
              title="Report Type"
              description="What witnesses say he was doing"
              data={reportTypes}
            />
            <CategoryBarChart
              title="Verification Outcome"
              description="How each report ultimately resolved"
              data={verification}
            />
          </div>
          <CategoryBarChart
            title="Weather at Time of Report"
            description="Conditions logged across all sightings"
            data={weather}
          />
        </div>
      </div>
    </section>
  );
}
