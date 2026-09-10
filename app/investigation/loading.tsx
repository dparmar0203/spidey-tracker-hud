export default function LoadingInvestigation() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="animate-pulse font-heading text-2xl tracking-wide text-primary">
        Pulling every case file…
      </p>
      <p className="text-sm text-muted-foreground">
        Loading 86,631 sightings, 46 districts, and 18 months of weather. One moment.
      </p>
    </section>
  );
}
