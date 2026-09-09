import SightingsRadar from "@/components/SightingsRadar";
import { getMapSightings } from "@/app/actions";

export default async function MapPage() {
  const sightings = await getMapSightings();

  return (
    <section className="relative min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-6xl mb-8 text-center">
        <h1 className="font-heading relative text-4xl sm:text-5xl tracking-wide mb-4 text-primary">
          Web Map
        </h1>
        <p className="relative text-sm text-muted-foreground">
          Every dot is a sighting, plotted by latitude and longitude. Toggle a
          borough off, or click a point for its full report.
        </p>
      </div>
      <SightingsRadar initial={sightings} />
    </section>
  );
}
