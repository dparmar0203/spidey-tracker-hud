import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-4xl tracking-wide text-primary sm:text-5xl">
        About This Case
      </h1>

      <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <p>
          Every sighting, witness, weather record, and crime incident in Spidey-Tracker is{" "}
          <strong className="text-foreground">synthetic data</strong> — generated for a
          data-science and web-development project. None of it describes real events, real
          people, or a real vigilante.
        </p>
        <p>
          This project is <strong className="text-foreground">not affiliated with, endorsed
          by, or connected to Marvel, Sony Pictures, The Walt Disney Company</strong>, or any
          owner of Spider-Man-related intellectual property. It borrows the general idea of a
          masked, web-slinging vigilante purely as a narrative frame for exploring a dataset —
          no character names, logos, or copyrighted designs from those properties are used
          anywhere in this app.
        </p>
        <p>
          The dataset (
          <a
            href="https://www.kaggle.com/datasets/umuttuygurr/spidey-tracker-spiderman-dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary underline underline-offset-2"
          >
            Spidey Tracker: Spider-Man Dataset on Kaggle
          </a>
          ) spans January 2025 – June 2026 across the five NYC boroughs, with sightings,
          witness reports, nearby crime incidents, hourly weather, and per-district activity
          scores. Every sighting carries a labeled verification outcome — most are ordinary
          explanations (mistaken identity, duplicate reports, hoaxes, sensor errors) rather
          than confirmed sightings.
        </p>
        <p>
          One thread in the documentation — referred to as{" "}
          <strong className="text-foreground">&ldquo;Mission 05&rdquo;</strong> — asks where a
          hidden base might be, using patterns in verified sightings, timing, and district
          activity. There is{" "}
          <strong className="text-foreground">no published correct answer</strong>. The{" "}
          <Link href="/investigation" className="text-secondary underline underline-offset-2">
            Investigation
          </Link>{" "}
          page lets you form your own theory from the same signals — it&apos;s a real open
          question, not a quiz with a hidden answer key.
        </p>
      </div>

      <Link href="/" className="title-menu-btn mt-10 inline-flex">
        Back to Title Screen
      </Link>
    </section>
  );
}
