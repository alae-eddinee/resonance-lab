import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DemoPlate } from "@/components/plates/DemoPlate";
import { RecentExperiments } from "@/components/experiments/RecentExperiments";
import { Button } from "@/components/ui/Button";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";

const ENTRY_PATHS = [
  { href: "/live", title: "Live Cymatics", description: "Drive a simulated plate with your microphone." },
  { href: "/simulator", title: "Plate Simulator", description: "Configure geometry, material, and excitation." },
  { href: "/physical", title: "Real Experiment Analyzer", description: "Measure patterns in uploaded footage." },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1680px] px-4 pt-6 md:px-6 lg:px-8">
      <section className="flex flex-col gap-8 pt-6 md:pt-8 lg:flex-row lg:items-center lg:gap-12">
        <div className="max-w-[34ch]">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            Resonance Lab
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-medium leading-[1.08] md:text-5xl lg:text-6xl">
            See how sound frequencies interact with virtual vibrating plates—in real time.
          </h1>
          <p className="mt-4 text-base text-[var(--color-text-secondary)]">
            Measure audio, explore simulated plates, and compare observations from real footage.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/live">
              <Button variant="primary" className="w-full sm:w-auto">
                Start microphone session
              </Button>
            </Link>
            <Link href="/audio">
              <Button variant="secondary" className="w-full sm:w-auto">
                Upload audio
              </Button>
            </Link>
          </div>
          <Link href="/audio?sample=1" className="mt-3 inline-block text-sm text-[var(--color-violet)] underline">
            Try a sample
          </Link>
          <p className="mt-6 max-w-[42ch] text-xs text-[var(--color-text-muted)]">
            Simulated patterns are mathematical approximations. Physical outcomes depend on the plate, material,
            dimensions, mounting, exciter, amplitude, particles, and environment. Data stays in your browser unless
            you choose to export it.
          </p>
        </div>
        <div className="flex flex-1 justify-center">
          <DemoPlate />
        </div>
      </section>

      <section className="mt-16 border-t border-[var(--color-divider)] pt-8">
        <ul className="divide-y divide-[var(--color-divider)]">
          {ENTRY_PATHS.map((path) => (
            <li key={path.href}>
              <Link href={path.href} className="flex items-center justify-between py-4 hover:text-[var(--color-sand)]">
                <div>
                  <p className="font-medium">{path.title}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{path.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 border-t border-[var(--color-divider)] pt-8">
        <RecentExperiments />
      </section>

      <section className="mt-12 border-t border-[var(--color-divider)] pt-8 pb-16">
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-secondary)]">Evidence categories</h2>
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(
            [
              ["measured-audio", "Waveform, spectrum, RMS, and detected spectral peaks from a real signal."],
              ["physics-simulation", "Plate displacement computed under stated model and boundary assumptions."],
              ["educational-mapping", "Illustrative transformation from sound features to a pattern."],
              ["footage-measurement", "Segmentation and measurements estimated from uploaded footage."],
            ] as const
          ).map(([category, description]) => (
            <div key={category} className="flex flex-col gap-1">
              <dt>
                <EvidenceBadge category={category} />
              </dt>
              <dd className="text-sm text-[var(--color-text-secondary)]">{description}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 max-w-[68ch] text-sm text-[var(--color-text-secondary)]">
          Resonance Lab keeps audio measurements, physics simulations, educational mappings, and footage measurements
          clearly labeled and separate. See{" "}
          <Link href="/methodology" className="text-[var(--color-violet)] underline">
            Methodology
          </Link>{" "}
          for full definitions and limitations, and the{" "}
          <Link href="/hardware" className="text-[var(--color-violet)] underline">
            Hardware Guide
          </Link>{" "}
          for building a physical setup.
        </p>
      </section>
    </div>
  );
}
