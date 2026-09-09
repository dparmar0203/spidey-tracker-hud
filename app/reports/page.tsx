import ReportsExplorer from "@/components/ReportsExplorer";
import { getFilteredSightings } from "@/app/actions";

export default async function ReportsPage() {
  const { sightings, total } = await getFilteredSightings({}, 0);

  return (
    <section className="bg-web relative min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-6xl mb-8 text-center">
        <h1 className="font-heading relative text-4xl sm:text-5xl tracking-wide mb-4 text-primary">
          Report Feed
        </h1>
        <p className="relative text-sm text-muted-foreground">
          Every field report, filterable by borough, activity, and verification
          status.
        </p>
      </div>
      <ReportsExplorer initialSightings={sightings} initialTotal={total} />
    </section>
  );
}
