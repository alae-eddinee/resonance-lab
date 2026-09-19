# Resonance Lab — Design Specification

Implementation baseline for a browser-based, local-first Next.js application. Read alongside [PAGE_LAYOUTS.md](./PAGE_LAYOUTS.md), which defines every route. Values here are normative design decisions; numeric simulation defaults are starting configurations, not validated physical predictions.

## 1. Design context and product personality

**Assumed audience:** curious adults, students, educators, audio practitioners, and experimenters comparing virtual and recorded plate behavior. Basic mode supports a first exploration without physics vocabulary; Advanced mode supports inspectable assumptions and repeatable experiments. The primary setting is a desktop or laptop laboratory session; phones support meaningful capture, exploration, review, and export.

**Brand words:** precise, tactile, composed. The visual reference is an instrument bench with warm sand on a dark plate, legible labels, and carefully separated controls. The emotional outcome is informed curiosity and confidence in what was actually measured.

Use charcoal surfaces, sand particles, matte controls, and a restrained violet selection color. Reserve cyan for measured audio traces. The live plate, rather than decorative illustrations or oversized statistics, supplies the visual identity. Avoid aura imagery, sacred-geometry framing, neon bloom, animated gradients, decorative waveforms, and claims of scientific validation through visual beauty.

Typography direction: instrument labels paired with comfortable editorial explanations. Inter, Space Grotesk, and IBM Plex Mono were rejected as reflex choices; use Barlow for headings and Source Sans 3 for interface text. Monospace is restricted to identifiers and raw numeric exports.

### Design principles

1. **Show the phenomenon first.** The plate is the largest object on workbench pages. Secondary measurements support it without competing with it.
2. **Identify the evidence.** A visible provenance label belongs beside every visual result, chart, saved record, and export.
3. **Make control reversible.** Pause, undo parameter changes, inspect defaults, and preserve work through navigation.
4. **Reveal complexity deliberately.** Basic and Advanced are presentations of the same state, not separate or silently reset experiments.
5. **Keep ownership tangible.** State exactly what is saved in this browser, which media is retained, and what an export contains.

## 2. Scientific language and provenance

Use a shared `EvidenceBadge` with an icon, text, and an accessible description. Labels are semantic; color is supplementary.

| Label | Applies to | Required adjacent explanation |
| --- | --- | --- |
| Measured audio | Waveform, spectrum, RMS, detected spectral peaks | Derived from the selected digital audio signal; microphone and device affect capture. |
| Physics simulation | Plate displacement and simulated particle patterns | Computed under the displayed model, geometry, boundary, and excitation assumptions. |
| Educational mapping | Deliberate mappings from spectral features to an illustrative pattern | Illustrative transformation; not a mechanical plate prediction. |
| Footage measurement | Segmentation, coverage, stability, and calibrated distances from video | Estimates from the selected footage, region, processing settings, and calibration. |

An audio-driven plate shows both `Measured audio` and `Physics simulation` in its header, with the relationship “Audio features drive this simulation.” If the implemented renderer uses only an illustrative formula, label it `Educational mapping`; never call that renderer a physics simulation. Each output must use its actual category independently of its route.

Use “Simulated nodal pattern,” “Spectral peak,” “Coverage within selected region,” and “Compare these recordings.” Do not use “true vibration,” “proven frequency,” “healing pattern,” “unique sacred signature,” or “this recording produces this physical plate.” Never rank languages, speakers, recitations, passages, or traditions by inherent scientific superiority. User-authored titles remain user metadata and must not be presented as product conclusions.

Frequency similarity does not establish equivalent plate response. Symmetry or visual similarity is not identity or causal evidence. Video brightness is not displacement. A detected spectral peak is not automatically a fundamental, a resonant mode, or an external driving frequency. Show “Unavailable” rather than synthesizing missing measurements. Use “Uncalibrated” for pixel-only footage; do not fabricate millimeters or hertz from visual appearance.

`MethodologyLink` opens `/methodology#<relevant-section>` and appears beside model selection, normalization, and CV measurements. Export captions repeat category, source, units, model/version, and calibration status. Include the source interval and acquisition date when available.

## 3. Information architecture and navigation

### Route map

| Navigation group | Route | Navigation label | Primary job |
| --- | --- | --- | --- |
| Overview | `/` | Home | Choose an entry point and understand evidence categories. |
| Explore | `/live` | Live Cymatics | Capture microphone features and drive a simulation. |
| Explore | `/audio` | Audio Laboratory | Inspect uploaded audio and select intervals for simulation. |
| Explore | `/simulator` | Plate Simulator | Configure a virtual plate and controlled excitation. |
| Analyze | `/physical` | Real Experiment Analyzer | Measure visible patterns in uploaded footage. |
| Analyze | `/compare` | Compare Experiments | Compare compatible results and disclosed differences. |
| Library | `/experiments` | Saved Experiments | Find, reopen, duplicate, import, and export local records. |
| Reference | `/learn` | Learn | Build understanding through short explanations and examples. |
| Reference | `/hardware` | Hardware Guide | Plan and document a physical setup. |
| Reference | `/methodology` | Methodology | Inspect methods, limitations, units, and version history. |

### Desktop shell

At widths ≥1280px, `AppSidebar` is fixed at 224px, full viewport height, with its own overflow when needed. Top brand area is 72px high. Route rows are 44px high, with 20px icons, 12px icon/text gaps, 12px horizontal padding, and 8px radius. Group labels use 12px semibold text; groups have 24px separation. An active route has a filled violet-tinted background and `aria-current="page"`, not an accent stripe. The sidebar footer contains `LocalStorageStatus` and `PreferencesButton`.

`AppHeader` sits above the main content at 64px high and contains breadcrumb/current route, a textual capture status when active, and a compact help link. Do not add global search before there is a useful searchable corpus; library search stays in the library. `PageHeader` below supplies the unique h1, short purpose sentence where useful, and page actions. There is exactly one h1 per route.

At 1024–1279px use a 72px `NavigationRail` with labeled tooltips on focus/hover and a 44px “Open navigation” button that expands a 264px overlay drawer containing all labels and groups. Header and content offsets change with the rail. No unlabeled interactive icons.

### Tablet and mobile navigation

At 768–1023px remove the rail. A 56px `CompactHeader` holds menu, page title, and capture indicator. `NavigationDrawer` is 288px wide or `calc(100vw - 32px)`, whichever is smaller. It lists every route and local-storage status; it traps focus, closes with Escape, and restores focus to the menu trigger.

Below 768px use a 56px compact header plus `MobileNavigation` with four equal items: Live, Audio, Saved, More. “More” opens the same drawer with the complete route map including Home. If the current route is not a direct item, More indicates the current section through its accessible name and selected state. Each item contains a 20px icon and 12px visible label. Bar height is 64px plus `env(safe-area-inset-bottom)`; main padding accounts for the full bar. Do not create a second persistent bottom action bar. Page-specific actions live in the viewport toolbar or an inline sticky toolbar above content.

Route changes preserve the active in-memory workspace. They do not start microphone capture or audio output. An active microphone remains visible in the shared header across routes with a “Stop microphone” action. Explicit stopping ends media tracks; page exit/unmount cleanup releases them. No invisible background recording. If a long video analysis continues across routes, show its progress and cancel action in the header.

### Page hierarchy and shared structure

Use `AppShell → PageHeader → Workspace/Article → SupportingDetails`. Workbench pages prioritize (1) source and evidence label, (2) viewport and transport, (3) essential controls, (4) measurements, (5) assumptions/export detail. Reference pages prioritize title, concise explanation, worked diagram/example, related experiment action, then sources and limitations. Do not enclose every paragraph, statistic, or heading in a panel.

## 4. Main user journeys

### A. Live microphone

1. Home “Start microphone session” navigates to `/live`; it does not request permission. The idle plate explains “Use your microphone to drive a simulated plate.” Offer “Start microphone” and a secondary “Use sample audio.”
2. Clicking Start microphone requests permission. Show `PermissionPending` with “Allow microphone access in your browser” and a cancel action. Present an input selector after devices become available; show a generic input label before permission.
3. On success, show a cyan input meter, device name, and `Microphone active` text; drive the gold simulated plate. Monitoring is off. Explain that microphone input is analyzed locally and raw audio is not retained by default.
4. Adjust Basic sensitivity, smoothing, and plate preset. Display a warning in context if the input clips or is too quiet; do not call digital levels sound-pressure measurements.
5. “Freeze visualization” holds the display but does not stop the microphone; the live input meter and microphone status continue. “Stop microphone” releases the device. These are separate controls with explicit labels.
6. “Save experiment” captures configuration, timestamp, numeric snapshot, and thumbnail; show whether raw audio is included. Optional “Record audio for replay” is a separate off-by-default control with elapsed time and stop action. Recorded media is attached only after user review and a successful save.
7. Confirmation reads “Saved in this browser” with “View experiment.” Permission denial offers browser-specific generic recovery instructions, Retry, and Upload audio; never repeatedly prompt automatically.

### B. Audio upload

1. `/audio` accepts an audio file through `FileDropzone` or keyboard-operable “Choose audio.” Initial accepted extensions are WAV, MP3, OGG, M4A, and FLAC; actual decoding depends on browser support. Show the filename, byte size, and local-processing note before analysis.
2. Validate, decode, then display duration, channel count, sample rate, waveform, and a stopped playhead. Never autoplay.
3. User previews playback, sets an interval using handles or Start/End numeric time fields, and inspects waveform, spectrum, and spectrogram. “Whole file” resets the interval. Frequency/time cursor values remain available by keyboard.
4. “Send selection to simulator” opens `/simulator` with the exact source ID, interval, channel mix, normalization choice, and provenance preserved. Do not silently trim, resample, normalize, or pitch-shift.
5. User configures the plate and saves a snapshot or repeatable experiment. If source media is not retained, explain that later playback requires reattaching the original. Export supports separate settings, metrics, image, and a replayable bundle where media is available.

### C. Plate customization

1. `/simulator` begins with the “Ideal square plate” preset and synthetic sine excitation; the renderer identifies its model and limits. Source options are Tone, Uploaded audio, and Microphone; switching source is explicit and retains inactive source settings.
2. Basic mode exposes plate preset, drive frequency, excitation level, boundary preset, and reset. The viewport offers particle/displacement view and a direct excitation-position control paired with X/Y numeric fields.
3. Advanced mode expands Geometry, Material, Boundary, Excitation, Solver, and Rendering sections. Dim unsupported controls with a reason such as “This model uses normalized units.” Never show a physically named parameter as operative if the selected solver ignores it.
4. Parameter changes mark the result Updating, then Settled. Cheap visualization adjustments apply immediately; expensive mesh/model changes use an explicit “Apply plate changes” button, preserving the last computed image with an Updating label.
5. “Save as preset” stores local configuration; “Save experiment” stores configuration plus current result and source provenance. Undo returns to the preceding applied parameter state; “Reset plate” opens a confirmation only when it would discard unsaved configuration.

### D. Experiment comparison

1. Select two to four saved experiments in `/experiments`, then choose “Compare selected,” or add records through named slots in `/compare`.
2. `ComparisonCompatibility` summarizes source types, model versions, units, interval lengths, calibration, and normalization. Different evidence categories may be displayed side by side, but are not given a shared numerical similarity score by default.
3. Side-by-side is the initial view. “Link time” becomes available only for records with timelines; time-zero offsets are editable and shown. Use a common overlapping interval, stop at its end, and do not stretch time to force alignment.
4. Compatible charts can use Overlay with explicit shared axes and units. Image difference requires matched dimensions/registration, a declared alignment method, and an explicit action; similarity is an image metric, not proof of equivalent physical behavior.
5. Save the comparison with selected record IDs and view configuration. Export includes assumptions and excluded/unavailable metrics. Comparison export never turns missing values into zeros.

## 5. Design tokens

Use CSS custom properties with these semantic names. Hex values are canonical dark-theme values. If generating interaction shades, use perceptual OKLCH interpolation and retain contrast; do not generate arbitrary translucent foreground text. Dark is the launch theme. A high-contrast/forced-colors treatment is required; an unimplemented light-theme toggle is not.

### Color

| Token | Hex | Use |
| --- | --- | --- |
| `--color-bg` | `#101113` | Application canvas |
| `--color-surface` | `#191B1F` | Control panels, navigation |
| `--color-surface-raised` | `#22252B` | Menus, dialogs, expanded controls |
| `--color-surface-hover` | `#2B2F36` | Interactive hover surface |
| `--color-plate` | `#141516` | Viewport interior |
| `--color-divider` | `#373C45` | Decorative separators only |
| `--color-border-control` | `#7A8290` | Required input/control outlines |
| `--color-text` | `#F2F0EA` | Main text |
| `--color-text-secondary` | `#BBC0CA` | Supporting text, axis labels |
| `--color-text-muted` | `#9BA3B0` | Metadata, placeholders; never lower opacity |
| `--color-ink-on-accent` | `#171419` | Text on filled bright accents |
| `--color-sand` | `#DCC38E` | Particles, primary action fill |
| `--color-sand-hover` | `#E9D5AB` | Primary hover |
| `--color-sand-pressed` | `#CDB17A` | Primary pressed |
| `--color-violet` | `#B8AAF4` | Selection, educational mapping series |
| `--color-violet-surface` | `#302B43` | Selected navigation/tab background |
| `--color-cyan` | `#85CBD2` | Measured audio trace |
| `--color-success` | `#9BC5A3` | Completed/saved state |
| `--color-warning` | `#E6BC78` | Clipping, incomplete calibration |
| `--color-danger` | `#F09B98` | Errors, destructive actions |
| `--color-focus` | `#D5C9FF` | Keyboard focus outline |
| `--color-overlay` | `#101113CC` | Modal scrim only |

At least 80% of the interface surface should remain neutral. Gold occupies the visualization and the single highest-priority action; violet is a restrained state cue. Cyan traces have no glow. Evidence badges use text on neutral surfaces, a 12px symbol, and a 1px outline. Category color never replaces its label.

Required contrast targets are 4.5:1 for normal text, 3:1 for large text and essential graphics/control boundaries. Check actual adjacent rendered colors, including hover/disabled/overlay states. Decorative divider color is not sufficient for an input boundary. Use dark text on gold, violet, or cyan filled buttons; do not place off-white text on those fills.

### Typography

Self-host font assets with `next/font/local`; use `font-display: swap`. Font catalog references: [Barlow](https://fonts.google.com/specimen/Barlow) and [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3). Heading stack: `"Barlow", "Helvetica Neue", sans-serif`; body stack: `"Source Sans 3", "Segoe UI", sans-serif`. Use `ui-monospace, SFMono-Regular, Consolas, monospace` only for IDs and raw code/data. Package only required weights: Barlow 500/600 and Source Sans 3 400/600/700, or corresponding variable subsets.

Root size is 16px and must honor browser preferences. Numeric readouts use `font-variant-numeric: tabular-nums lining-nums`. Keep units in the same text run separated by a nonbreaking space.

| Role | Size | Line height | Weight / treatment |
| --- | --- | --- | --- |
| Home display | `clamp(2.5rem, 4vw, 4rem)` / 40–64px | 1.08 | Barlow 500, −0.025em |
| Article title | `clamp(2rem, 3vw, 3rem)` / 32–48px | 1.15 | Barlow 500, −0.02em |
| App h1 | 2rem / 32px | 2.5rem / 40px | Barlow 600; mobile 1.75rem/2.125rem |
| Section h2 | 1.5rem / 24px | 2rem / 32px | Barlow 600 |
| Panel h3 | 1.125rem / 18px | 1.5rem / 24px | Source Sans 3 600 |
| Body/input/button | 1rem / 16px | 1.5rem / 24px | Source Sans 3 400/600 |
| Compact label/axis | 0.875rem / 14px | 1.25rem / 20px | Source Sans 3 400/600 |
| Metadata/navigation group | 0.75rem / 12px | 1rem / 16px | Source Sans 3 600 |
| Main instrument readout | 2rem / 32px | 2.5rem / 40px | Source Sans 3 600, tabular |

Long-form content has a 68ch maximum measure, 1.65 line height, and 16px paragraph spacing. Headings are sentence case. Uppercase is allowed only for short group labels with 0.06em tracking. Do not shrink scientific annotations below 12px to fit.

### Spacing, dimensions, radius

| Token | px / rem | Typical use |
| --- | --- | --- |
| `--space-2xs` | 4 / 0.25 | Icon adjustment, label-to-unit gap |
| `--space-xs` | 8 / 0.5 | Related inline controls |
| `--space-sm` | 12 / 0.75 | Field label/help relationships |
| `--space-md` | 16 / 1 | Mobile page gutter, field groups |
| `--space-lg` | 24 / 1.5 | Panel padding, tablet gutter |
| `--space-xl` | 32 / 2 | Desktop page gutter |
| `--space-2xl` | 48 / 3 | Workbench section separation |
| `--space-3xl` | 64 / 4 | Editorial section separation |
| `--space-4xl` | 96 / 6 | Home section separation |

Use 8px between label and input, 8px between input and helper/error, 20px between form fields, 24px between related panels, and 48px between independent content sections. Dense workbench panel gaps may be 16px. Set `min-width: 0` on grid children.

Radius tokens: `--radius-xs: 4px` for badges; `--radius-sm: 8px` for controls and menus; `--radius-md: 12px` for bounded panels; `--radius-lg: 16px` for dialogs; `--radius-full: 999px` only for switches and small status dots. The viewport uses 8px corners. Shape controls show real plate outlines instead of generic circular icon containers.

### Elevation and layers

| Token | Shadow | Use |
| --- | --- | --- |
| `--shadow-none` | `none` | Most surfaces, panels, sidebar |
| `--shadow-menu` | `0 8px 24px #08090B52` | Popovers and menus |
| `--shadow-dialog` | `0 24px 64px #08090B80` | Blocking dialogs and drawers |

Separate normal surfaces with tone and a 1px divider. Glass treatment is allowed only on the compact viewport HUD: `background: #191B1FEF; backdrop-filter: blur(8px)` with opaque fallback. No backdrop blur on charts or scrolling control panels. Layers: content 0, viewport HUD 10, sticky toolbar 20, shell/mobile navigation 30, popover 50, modal scrim 70, modal 80, toast 90. Tooltips inside dialogs belong to the dialog portal/layer.

### Motion

Hover/focus color: 120ms. Menu/tooltip: 160ms. Drawer: 220ms. Use `cubic-bezier(0.22, 1, 0.36, 1)` and opacity/transform. No bouncing, pulsing active-microphone lights, staggered dashboard entrances, or animated numbers. Parameter values update immediately; chart redraw is separate from text updates.

The simulation can animate continuously while explicitly running; decorative home previews begin paused with a Play preview control. Target 60fps where feasible, with an adaptive 30fps quality mode and a user-visible quality setting. Reduce particle count/render resolution before dropping interaction responsiveness. Respect reduced motion by removing interface transitions and starting previews frozen; users may explicitly run scientific motion and can always pause it. Do not interpolate science data for cosmetic animation.

## 6. Core components, forms, and control behavior

### Shared component inventory

`AppShell`, `AppSidebar`, `NavigationRail`, `NavigationDrawer`, `CompactHeader`, `MobileNavigation`, `PageHeader`, `EvidenceBadge`, `MethodologyLink`, `SourceSelector`, `SourceSummary`, `BasicAdvancedSwitch`, `PlateViewport`, `ViewportToolbar`, `TransportControls`, `InputLevelMeter`, `ParameterField`, `ControlSection`, `ChartPanel`, `ChartDataTable`, `StatusMessage`, `FileDropzone`, `ExperimentPicker`, `SaveExperimentSheet`, `ExportMenu`, `LocalStorageStatus`, `ConfirmDialog`, and `ToastRegion` form the shared vocabulary. Route-specific components are detailed in PAGE_LAYOUTS.

`BasicAdvancedSwitch` is a two-button segmented control with a programmatic selected state. Persist the preference locally. Basic shows 4–6 essential controls; Advanced adds labeled collapsible sections in the same control panel. Returning to Basic preserves every setting and displays “Advanced settings active” plus Review when nondefault hidden settings affect the result. The mode switch never restarts input or computation.

### Forms

Inputs/selects are 44px minimum high, 100% of available width, 12px horizontal padding, 8px radius, surface background, and 1px control border. Textareas are at least 104px high. Place visible labels above fields; placeholder text is never the label. Units appear as a suffix with accessible descriptions; values are stored numerically and parsed with locale-aware display handling.

Primary button: gold fill and dark ink. Secondary: raised surface, control border, main text. Tertiary: text on transparent background with hover surface. Destructive: danger-colored text on neutral surface; a destructive confirmation uses danger fill with dark ink. Every button is ≥44px high; icon-only buttons are 44×44px. Busy actions keep their width and show a spinner plus a verb such as “Saving…”; disable only the repeated action, not the entire page.

Every slider is paired with a numeric input; rail is 4px high with a 20px visible thumb inside a 44px target. Label range endpoints and units. Arrow keys take one step; Page Up/Down take ten; Home/End use bounds. Log-frequency sliders explicitly say “Log scale”; numeric input remains linear in hertz. Validate on blur or Apply, preserve invalid input for correction, and show an inline error linked with `aria-describedby`. Do not silently clamp a typed value.

Use native checkboxes for independent options, radios for mutually exclusive presets, and switches only for immediate on/off state. Custom select popovers must retain native-equivalent keyboard behavior. Tooltips supplement visible labels and open on focus; crucial limitations remain inline.

### Baseline control defaults

These are UI defaults; the selected model declares which controls and ranges it actually supports.

| Control | Starting value | UI range / behavior |
| --- | --- | --- |
| Control mode | Basic | Basic / Advanced; per-browser preference |
| Renderer view | Particles | Particles / Displacement / Nodal contours, only if supported |
| Ideal plate | Square | Ideal square / Ideal circular / Custom supported geometry |
| Boundary | Simply supported | Only model-supported choices; changing it recomputes |
| Tone frequency | 220 Hz | 20–2,000 Hz log slider; 1 Hz typed step; synthetic excitation only |
| Excitation level | 0.25 normalized | 0–1, step 0.01; never mislabeled force in newtons |
| Excitation position | x = 0.35, y = 0.40 | Normalized 0–1, step 0.01; center origin conventions visible |
| Input sensitivity | 1.0× | 0.1–4.0×, step 0.1; simulation gain, not microphone hardware gain |
| Spectrum smoothing | 0.6 | 0–0.95, step 0.05; expose exact algorithm in methodology |
| FFT size | 2,048 samples | 1,024 / 2,048 / 4,096 / 8,192; show frequency/time tradeoff |
| Monitor audio | Off | Explicit enable with volume initially 20%; independent of simulation |
| Retain original media | Off | Save-sheet opt-in with estimated byte size |
| Render quality | Auto | Auto / Low / High; affects rendering, not stored measurements |

Normalized coordinates use top-left origin, +x right, +y down in plan view; show that convention in the position editor and exports. For calibrated mechanical models, offer physical dimensions and material constants only with solver-supported ranges and explicit units. Do not guess physical defaults to dress up an illustrative model. Particle density and color are rendering parameters and belong in Rendering, separate from physical assumptions.

### Save, export, and local data

`SaveExperimentSheet` is a 480px side sheet on desktop and a full-screen dialog on mobile. Fields: title (required, 1–120 characters, suggested local timestamp title), optional tags, notes, source summary, evidence category, included data summary, and original-media retention toggle with size. Save is enabled only once the minimum result/configuration exists. A settings-only preset is labeled as such.

An experiment record includes ID, schema version, created/updated timestamps, title/tags/notes, evidence category, source metadata and interval, audio processing settings, model/version/seed and parameters, measurement definitions/units, calibration/ROI/CV settings where relevant, snapshot thumbnail, and optional media blob reference. A snapshot without recorded media is not advertised as replayable. On reopen, offer Snapshot view or Re-run when inputs and the model are available. Re-run creates a derived result rather than overwriting historical measurements.

Persist records and media in IndexedDB. Do not show Saved until the write transaction succeeds. `LocalStorageStatus` states “Stored in this browser” and, if available, estimated usage/quota; estimates are labeled. Browser data clearing and private browsing can remove records. Offer Export all from Saved Experiments; no account, sync, or cloud indicators.

Exports: PNG with legible provenance caption; CSV with metric definitions and units; versioned JSON for settings/metadata; ZIP bundle for JSON, metrics, images, and explicitly included available media. Use a manifest to distinguish missing source media from corruption. Export progress is cancellable when long. Treat user filenames as text; sanitize export filenames. Raw audio and video never upload to a service as part of the described product.

Import validates schema/version, media references, units, and file size before commit. Duplicate IDs offer “Import as copy” or Cancel; replacement is never automatic. Compare-only configurations retain references and report missing/deleted source records. Delete has a confirmation with affected comparisons and retained media count; do not remove shared blobs still used by another experiment.

## 7. Chart and visualization guidelines

`ChartPanel` consists of title + evidence label, optional series/scale controls, plot, axis labels with units, caption/status, and “View data” disclosure. Standard plot height is 200px desktop, 180px tablet, 160px mobile. Spectrograms use 240/220/200px respectively. Reserve 48px left and 28px bottom for axes; grow left gutter to 64px for long labels. Use 14px labels where space permits and never less than 12px.

- Background: `--color-surface` or plate surface, without gradients behind traces. Grid: 1px decorative divider at no more than 4–6 major ticks per axis. Plot boundary/control handles use stronger contrast. Avoid unnecessary minor grids.
- Audio waveform/spectrum: cyan, 2px stroke. Simulation curve: sand, 2px. Additional comparison series: violet then success green; differentiate solid, dashed (6/4), dotted (2/4), and dash-dot (8/3/2/3), with visible legend labels A–D.
- Spectrogram magnitude ramp, low to high: `#171A24 → #37466A → #657E91 → #ACB99E → #F0D99B`. Include a labeled color scale and units; “dBFS” only where the calculation is defined relative to digital full scale. Floor values should say “≤ floor,” not negative infinity in tooltips.
- Use diverging displacement ramp `#89BED1 → #25282F → #DCC38E`, center labeled zero, signed values, and nodal contours when useful. The color scale must not imply footage provides displacement.
- Spectrum x-axis supports Log/Linear; default Log, minimum 20Hz where applicable, maximum Nyquist, with DC reported separately if needed. Do not take log(0). Display actual sample rate and FFT/window choice in metadata. Spectrum y-axis shows its declared magnitude convention, not generic “Intensity.”
- Waveform y-axis is normalized digital amplitude (−1 to 1); time is seconds or mm:ss. Input meters use dBFS and a text clipping state. Never display dB SPL without a supported calibrated acquisition path.
- Time-series comparisons default to common axis limits only when units/definitions match. Independent axes require a visible “Independent scales” label. Normalization is opt-in with method/reference and original units preserved.
- Hover/focus cursor shows series, timestamp/frequency, value, and unit; click/pin holds a readout. Keyboard arrows move through samples/bins, Escape clears pin. Provide interval fields and zoom buttons as alternatives to dragging/pinching.
- Missing samples break the trace; show “No measurement” in the tooltip/data table. Downsample display data while preserving extrema; disclose display aggregation and retain full available exported data.
- Provide an accessible table or paginated/downloadable data view plus a concise prose summary. Do not put every rendered point in the accessibility tree or announce each audio frame.

`PlateViewport` has a header outside the canvas containing title, source/evidence, and model status; the canvas itself reserves no oversized text overlays. Geometry occupies approximately 75–85% of the available shorter dimension, with room for boundary/excitation markers. HUD controls use opaque enough backgrounds to stay readable. Provide a text alternative with plate shape, boundary, frequency/source, model category, and frozen/running status. Fullscreen includes an accessible exit control and transport; browser fullscreen denial falls back to an expanded in-page view.

## 8. Accessibility and input support

Target WCAG 2.2 AA in implementation. Use semantic landmarks, skip link, a unique h1, ordered headings, visible labels, and meaningful link names. Every route action works with keyboard, pointer, and touch. Focus is a 2px `--color-focus` outline with 3px offset; do not clip it inside overflow containers. Sticky headers/footers must not obscure focused controls; use scroll padding and `scroll-margin-top`.

Minimum target size is 44×44px for app controls with 8px separation where space permits. Text zoom to 200% and reflow at 320 CSS px must preserve actions and content. Allow scientific data tables to scroll within a labeled region; provide a stacked alternative on mobile. No whole-page horizontal overflow.

Dialogs/drawers trap focus, expose accessible names, close with Escape unless an active destructive commit must finish, and restore focus. Use inline panels for routine configuration. Announce state changes with polite live regions; errors requiring immediate action use assertive alerts sparingly. Throttle changing numeric text to 2 updates/second maximum and never live-announce continuous meters. “Announce current measurements” provides an on-demand summary.

Color, sound, animation, and hover are never the only conveyors of state. Microphone-active state includes text and an icon. CV masks can toggle between color overlay and outline/hatching. Selection includes checkmarks or shape/line changes. Preserve browser forced colors for the shell and controls; canvas content retains explicit textual/data alternatives. No flashing effects. Audio is user initiated, separately muteable, and clearly shown when playing.

Support text direction for user titles/notes using `dir="auto"`; preserve LTR numeric scientific fields. Dates display in the user's locale with timezone in details; exports use ISO timestamps and explicit units. Long names wrap in detail views; table ellipsis always has an accessible full label and an inspectable detail view.

## 9. Responsive system

| Range | Shell and gutters | Workbench behavior |
| --- | --- | --- |
| 320–479px | Compact header + bottom nav; 16px gutters | One column, viewport first, essential controls then charts; dialog becomes full screen |
| 480–767px | Same shell; 16px gutters | One column; compatible paired fields may share a row at ≥480px |
| 768–1023px | Compact header + drawer; 24px gutters | Two columns only when main can retain ≥440px and controls ≥280px; otherwise stack |
| 1024–1279px | 72px rail; 24px gutters | Main viewport + 300px controls, 16px gap; supporting charts below |
| 1280–1535px | 224px sidebar; 32px gutters | Main viewport + 320px controls, 24px gap |
| ≥1536px | Sidebar; 32px gutters | Controls up to 352px; workspace max-width 1680px, centered within available main area |

Use `minmax(0, 1fr)` for the main workspace track. At tablet widths, a container query at 736px workspace width allows a 440px main track + 280px controls + 16px gap; below it stack. A nested component should respond to its container, not assume desktop width because the viewport is wide.

Desktop plate height is `clamp(400px, 58dvh, 720px)`; at short landscape heights (<700px), allow 320px and normal page scrolling. Tablet plate is at least 360px when side-by-side, or square when stacked. Mobile viewport width fills its container; drawing region is `aspect-ratio: 1`, with toolbar outside. In short mobile landscape, cap drawing region at 65dvh and retain scrollable access to all controls. Never lock document scrolling for a workbench. Avoid two simultaneous scrollable control columns; use page scrolling and a sticky control summary only when it fits.

Mobile hides no capability: dense controls move into full-width accordions, secondary actions into labeled menus, comparisons into explicit A/B selectors and stacked synchronized frames. Sticky items stop sticking when text zoom or available height would obstruct content. All safe-area insets are included in header/footer/dialog padding.

## 10. Empty, loading, error, and recovery patterns

| Situation | Pattern and exact example | Available action |
| --- | --- | --- |
| No source | Quiet plate outline, no fake data: “Choose audio or start your microphone to begin.” | Start microphone / Choose audio / Use sample |
| Empty library | One short explanation: “Your saved experiments will appear here. They stay in this browser.” | Start an experiment / Import bundle |
| Empty comparison | Two outlined named slots A and B; no blank charts | Add experiment in each slot |
| No search matches | “No experiments match these filters.” Preserve filters/query | Clear filters |
| Permission pending | Stable viewport, spinner and browser-permission instruction | Cancel / Use audio file |
| Decoding/analysis | Filename, stage label, determinate progress only where measurable | Cancel; leave prior result readable |
| Computing simulation | Last result dimmed only slightly with “Updating simulation”; disable saving as current until ready | Cancel pending computation / revert |
| No useful signal | “Input is very quiet. Check the selected microphone or increase simulation sensitivity.” | Device selector / sensitivity |
| Silence in audio | Zero-level measured signal labeled “No peak detected”; simulation status explains input | Select another interval |
| Clipped signal | Warning beside meter: “Input is clipping; measurements may be distorted.” | Input guidance; no alarming animation |
| Unsupported/corrupt file | Filename and “This browser could not decode this file.” Keep prior workspace | Choose another file / conversion guidance |
| CV finds no pattern | “No reliable segmented pattern in this region.” Show original frame and settings | Adjust region/threshold; no confidence invented |
| Storage failure | “Could not save in this browser. Your current session is still open.” | Retry / Export now / Manage storage |
| Source media missing | Saved thumbnail and settings remain readable; “Reattach original audio to replay.” | Reattach / Open snapshot |
| Renderer unavailable | Text/data controls stay available; “Plate rendering is unavailable on this device.” | Retry / reduced-quality renderer if implemented |
| Analysis interrupted | Preserve configuration and completed results labeled partial | Resume when supported / Restart / Export partial |

Loading skeletons preserve layout and have no shimmer under reduced motion. Do not put synthetic measurements inside loading placeholders. Toasts acknowledge transient success for 5 seconds and pause dismissal on hover/focus; persistent failures belong inline and never disappear automatically. Use a status region for save/export results. Destructive changes get a named confirmation describing the affected item count, not a generic “Are you sure?”

Files above 100MB prompt a local resource notice and explicit Continue before decoding; this is a product threshold, not a browser limit. Offer trimming/chunk processing only if implemented; otherwise offer a smaller file. Display real stage progress, not invented percentages. Cancel releases decoding/rendering work where supported and resets the busy state without destroying the prior experiment.

## 11. Implementation acceptance criteria

- All ten routes use the same navigation, tokens, provenance vocabulary, and focus behavior.
- A first-time user can start a microphone session, upload audio, change a virtual plate, save locally, and compare two records without Advanced mode.
- Every scientific output declares category, source, meaningful units, and limitations; no unsupported model parameter appears to affect results.
- Permission denial, silence, decode failure, missing media, quota failure, unavailable rendering, and cancelled computation have usable recovery paths.
- At 320, 390, 768, 1024, 1280, and 1536px, the viewport remains prominent, controls remain reachable, and only designated data regions scroll horizontally.
- Keyboard-only use, 200% text zoom, reduced motion, contrast, accessible chart alternatives, and screen-reader status announcements are verified on the implemented UI.
- Local saves are confirmed only after persistence succeeds; exports preserve provenance and missing-media status.
