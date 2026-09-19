import { PageHeader } from "@/components/layout/PageHeader";

const MATERIALS = [
  "Thin metal plate (steel or aluminium, roughly 0.3-1.5 mm)",
  "Secure clamp or center mount",
  "Vibration exciter or a suitable speaker driver",
  "Small amplifier",
  "Signal source (use the Signal Generator in Audio Laboratory)",
  "Fine dry sand or table salt",
  "Dark, non-reflective background",
  "Stable, even lighting",
  "Phone tripod or fixed camera mount",
  "Optional: microphone for synchronized recording",
  "Optional: accelerometer for direct vibration measurement",
  "Eye protection",
];

const SAFETY = [
  "Start at low amplitude and increase gradually.",
  "Avoid loud, sustained tones; protect your hearing.",
  "Keep hands and fingers away from the moving plate.",
  "Secure all hardware before powering the exciter.",
  "Protect amplifiers and electronics from stray sand.",
  "Avoid inhaling fine powder; work in a ventilated space.",
  "Glass plates are not recommended for beginners.",
  "Keep children and pets away from the running setup.",
];

export default function HardwarePage() {
  return (
    <div>
      <PageHeader title="Hardware Guide" description="Plan and document a physical cymatics setup." />
      <article className="mx-auto max-w-[68ch] px-4 py-6 md:px-6 lg:px-8">
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">What you need</h2>
          <ul className="list-disc space-y-2 pl-5 text-[var(--color-text-secondary)]">
            {MATERIALS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Basic setup</h2>
          <ol className="list-decimal space-y-2 pl-5 text-[var(--color-text-secondary)]">
            <li>Mount the plate securely, typically at its center, so it can vibrate freely at the edges.</li>
            <li>Attach the exciter (or aim a speaker) at the mount point and connect it to the amplifier.</li>
            <li>Spread a thin, even layer of sand across the plate.</li>
            <li>Set up consistent lighting and a fixed camera angle above the plate.</li>
            <li>
              Generate a tone in Audio Laboratory, play it at low volume through the amplifier, and slowly sweep the
              frequency while observing the plate.
            </li>
            <li>Record video or photograph the pattern once it stabilizes at each frequency of interest.</li>
            <li>
              Upload the footage to <a href="/physical" className="text-[var(--color-violet)] underline">Real Experiment Analyzer</a> to
              measure the resulting pattern.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Safety</h2>
          <ul className="list-disc space-y-2 pl-5 text-[var(--color-text-secondary)]">
            {SAFETY.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-[var(--color-text-muted)]">
          Specific product recommendations, safe power ratings, and mounting hardware depend on your actual
          equipment; consult the manufacturer documentation for your exciter, amplifier, and plate material before
          use.
        </p>
      </article>
    </div>
  );
}
