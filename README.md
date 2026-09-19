# Resonance Lab — Live Audio & Cymatics Explorer

A browser-first scientific web app that visualizes live or uploaded audio as simulated Chladni plate
patterns, lets you customize virtual plates, compare experiments, analyze physical cymatics footage,
and save/export everything locally. No account, no server database, no paid API.

## Product overview

Resonance Lab lets you:

- Drive a simulated vibrating plate with your microphone, in real time.
- Upload speech, recitation, music, or tones and inspect waveform/spectrum/spectrogram.
- Configure plate shape, material, dimensions, thickness, boundary, and excitation.
- Compare two or more experiments (plates, sources, or footage) side by side.
- Generate pure tones, harmonic series, sweeps, and noise, and download them as WAV.
- Upload a photograph of a real sand-on-plate experiment and measure the pattern.
- Save experiments locally (IndexedDB) and export JSON/CSV/PNG.

Every result is labeled with one of four evidence categories so simulation is never confused with
measurement: **Measured audio**, **Physics simulation**, **Educational mapping**, **Footage measurement**.
See [`docs/methodology`](app/methodology/page.tsx) in the running app for full definitions and limitations.

## Scientific purpose and positioning

The app is a general-purpose instrument for exploring how sound interacts with vibrating plates. It can
be used with speech, music, recitation, or tones, but it makes no claim that meaning determines a
physical pattern, that any language or passage is scientifically superior, or that a simulation is
proof of what a real plate would do. See `/methodology` for the full scientific-limitations statement.

## Architecture

- **Next.js App Router** (`app/`) — one route per top-level feature, all client-rendered where browser
  APIs (microphone, canvas, IndexedDB) are required; static/server-rendered shell otherwise.
- **`lib/physics`** — plate material presets, flexural rigidity, rectangular and circular modal models
  (pure functions, unit tested).
- **`lib/audio`** — FFT, window functions, RMS/peak/spectral analysis, pitch/fundamental estimation,
  signal generator, WAV encoder, microphone and playback session helpers.
- **`lib/simulation`** — maps detected spectral peaks onto plate modes (frequency proximity × magnitude ×
  modal participation at the exciter position), smooths weights over time, renders a displacement field,
  and derives an estimated sand-density field directly from that displacement (never random geometry).
- **`lib/vision`** — Canvas-based grayscale, background subtraction, Otsu thresholding, connected
  components, edge density, and mirror/rotational symmetry scoring for the physical-footage analyzer.
- **`lib/experiments`** — IndexedDB persistence (via `idb`) for experiment records, media blobs, and plate
  presets.
- **`lib/validation`** — Zod schemas for experiment records and plate configurations (used for both save
  and import validation).
- **`components/`** — shared layout (responsive shell: sidebar / rail / drawer / bottom nav), plate
  viewport (Canvas 2D particle/displacement/nodal renderer), charts (waveform/spectrum/spectrogram,
  Canvas 2D, no charting library dependency), and UI primitives.
- **`hooks/`** — `useLiveCymatics` (full microphone → analysis → plate pipeline for `/live`),
  `usePlateResponse` (source-agnostic peaks → modal weights → displacement field, used by `/simulator`),
  `useAnalyserPeaks` (wraps any Web Audio `AnalyserNode`, mic or playback, into peaks/waveform/RMS).
- **`workers/`** — `simulation.worker.ts`, `audio.worker.ts`, `vision.worker.ts` wrap the pure `lib/`
  functions for off-main-thread use. **Known limitation:** these are implemented but not yet wired into
  the UI — see "Known limitations" below.

## Scientific models and equations

**Rectangular plate** (simply supported, classical Kirchhoff-Love thin-plate theory):

```
D = E h³ / (12(1 - ν²))
f_mn = (π / 2) · sqrt(D / (ρ h)) · (m²/a² + n²/b²)
```

Exact for an idealized simply supported rectangular plate. Reference: Leissa, *Vibration of Plates*,
NASA SP-160 (1969).

**Circular plate** (approximation): radial zeros of the Bessel function J_m give a wavenumber `k`,
applied to the flexural-wave dispersion relation `f = (k² / 2π) · sqrt(D / (ρh))`. This does not solve
the exact clamped/free circular-plate boundary-value problem and is labeled as an approximation
throughout the UI and in `/methodology`.

**Audio → mode mapping**: each mode's weight combines a Gaussian frequency-proximity falloff (in cents),
the matched spectral peak's magnitude, and the mode shape's magnitude at the exciter position (point-force
participation). Weights are smoothed with configurable attack/release. "Scientific response" uses a tight
frequency tolerance; "Demonstration response" widens it for educational visualization and is explicitly
labeled as not a physical prediction.

## Technology

Next.js 16 (App Router) · TypeScript (strict) · React 19 · Tailwind CSS v4 · Web Audio API · Canvas 2D ·
Web Workers (implemented, not yet wired in) · IndexedDB (via `idb`) · Zod · Vitest · Playwright · ESLint.

No Three.js/R3F, no OpenCV.js, no charting library — plate/chart rendering uses hand-written Canvas 2D to
keep the bundle small and the physics/rendering fully inspectable; see "Known limitations."

## Installation and local development

```bash
npm install
npm run dev        # http://localhost:3000
```

## Other commands

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit tests (lib/ physics, audio, vision, validation)
npm run test:e2e    # Playwright end-to-end tests (requires `npx playwright install chromium` once)
npm run build        # production build
npm start             # serve the production build
npm run generate:samples  # regenerate public/samples/*.wav test tones
```

## Microphone permissions

Microphone access is requested only after you explicitly click **Start microphone** on `/live` or select
the Microphone source on `/simulator` — never automatically. All analysis happens locally in the browser;
raw audio is never transmitted and is not retained unless you separately choose to save an experiment
with recorded media. Denied permission is handled gracefully with a visible message and a retry option.
Stopping the microphone stops every `MediaStreamTrack` and releases the `AudioContext`; the same cleanup
runs on component unmount.

## Browser compatibility

Tested against Chromium (desktop and mobile viewport) via Playwright. Built on standard Web Audio API /
Canvas 2D / IndexedDB, which are supported by current Chrome, Edge, Firefox, and Safari (desktop and
mobile). iOS Safari requires the `AudioContext` to be created/resumed from a user gesture, which every
mic/playback entry point in this app already requires. No manual testing was performed on physical iOS or
Android hardware — see "Known limitations."

## Privacy

- No account, no server database, no analytics.
- Microphone and uploaded audio/images are processed entirely client-side.
- Saved experiments live in this browser's IndexedDB; clearing site data removes them.
- Nothing is uploaded to a server as part of this app.

## Exports

- **JSON** — full experiment record or plate configuration (versioned, Zod-validated on import).
- **CSV** — per-experiment measurement tables.
- **WAV** — any generated signal.
- **PNG** — plate viewport snapshots (browser "save image" on the canvas; see `lib/export/exporters.ts`
  for the `canvasToPngBlob` helper used elsewhere).

## Example experiment

1. Open `/audio`, use "Generate a signal" to create a 440 Hz sine, and click **Use in this lab**.
2. Inspect the waveform/spectrum, then click **Send selection to simulator**.
3. On `/simulator`, choose the "Thin square steel plate" preset, set Source to **Uploaded audio**, and
   click **Play selection** to watch the modal response.
4. Click **Save experiment** to persist it, then open `/experiments` to export it as JSON/CSV.

## Testing

- **Unit tests** (`tests/unit/`, Vitest): FFT/peak detection (440 Hz tone recovery), RMS, autocorrelation
  pitch estimation, note-name mapping, signal generator + WAV encoding, rectangular/circular modal
  frequency scaling with thickness and area, modal weighting and smoothing, image thresholding/connected
  components/symmetry, and experiment-record schema validation. All 32 tests pass as of this build.
- **End-to-end tests** (`tests/e2e/`, Playwright, desktop + mobile Chrome projects): landing page,
  navigation across all 10 routes with a unique `<h1>` each, 404 handling, plate shape/thickness editing
  updating the resonance table, Basic/Advanced mode toggling, microphone-permission-denied handling (mocked
  `getUserMedia`), audio file upload and analysis, and invalid-JSON import error handling. All 22 tests
  pass as of this build.
- **Manual microphone test**: not run in this environment (no audio input device / interactive browser
  session available to the agent that built this app). The code path (`hooks/useLiveCymatics.ts`,
  `lib/audio/microphone.ts`) has been exercised via the mocked-permission-denial Playwright test and code
  review, but a live microphone has not been manually verified end-to-end. Please verify on a real device
  before relying on it.

## Scientific limitations

See `/methodology` in the running app for the full statement. In short: consumer microphones are
uncalibrated (dBFS, not dB SPL); plate boundary conditions are idealized; circular-plate frequencies use a
labeled Bessel-zero approximation, not an exact boundary-value solution; image measurements are
uncalibrated pixel statistics; and no result in this app establishes that any language, recitation,
passage, or speaker produces a scientifically superior or uniquely proven physical pattern.

## Vercel deployment (not performed — instructions only)

This repository is Vercel-ready: no persistent backend, no server filesystem dependency, no required
environment variables, `npm run build` succeeds. Deployment was **not** performed as part of this build;
run it yourself when ready:

```bash
vercel          # preview deployment
vercel --prod    # production deployment
```

## Known limitations / simplifications

- **Web Workers implemented but not wired in.** `workers/*.worker.ts` correctly wrap the pure `lib/`
  functions, but `/live` and `/simulator` currently run FFT + modal-field computation on the main thread
  via `requestAnimationFrame`, throttled to a configurable analysis rate (default 24 Hz) with small FFT
  sizes and grid resolutions. This keeps the UI responsive in testing, but wiring the workers in would
  better satisfy the "no blocked interface" goal at high resolution/FFT-size settings.
  - Note: this is an explicit, disclosed scope decision, not an oversight, given the schedule.
- **Circular-plate model is a labeled approximation** (see equations above), not an exact clamped/free
  boundary-value solution.
- **Clamped/free rectangular boundary conditions reuse the simply-supported solution** as a labeled
  approximation; an exact solver for those conditions is not implemented.
- **Physical-footage analysis uses hand-written Canvas 2D image processing**, not OpenCV.js — judged
  sufficient for grayscale/threshold/connected-components/symmetry given the scope, but this means no
  perspective correction, skeletonization, or automatic plate detection are implemented.
- **No Three.js/WebGL renderer** — the plate viewport is Canvas 2D (particles / displacement heatmap /
  nodal contours). This was a deliberate scope decision to keep the bundle light and avoid an unjustified
  heavy dependency; a 2D Canvas fallback was required regardless per the brief.
- **PDF export and video/GIF export are not implemented**; JSON/CSV/WAV export are implemented, PNG export
  is implemented via a documented helper but not wired into every page's UI.
- **Comparison image-similarity metrics (SSIM/IoU) are not implemented**; Compare Experiments shows
  measurement tables and plate snapshots side by side but no automatic image-similarity score.
- No automated accessibility audit tool (e.g. axe) was run; accessibility was implemented per the design
  spec (semantic landmarks, focus states, 44px targets, `aria-live`/`aria-current`, reduced-motion) but not
  independently verified with a scanner.

## Contributing

This is a single-agent-built MVP. Open an issue or PR describing the change and its motivation; keep
scientific claims and evidence labeling consistent with `/methodology` when adding new features.

## License

MIT.
