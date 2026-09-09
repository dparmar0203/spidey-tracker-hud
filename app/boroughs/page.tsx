import BoroughExplorer from "@/components/BoroughExplorer";
import { getBoroughCounts } from "@/app/actions";

export default async function BoroughsPage() {
  const boroughs = await getBoroughCounts();

  return (
    <section className="bg-web relative min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-16">
      <h1 className="font-heading relative text-4xl sm:text-5xl tracking-wide mb-4 text-center text-secondary">
        He&apos;s been seen everywhere.
      </h1>
      <p className="relative mb-8 text-center text-sm text-muted-foreground">
        Tap a borough to pull its field reports.
      </p>
      <BoroughExplorer boroughs={boroughs} />
    </section>
  );
}
