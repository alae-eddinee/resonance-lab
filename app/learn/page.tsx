import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";

const TOPICS = [
  {
    title: "What is a Chladni pattern?",
    body: "When a flat plate is driven at one of its natural (resonant) frequencies, its surface divides into regions moving up and down separated by stationary nodal lines. Fine particles like sand migrate away from moving regions and collect along the nodal lines, tracing the shape of that vibration mode. Ernst Chladni first documented these figures in 1787.",
  },
  {
    title: "Why does frequency change the pattern?",
    body: "Each mode of a plate has its own natural frequency and its own nodal-line geometry, set by the plate's shape, size, thickness, material, and boundary condition. Driving the plate near a different mode's frequency excites a different pattern. Away from any resonance, the plate moves only weakly and no stable pattern forms.",
  },
  {
    title: "Why does thickness matter?",
    body: "Flexural rigidity D = E h³ / (12(1-ν²)) grows with the cube of thickness h. Thicker plates are stiffer and resonate at higher frequencies for the same size and material; thinner plates resonate lower. Try the Plate Simulator with the thin and thick square steel presets to compare directly.",
  },
  {
    title: "What does this app actually measure versus simulate?",
    body: "Live Cymatics and Audio Laboratory measure real audio: waveform, spectrum, and derived features. Plate Simulator and the plate view in Live Cymatics compute a physics simulation from a documented plate model. Educational mapping mode makes exploration easier to follow but is explicitly not a physical prediction. Real Experiment Analyzer measures footage of an actual physical setup. See Methodology for full definitions.",
  },
];

export default function LearnPage() {
  return (
    <div>
      <PageHeader title="Learn" description="Short explanations and worked examples for the concepts behind Resonance Lab." />
      <article className="mx-auto max-w-[68ch] px-4 py-6 md:px-6 lg:px-8">
        {TOPICS.map((topic) => (
          <section key={topic.title} className="mb-10">
            <h2 className="mb-2 text-xl font-semibold">{topic.title}</h2>
            <p className="text-[var(--color-text-secondary)]">{topic.body}</p>
          </section>
        ))}
        <section className="mb-10">
          <h2 className="mb-2 text-xl font-semibold">Try it yourself</h2>
          <ul className="list-disc space-y-2 pl-5 text-[var(--color-text-secondary)]">
            <li>
              Open <Link className="text-[var(--color-violet)] underline" href="/simulator">Plate Simulator</Link>, choose the
              Tone source, and slowly sweep the drive frequency past a listed resonance to see the pattern settle.
            </li>
            <li>
              Open <Link className="text-[var(--color-violet)] underline" href="/compare">Compare Experiments</Link> after
              saving a thin-plate and thick-plate result to see resonances shift.
            </li>
            <li>
              Try <Link className="text-[var(--color-violet)] underline" href="/live">Live Cymatics</Link> with a
              whistled steady tone versus normal speech to compare a stable pattern against broadband, shifting energy.
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
