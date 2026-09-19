# Resonance Lab — Design QA review

Reviewed 19 September 2026 against [DESIGN_SPEC.md](DESIGN_SPEC.md) and [PAGE_LAYOUTS.md](PAGE_LAYOUTS.md).

## 1. Summary verdict

**A coherent visual foundation, but not ready for design sign-off.** Charcoal surfaces, warm sand particles, restrained violet selection, and plain scientific language establish the intended instrument-bench character. The biggest shortcomings are scientific state/provenance ambiguity, a badly proportioned home introduction, and mobile workbenches that put essential controls after lengthy diagnostics. Several empty states explain too little to help a first-time user proceed.

All fourteen supplied screenshots were reviewed: Home, Live, Audio, Simulator, Physical, Experiments, and Methodology at desktop and mobile sizes. File names below are relative to `docs/screenshots/`; “both” means the desktop file and its `mobile/` counterpart. Targeted source inspection corroborated tokens, type sizes, control dimensions, navigation, and evidence labels. This is a screenshot-led review, not an interaction or WCAG certification. Keyboard behavior, actual touch hit regions, audio capture, populated analysis, and intermediate breakpoints require separate testing. Mobile image pixels must not be confused with CSS pixels because device scale and image presentation differ.

The fixed mobile navigation appearing partway down a full-page capture is **not evidence that it is positioned halfway down the actual page**. It is captured at the original viewport bottom. Obscured content is identified below as a verification requirement, not proof that it cannot be reached by scrolling.

## 2. Specific issues and concrete fixes

### 1. [P0] One simulator result carries conflicting evidence categories

- **Screenshots:** `simulator.png`, `mobile/simulator.png`; compare the taxonomy in both Methodology captures.
- **Problem:** “Thin square steel plate” is followed by both **Educational mapping** and **Physics simulation**, with no explanation of which output each label describes. A synthetic tone does not by itself make the resulting model an educational mapping. The viewer cannot tell what scientific claim belongs to the visible particle pattern. Source inspection confirms the first badge is selected from source type while the second is unconditional.
- **Fix:** Separate a source caption (“Synthetic tone · 220 Hz”) from the result's actual evidence category. If displacement is modeled but particle placement is illustrative, label those outputs separately and explain that relationship immediately below the viewport. Show model name/version, boundary assumption, and a contextual Methodology link. Derive provenance from the calculation/rendering mode, not simply Tone versus Microphone.

### 2. [P0] Idle Live state presents an unmeasured numeric result

- **Screenshots:** `live.png`, `mobile/live.png`.
- **Problem:** “No microphone active” and “No measurement” coexist with a populated particle field and **Spectral centroid 0.0 Hz**. The fundamental says “Unavailable,” so missingness is inconsistent. The particles also have no adjacent idle explanation; they look like an output even though there is no source.
- **Fix:** Display “Unavailable” for centroid until a valid measurement exists. Keep model-derived resonance frequencies, but label them “Predicted plate resonances.” Replace idle particles with the specified quiet plate outline and “Start your microphone to drive this simulation,” or explicitly identify them as an idle particle distribution with no measured input. Explain “Audio features drive this simulation” once capture begins.

### 3. [P1] Home headline overwhelms the desktop composition and delays the mobile demo

- **Screenshots:** `home.png`, `mobile/home.png`.
- **Problem:** The desktop headline occupies roughly nine lines in a narrow text column. The 640px plate consumes most of the available opening width; the two button labels wrap, and the entry-path list begins below a very tall introduction. Mobile retains a long headline and a narrow copy/button column, followed by a full disclaimer before the plate. The phenomenon arrives too late.
- **Fix:** Restore the specified “Explore sound. Inspect the pattern.” headline. Use the specified balanced grid with a minimum 300px text track and a flexible plate track instead of letting the demo squeeze the introduction. Allow the plate to shrink at 1280px. On mobile, use the full content width for stacked buttons, 24px intro top spacing, and a short adjacent simulation caveat; place the detailed limitations after the demo. Keep the source/evidence caption visible beside the plate.

### 4. [P1] Mobile essential controls come after all measurements

- **Screenshots:** Both Live and Simulator pairs, especially `mobile/live.png` and `mobile/simulator.png`.
- **Problem:** Live puts two tall empty charts, metrics, and eight resonance rows before Basic/Advanced and sensitivity. Simulator puts ten resonance rows before its preset and drive-frequency controls. Adjusting an experiment requires repeated long trips between the plate and its controls. Desktop's right control column works; its column stacking order does not.
- **Fix:** Use the specified DOM order: source → plate/transport → essential controls → measurements → assumptions. Place desktop controls in the right grid area without changing meaningful keyboard order. On mobile, use Waveform/Spectrum tabs and a collapsed resonance disclosure after Basic controls.

### 5. [P1] Simulator has no visible run/pause transport or audible-output status

- **Screenshots:** `simulator.png`, `mobile/simulator.png`.
- **Problem:** The toolbar shows only View. The image already contains a formed pattern, but no visible Run/Pause control or running/stopped state explains how to operate it. Tone selection offers no “Audio output off” status. Screenshots cannot establish whether it is moving or audible, which is precisely the clarity problem.
- **Fix:** Add Run/Pause simulation, explicit state text, Reset particles, and Fullscreen outside the canvas. Add a source summary with tone frequency and audible-output status. Keep Reset plate distinct from Reset particles. The initial state should be stopped as specified.

### 6. [P1] Basic simulator mode exposes advanced geometry/material controls

- **Screenshots:** Both Simulator captures.
- **Problem:** Basic contains preset, source, frequency, excitation level, shape, width, thickness, material, and two position sliders. Meanwhile the boundary assumption is not visible. The mobile screen becomes a long form with no visible reset action or grouping.
- **Fix:** Keep preset, boundary, frequency, excitation level, and a grouped excitation-position editor in Basic. Move shape/dimensions/thickness/material into named Advanced sections. Place Undo and Reset plate at the control footer. Show the current boundary beside the viewport so model assumptions remain legible even when controls collapse.

### 7. [P1] Shared numeric inputs and segmented controls are undersized

- **Screenshots:** Both Live, Simulator, and Audio pairs.
- **Problem:** Numeric entry boxes for frequency, sensitivity, dimensions, and amplitude are visibly shorter than selects/buttons. Source confirms approximately 30px-high number fields (`text-sm`, `py-1`, border), versus the specification's 44px target. Basic/Advanced buttons use approximately 36px-high content. The small slider thumb alone is not a target-size failure: the range input already has a 44px-high box.
- **Fix:** Give numeric inputs and each segmented button a minimum 44px height; use 96px-wide numeric fields on mobile where specified. Keep 16px input text and adequate space for units. Verify actual hit rectangles and focus visibility at 390px, 320px, and 200% text zoom.

### 8. [P1] Body, control, and panel typography is flatter and smaller than specified

- **Screenshots:** All pairs; clearest in Live chart headings, Simulator tables, and empty Experiments copy.
- **Problem:** Panel titles look nearly the same size as labels. Source confirms 14px chart titles instead of the specified 18px, and 14px select/number text instead of 16px. Essential scientific qualifications are small and visually subordinate. This makes the app feel like a compressed settings form despite substantial unused space.
- **Fix:** Restore the hierarchy: 18px panel titles, 16px body/input/button text, 14px compact labels, and 12px metadata only. Use the specified Source Sans 3 panel-title role and Barlow page/section headings. Keep important limitations at 14–16px with readable line height; do not solve dense tables by shrinking annotations further.

### 9. [P1] Resonance table wastes space on repeated prose and loses column separation on mobile

- **Screenshots:** `simulator.png`, `mobile/simulator.png`; secondarily both Live captures.
- **Problem:** Every Simulator row repeats “Exact for an idealized simply supported rectangular plate.” On mobile, mode identifiers split across lines and the Frequency/Limitation headings almost run together. Small gold dots beside 239.9 Hz lack a visible legend. The repeated caveat dominates the table without making the model easier to understand.
- **Fix:** Put the shared assumption in one readable table caption. Use columns Mode, Predicted frequency (Hz), and Status; use explicit “Active” text rather than an unexplained dot. Keep each mode identifier together. On mobile use stacked labeled rows or a clearly labeled local scrolling table with enough column padding. Preserve caveats next to the results.

### 10. [P1] Live input status lacks useful framing

- **Screenshots:** `live.png`, `mobile/live.png`.
- **Problem:** The thin level meter ends in a bare dash without a visible unit. On mobile it shares a row with Start microphone rather than becoming the specified full-width level strip. The disabled Save experiment action has no visible explanation. “Scientific response” is both the field label and selected value, but does not tell a beginner what changes.
- **Fix:** Label the meter “Input level (dBFS)” and idle value “No input”; use a full-width Start/Stop action and meter on mobile. Add “Start a session to save a result” beside disabled Save. Rename the field “Response mode” and add a short explanation of model-based versus illustrative response, linked to the relevant method.

### 11. [P1] Empty chart framing is inconsistent and consumes too much mobile space

- **Screenshots:** `live.png`, `mobile/live.png`.
- **Problem:** Waveform and Spectrum have appropriate evidence badges, but “No measurement” sits at different vertical positions; only Waveform shows a baseline. Two large mostly empty cards postpone useful controls on mobile. Neither explains how to obtain data. This finding concerns framing, not the absence of traces during capture.
- **Fix:** Use a shared plot/header/caption layout with aligned empty-state text. Add “Start microphone to view measured audio.” Use mobile tabs after essential controls. Reserve legible axis/caption space for time and normalized amplitude versus frequency and the declared magnitude convention when populated; do not fabricate data or active scales in the idle state. Validate cyan trace contrast and labels with a separate populated capture.

### 12. [P1] Upload empty states omit formats, privacy, and a clear next step

- **Screenshots:** Both Audio and Physical pairs.
- **Problem:** Dropzones contain only Choose audio/Choose a plate photograph and drag-and-drop text. Audio lacks the specified accepted extensions, local-processing note, and labeled sample action. Physical calls its source “footage” in the subtitle but asks for a photograph, with no explanation of supported input or uncalibrated measurement limits. Disabled Save occupies the strongest action position before a source exists.
- **Fix:** Add supported formats and “Processed on this device” beside the chooser. Provide the labeled sample-audio action. For Physical, state the actual implemented scope explicitly (for example, “Analyze a still photograph or exported video frame”), add Footage measurement and “Uncalibrated until a scale is supplied” where appropriate, and explain what outputs are available. Make Choose file the clear empty-state action; explain why Save is unavailable. Do not promise video support unless implemented.

### 13. [P1] Empty library asks users to navigate without giving them a creation action

- **Screenshots:** `experiments.png`, `mobile/experiments.png`.
- **Problem:** The empty-state sentence names three tools as plain text. Import is actionable, but the strongest filled action is disabled Compare selected (0), alongside disabled Export all. A first-time user sees unavailable management actions rather than a direct way to create a record.
- **Fix:** Add “Start an experiment” as the primary empty-state action and Import bundle as secondary. Show selection actions after records are selected; explain the two-to-four requirement when relevant. Keep the local-storage warning, but place it as supporting text after the actionable empty state. Mobile secondary library actions belong in a labeled menu once records exist.

### 14. [P1] Methodology is a long article without the specified navigation or reproducibility structure

- **Screenshots:** `methodology.png`, `mobile/methodology.png`.
- **Problem:** There is no contents list, version/review metadata, reproduction example, or reference section. Four full-width outlined badges name evidence types without defining their inputs, outputs, and limits. Desktop leaves a large unused region beside the narrow article; mobile requires a long linear read. The equation extends beyond the visible mobile formula region without an obvious scrolling cue.
- **Fix:** Add the specified desktop contents column and mobile “On this page” disclosure. Replace the badge stack with four definition groups (Inputs / Outputs / Limits). Organize methods into Inputs, Processing, Outputs/units, Assumptions, and Reproduction details. Add real release-derived version metadata and linked primary references. Preserve local equation scrolling but signal it visibly, or reflow the formula into readable lines; retain adjacent symbol definitions. Add section return links and the specified anchors.

### 15. [P1] Mobile fixed navigation needs obstruction and safe-area verification

- **Screenshots:** `mobile/audio.png`, `mobile/live.png`, `mobile/simulator.png`, `mobile/home.png`, `mobile/methodology.png`.
- **Problem:** The captured bar covers generator action labels, viewport controls, table headings, demo content, or article text at the initial viewport boundary. Full-page screenshots alone cannot show whether those elements become unobstructed after scrolling. Source uses a fixed 64px bar with safe-area padding inside that height, rather than the specified 64px plus inset; main padding is a fixed 96px.
- **Fix:** Size the bar to `64px + env(safe-area-inset-bottom)` and reserve that total plus 24px in main content. Add appropriate scroll padding/margins for focused elements and anchored sections. Check normal viewport screenshots at top, mid-scroll, and bottom, including focused generator actions and landscape. Do not move the bar to the bottom of the full document merely to improve a full-page screenshot.

### 16. [P2] More does not indicate the current mobile section

- **Screenshots:** `mobile/simulator.png`, `mobile/physical.png`, `mobile/methodology.png`, `mobile/home.png`.
- **Problem:** Live, Audio, and Saved have violet selected states on their respective pages; all four items appear inactive on routes reached through More. The header names the page, but bottom navigation loses its location cue.
- **Fix:** Give More a visible selected treatment and an accessible current-section name on non-primary routes, as specified. Preserve icon-plus-text labels and the four-item structure.

### 17. [P2] Audio generator dominates the upload-first entry screen

- **Screenshots:** `audio.png`, `mobile/audio.png`.
- **Problem:** Generate a signal occupies most of the desktop page with nearly full-width sliders, and a long mobile form before its actions. The stated task is inspecting uploaded audio, yet the only prominent filled action belongs to generation. “Amplitude 0.4” gives no visible convention or range.
- **Fix:** Keep upload/sample selection primary. Put the generator in a labeled optional disclosure or a clearly separated secondary section, with a bounded desktop form width. Label amplitude as normalized and state its supported range. Preserve the visible device-volume note and place it next to any action that can cause playback.

### 18. [P2] Desktop shell omits the specified compact help/status layer

- **Screenshots:** All desktop captures, especially the long Live and Methodology pages.
- **Problem:** The sidebar footer provides storage information but no Preferences action; the content starts directly at the page heading without the specified shared help/capture header. Static idle screenshots cannot verify cross-route microphone status, but there is no visible shared location for it. Source also makes the sidebar follow full document height instead of fixing it to the viewport, so its footer is at the end of long pages.
- **Fix:** Restore a compact shared help/status area, with persistent capture status and Stop when active. Keep sidebar navigation/footer viewport-reachable with independent overflow, and expose implemented preferences. Avoid adding an empty decorative header: its purpose is help, capture visibility, and consistent access.

### 18. [P2] Mobile secondary routes have no selected navigation cue

**Screenshots:** `mobile/simulator.png`, `mobile/physical.png`, `mobile/methodology.png`.

**Problem:** All four bottom navigation items are muted on these routes, unlike the violet Live, Audio, and Saved states. The header names the page, but the persistent navigation does not indicate its section. Source confirms More always receives muted styling.

**Fix:** Give More the selected violet treatment when the current route belongs to its menu, with an accessible label identifying the current section. Keep the exact route selected inside the drawer.

## 3. What is working and should be preserved

- **Palette fidelity:** Source token values match the canonical charcoal, sand, violet, cyan, text, and outline colors. The screenshots use warm gold particles without glow and restrained violet selections. Do not replace this with gradients, glass panels, or saturated decoration.
- **Desktop workbench balance:** Live and Simulator give the plate the largest area, maintain a consistent 320px controls column, and keep labels outside the canvas. Fix mobile ordering while preserving that desktop relationship.
- **Clear navigation vocabulary:** Desktop groups and icon-plus-text routes are understandable. Mobile's four labeled navigation items are economical and familiar.
- **Quiet editorial structure:** Home's ruled entry rows and compact empty recent-record sentence are preferable to a marketing card grid. Methodology prose largely avoids unnecessary enclosing panels.
- **Scientific caution:** Home's approximation note, explicit “No measurement” chart states, unavailable fundamental estimate, and Methodology distinctions between digital audio, models, image statistics, and physical measurements are valuable. Preserve this content while fixing contradictory labels and missing-value handling.
- **Chart restraint:** Empty plots do not contain invented waveforms or decorative spectra. Measured-audio badges are adjacent to chart titles. The absence of cyan traces in these idle screenshots is correct, not a palette failure.
- **Readable main contrast and controls:** Off-white primary text and dark text on gold are clear; outlined selects and standard buttons have strong separation from surfaces. No blanket text-contrast failure is established by these captures. Small type and cramped controls are the more evident accessibility problems.

## 4. Priority ranking and acceptance checks

| Priority | Issues | Required outcome |
| --- | --- | --- |
| **P0 — must fix before sign-off** | 1–2 | Provenance describes the actual output; missing measurements never appear as measured zeros or unexplained results. |
| **P1 — should fix for a usable release** | 3–15 | Restore home balance, mobile task order, simulation transport, readable controls/tables, useful empty states, and inspectable methodology. Resolve the mobile obstruction verification item with viewport evidence. |
| **P2 — nice to have / subsequent polish** | 16–18 | Complete navigation location cues, rebalance the generator, and restore shared shell conveniences. Active-capture visibility should be escalated if interaction testing shows capture can become invisible. |

Re-capture all seven routes at 1280px and 390px after fixes, plus 320px and a tablet breakpoint for reflow. Capture a populated audio state separately to assess chart axes, units, legends, cyan traces, and accessible data alternatives. Check numeric-input/segmented-control target rectangles, keyboard focus above fixed navigation, safe areas, and 200% text zoom. No screenshot-only review can certify those behaviors.

**Review method note:** The critique skill and its Impeccable design principles informed this review, with an independent screenshot assessment. Project-specific scientific visual requirements take precedence over generic aesthetic rules. An optional local deterministic detector was attempted but was not available promptly; no detector score, heuristic pass, or automated accessibility certification is claimed. Findings above are grounded in the captures and the targeted source checks described in scope.
