import CaseFilesExplorer from "@/components/CaseFilesExplorer";
import { getFilteredSightings } from "@/app/actions";

export default async function CaseFilesPage() {
  const { sightings, total } = await getFilteredSightings({}, 0);

  return (
    <section className="relative px-6 py-16">
      <div className="mx-auto mb-8 max-w-6xl text-center">
        <h1 className="font-heading text-4xl tracking-wide text-primary sm:text-5xl">
          Case Files
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Every logged sighting, filterable by borough, activity, and verification status.
        </p>
      </div>
      <CaseFilesExplorer initialSightings={sightings} initialTotal={total} />
    </section>
  );
}
