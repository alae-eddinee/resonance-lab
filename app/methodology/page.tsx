import { PageHeader } from "@/components/layout/PageHeader";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";

export default function MethodologyPage() {
  return (
    <div>
      <PageHeader title="Methodology" description="Evidence boundaries, algorithms, units, and limitations." />
      <article className="mx-auto max-w-[68ch] px-4 py-6 md:px-6 lg:px-8">
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Evidence types</h2>
          <div className="flex flex-col gap-3">
            <EvidenceBadge category="measured-audio" />
            <EvidenceBadge category="physics-simulation" />
            <EvidenceBadge category="educational-mapping" />
            <EvidenceBadge category="footage-measurement" />
          </div>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            A simulation being driven by real audio does not make its plate response a physical measurement of a real
            plate. It remains a physics simulation computed from measured audio features.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Audio acquisition and spectral analysis</h2>
          <p className="text-[var(--color-text-secondary)]">
            Microphone and uploaded audio are analyzed entirely in the browser using the Web Audio API. Frames are
            windowed (Hann window by default) and transformed with a radix-2 FFT. RMS, spectral peaks, spectral
            centroid, bandwidth, rolloff, zero-crossing rate, and band energies are computed directly from the FFT
            magnitude spectrum. Fundamental frequency estimates use time-domain autocorrelation and are labeled
            &ldquo;Unavailable&rdquo; when no strong periodicity is found. Digital levels are reported in dBFS
            relative to full scale; this is not a calibrated sound-pressure-level (dB SPL) measurement.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Plate models</h2>
          <p className="mb-3 text-[var(--color-text-secondary)]">
            Rectangular plates use the classical simply supported thin-plate (Kirchhoff-Love) solution:
          </p>
          <pre className="mb-3 overflow-x-auto rounded-[var(--radius-sm)] bg-[var(--color-surface)] p-3 text-sm">
{`D = E h³ / (12(1 - ν²))
f_mn = (π / 2) · sqrt(D / (ρ h)) · (m²/a² + n²/b²)`}
          </pre>
          <p className="mb-3 text-[var(--color-text-secondary)]">
            where E is Young&apos;s modulus, h is thickness, ν is Poisson&apos;s ratio, ρ is density, a and b are the
            plate&apos;s side lengths, and m, n are the mode numbers. This is exact for an idealized simply supported
            rectangular plate (Leissa, <em>Vibration of Plates</em>, NASA SP-160, 1969).
          </p>
          <p className="mb-3 text-[var(--color-text-secondary)]">
            Circular plates use an approximation: radial zeros of the Bessel function J_m give a wavenumber k, applied
            to the flexural-wave dispersion relation f = (k² / 2π)·sqrt(D/(ρh)). This does not solve the exact
            clamped or free circular-plate boundary-value problem and is labeled as an approximation throughout the
            interface.
          </p>
          <p className="text-[var(--color-text-secondary)]">
            Clamped and free boundary conditions in the plate editor reuse the simply supported solution as a labeled
            approximation; an exact solver for those conditions is not implemented.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Mapping audio to plate modes</h2>
          <p className="text-[var(--color-text-secondary)]">
            Detected spectral peaks are compared against a plate&apos;s modal frequencies. Each mode&apos;s
            contribution weight combines frequency proximity (a Gaussian falloff measured in cents), the peak&apos;s
            magnitude, and a participation factor from the mode shape evaluated at the exciter position. Weights are
            smoothed over time with configurable attack and release rates. In Scientific response, only modes with
            close frequency matches are meaningfully activated. In Demonstration response, the frequency tolerance is
            widened so more modes respond, which is explicitly labeled as an educational mapping rather than a
            physical prediction.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Video and footage processing</h2>
          <p className="text-[var(--color-text-secondary)]">
            Real Experiment Analyzer processes a single uploaded image (or a chosen video frame) using Canvas-based
            grayscale conversion, box-blur background subtraction, Otsu automatic thresholding (with manual
            override), connected-component labeling, edge density, and mirror/rotational symmetry scoring. This
            implementation does not use a dedicated computer-vision library (such as OpenCV.js); all measurements are
            uncalibrated pixel statistics unless a calibration step is added. Brightness is not displacement, and
            symmetry is not evidence of a specific vibration mode.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Comparison metrics</h2>
          <p className="text-[var(--color-text-secondary)]">
            Compare Experiments shows selected records side by side and lists each record&apos;s measurements without
            computing a single combined similarity score. Frequency similarity does not establish equivalent plate
            response, and visual similarity between patterns is not proof of causal equivalence.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Local data and exports</h2>
          <p className="text-[var(--color-text-secondary)]">
            Experiment records, plate presets, and optionally retained media are stored in this browser&apos;s
            IndexedDB. Nothing is uploaded to a server. Clearing browser data or using private browsing can remove
            saved records. Exports (JSON, CSV, PNG) include the evidence category, units, and model version alongside
            each value.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Limitations</h2>
          <ul className="list-disc space-y-2 pl-5 text-[var(--color-text-secondary)]">
            <li>Consumer microphones are uncalibrated; digital levels are relative, not absolute sound pressure.</li>
            <li>Plate boundary conditions are idealized; real mounting and damping vary.</li>
            <li>Image preprocessing choices (threshold, background subtraction) change measured values.</li>
            <li>Symmetry, complexity, and component counts are descriptive statistics, not proof of a specific mode.</li>
            <li>
              No result in this application establishes that any particular language, recitation, passage, or
              speaker produces a scientifically superior or uniquely proven physical pattern. Comparative claims of
              that kind require controlled, repeated, blind experiments beyond what a single recording or screenshot
              can show.
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
