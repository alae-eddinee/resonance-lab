# Resonance Lab — Page Layouts

Implementation layouts for all ten routes. [DESIGN_SPEC.md](./DESIGN_SPEC.md) defines shared tokens, evidence labels, scientific wording, component behavior, and accessibility. These documents form one specification; the shared specification governs styling and this document governs placement and route-specific interaction.

## Shared layout contract

**Desktop:** ≥1024px, 72px navigation rail until 1280px, then 224px sidebar. Main header is 64px. Main gutters are 24px below 1280px and 32px above. **Tablet:** 768–1023px, 56px compact header and full navigation drawer, 24px gutters. **Mobile:** 320–767px, 56px compact header, 16px gutters, and 64px bottom navigation plus safe-area inset. Keep bottom content padding at least navigation height + 24px. Drawer navigation exposes every route at every width.

Workbench pages use a 16px gap below 1280px and 24px above; editorial sections use 48–64px separation. `PageHeader` has title/description at left and route-level actions at right with a 24px gap. On tablet, actions wrap below the title when needed. On mobile, show the title and one primary action, move secondary actions into a labeled “More actions” menu, and keep the explanatory sentence underneath. Header heights are content-driven.

The standard `WorkbenchGrid` is `minmax(0, 1fr) 320px` at ≥1280px, `minmax(0, 1fr) 300px` at 1024–1279px, and `minmax(0, 1fr) 280px` only when tablet workspace width is ≥736px. At smaller container widths it becomes one column. Control width may rise to 352px above 1536px. Max workspace width is 1680px. Article shells max out at 1200px, with prose capped at 68ch.

Workbench order in the DOM is page header, source summary, visual workspace, essential controls, measurements, and detailed assumptions. CSS positioning may place controls to the right without changing focus order. No CSS order manipulation that produces an unintuitive keyboard sequence. Charts and controls use semantic sections with visible titles.

`ViewportToolbar` sits outside the canvas, is at least 52px tall, and wraps on narrow widths. Its standard order is primary run/pause action, source stop/mute where relevant, view selector, and Fullscreen. Save/export is in the page header or explicitly named experiment actions, not buried inside the canvas. An expanded/fullscreen viewport duplicates necessary transport and Exit fullscreen only; it does not duplicate the whole form. Duplicate control instances share one state and inactive instances are not focusable.

For a route opened without required source data or selected records, render its useful empty state with an entry action; never render an error solely because a deep link lacks in-memory state. Query parameters contain IDs and view state, not raw media or private notes. Sample content is labeled “Sample” and never appears as a user-created measurement.

## 1. Home — `/`

### Purpose and hierarchy

Help visitors choose a meaningful experiment and understand what the visualizations represent. The page is an entrance to a tool, not a sales landing page.

1. `HomeIntro`: eyebrow “Resonance Lab”; h1 “Explore sound. Inspect the pattern.”; body “Measure audio, explore simulated plates, and compare observations from real footage.”
2. `DemoPlate`: paused example plate with evidence label and source caption.
3. `StartPathList`: three explicit entry paths.
4. `RecentExperiments`: up to three local records, when available.
5. `EvidenceOverview`: four short evidence-category explanations.
6. Small reference links to Learn, Hardware Guide, and Methodology, plus local-storage note.

### Desktop

Use a two-column opening composition: text `minmax(300px, 0.8fr)` left, plate `minmax(420px, 1.2fr)` right, 48px gap. Top padding is 48px. Intro copy max-width is 34ch and sits vertically centered with the plate. The plate's drawing area is square, max 640px, with a 48px caption/transport footer. Avoid a large enclosing hero card.

Place “Start microphone session” as the gold primary button and “Upload audio” as a secondary button below the description, separated by 12px. “Try a sample” is a text action underneath. The demo caption states “Sample audio driving a simulation”; a Play preview button starts only the silent visual preview unless audio is explicitly enabled.

Below the hero, `StartPathList` uses three horizontal editorial rows with a title, one-line purpose, and right arrow: Live Cymatics, Plate Simulator, and Real Experiment Analyzer. Audio upload is already a hero action and can also be reached from navigation. Separate rows with 1px rules instead of equal marketing cards. `RecentExperiments` is a compact list with 72px thumbnails, title, type badge, and last-edited time. `EvidenceOverview` uses a two-column definition list.

### Tablet

At 960–1023px, retain a 40%/60% hero split with 24px gap if copy fits. Below 960px, stack intro then plate; cap plate at 560px and center only the drawing region, keeping text left aligned. Actions remain on one row when possible. Entry paths and recent records are full-width rows. Evidence definitions stay two-column until their text would become narrower than 28ch.

### Mobile

Order: title/description → primary and secondary actions → demo → entry paths → recent records → evidence overview. Buttons stack below 400px. Intro top padding is 24px. Plate uses full content width with square drawing area and a wrapping caption beneath. Evidence definitions become a single column; no horizontal carousel. “View all saved experiments” follows the recent list.

### Interactions and states

- Starting a live session navigates first; permission is requested only on the Live page's explicit Start microphone action.
- Try a sample opens `/audio` with the bundled sample selected, paused, and visibly labeled. Demo playback never starts automatically.
- If the library is empty, replace Recent Experiments with one sentence and “Open saved experiments”; omit a large empty-state panel.
- If rendering fails, show a static labeled sample image or an outlined plate with a useful text description; all entry actions remain functional.
- On repeat visits, recent records can appear immediately after the hero; do not replace the first-time explanation with an opaque dashboard.

## 2. Live Cymatics — `/live`

### Purpose and component hierarchy

`PageHeader("Live Cymatics")` → `LiveSourceBar` → `WorkbenchGrid` containing `PlateViewport` and `LiveControlPanel` → `LiveMeasurements` → `ModelDisclosure`.

Page subtitle: “Microphone measurements driving a simulated plate.” Show both evidence labels. Primary page action is Save experiment, disabled with “Start a session to save a result” before a result exists. Export follows in More actions.

### Desktop

`LiveSourceBar` spans both grid columns and is at least 56px high. Left: input device selector, textual microphone status, sample rate when known. Middle: `InputLevelMeter`, width 160–220px with dBFS label and clipping state. Right: Start microphone or Stop microphone. Device names truncate visually but retain accessible full text.

The main viewport fills the wide left track. Header contains “Simulated plate,” model name, and evidence badges. Canvas height follows the shared 400–720px rule. Footer toolbar holds Freeze visualization/Resume visualization, Particles/Displacement selector where supported, Reset view, and Fullscreen. A frozen tag is visible on the canvas; the microphone meter remains live.

The right `LiveControlPanel` starts with Basic/Advanced and then Source sensitivity, Smoothing, Plate preset, and a collapsed Audio monitoring section. In Basic, the panel should fit roughly 480px vertically. Advanced adds Input analysis (FFT/window/channel settings), Mapping/Excitation, Plate model, and Rendering accordions. “Open full plate editor” navigates to `/simulator` preserving the source and settings. Its label makes that route change explicit.

`LiveMeasurements` occupies the wide track below the viewport with a two-column Waveform/Spectrum row if each plot can remain ≥280px wide; otherwise stack. A compact readout row above charts shows RMS, spectral peak, and clipping, with defined units. The narrow track below controls contains source notes and “Record audio for replay,” off by default, with elapsed recording time only when recording.

### Tablet

At workspace width ≥736px, use the 280px controls column and a minimum 440px viewport track. Meter moves beneath the device selector if necessary. At smaller workspace widths, stack source bar, viewport, essential controls, then charts. Basic/Advanced remains at the top of the control section; it does not move inside a global menu. Waveform and Spectrum become accessible tabs when stacked, with “View data” remaining outside the tab panel.

### Mobile

Show source status and full-width Start/Stop microphone directly above the plate. Put the device selector in a labeled expandable “Input” section below this row. The live meter remains visible as a full-width 24px visual strip with a 20px caption row; it is not a tiny unlabeled dot.

Place Freeze/Resume and Fullscreen in the viewport footer. Immediately below, show an inline `SessionActions` row with Save and optional Record audio; no second bottom navigation bar. Follow with Basic/Advanced, Basic fields, Advanced accordions, and Measurements tabs. When the user scrolls beyond the plate, a compact sticky microphone status/Stop control may sit under the header at 48px high; disable stickiness in short landscape or at large text zoom.

### Interaction and state details

- Initial canvas shows a plate outline and action-oriented copy, not a moving fake signal.
- Permission pending, denied, unavailable device, disconnected device, silence, and clipping use the shared recovery patterns. Device disconnect freezes the last image with “Input disconnected” and stops recording.
- “Freeze visualization” stops visual updates only. “Stop microphone” ends capture and optional recording. Record audio requires its own explicit click and distinct timer.
- Changing input device replaces the stream with an Updating input state and preserves plate settings. Never leave two microphone streams active.
- Muting monitoring affects speaker output, not capture or simulation. Show that distinction in helper text.
- Preserve settings on navigation, and keep active capture visible in the shared shell. If the browser suspends capture, label it Interrupted and require a clear Resume action.

## 3. Audio Laboratory — `/audio`

### Purpose and component hierarchy

Analyze uploaded audio properties, select an interval, and pass that exact interval into a simulation. Structure: `PageHeader` → `AudioSourceSummary` → `WaveformEditor` → `AudioTransport` → `AudioAnalysisTabs` with `AudioAnalysisControls` → `AudioMetadata`.

Primary page action is Send selection to simulator once decoding succeeds. Save analysis is secondary. The measured-audio badge sits beside the source summary and every relevant chart; no plate preview is required on this page.

### Desktop

Before upload, show a 240px-high `FileDropzone` in the main region, with Choose audio, accepted extensions, “Processed on this device,” and a labeled sample-audio link. Below it, keep a short explanation of interval selection. Do not display disabled charts filled with sample-looking data.

After upload, replace the dropzone with a 64px `AudioSourceSummary`: filename, duration, channel count, sample rate, file size, and Replace audio. Use a 280px right `AudioAnalysisControls` column; the left analysis region uses the remaining width. This route's narrower control column is deliberate because the waveform benefits from horizontal space.

`WaveformEditor` is 240px high including its ruler, with a full-file overview and selected interval shading. A minimum 44px target surrounds each interval handle. Numeric Start and End fields below accept hh:mm:ss.sss and are authoritative alternatives to drag selection. Their validation enforces start < end and bounds within duration.

`AudioTransport` below the waveform contains Play/Pause, Stop (returns to selection start), current time/duration, Loop selection, Mute/volume, and zoom in/out/reset. Play defaults to the selected interval; when no explicit selection exists, the whole file is selected. A “Whole file” button is adjacent to interval fields.

Below transport, tabs select Spectrum, Spectrogram, or Measurements. Spectrum is default. Current-window analysis is labeled with the cursor time; selection-aggregate metrics explicitly name the selected interval. The right panel contains Channel (original channels or declared mono mix), FFT size, Window, scale controls, and optional normalization, off by default. Advanced exposes precise analysis settings and definitions.

Metadata is a definition list below the charts, not a large card. Show original and working sample rate if different, decode status, normalization method, and source-retention state.

### Tablet

Source summary wraps to two rows. Waveform and transport are full width. Move analysis controls beneath the waveform into an `Analysis settings` disclosure rather than a narrow permanent rail. Chart tabs stay above the active chart. Start/End fields and Whole file share one row at ≥768px. Keep Send selection to simulator in the page header and repeat it after the selected interval only when the header is far offscreen.

### Mobile

Dropzone becomes a 180px file chooser area; drag-and-drop is optional. After upload, filename wraps to two lines and metadata moves into a “File details” disclosure. Waveform drawing region is 160px; interval fields sit directly below in two columns when each can retain 132px width, otherwise stack.

Transport uses two rows: Play/Pause, Stop, current time, Loop first; volume and zoom second. Chart tabs can wrap; no hidden horizontal tab overflow. Analysis settings use full-width accordions. Send selection to simulator is a full-width button immediately below interval controls; Save analysis remains in page actions. The spectrogram pans only within an explicitly labeled zoom mode, not during normal page scrolling.

### Interaction and state details

- Replace audio preserves the existing result until the new file decodes successfully. Replacing a source with unsaved selections asks whether to save or discard that analysis; Cancel keeps the existing source.
- During decode, show filename and real stage labels. Cancel restores the previous workspace. Unsupported format errors never erase a prior successful analysis.
- Silent intervals show a flat waveform and “No peak detected.” Analysis metrics are not inferred from the simulation.
- Save analysis stores source metadata, interval, processing choices, and measured outputs. It need not create a simulated plate result.
- Send selection preserves channel handling and normalization; `/simulator` shows them in its Source summary. If normalization is active, both routes visibly identify the method.
- A missing reattached source shows the saved waveform thumbnail only as a snapshot, with playback disabled and a reattachment action.

## 4. Plate Simulator — `/simulator`

### Purpose and component hierarchy

An inspectable virtual plate workbench. Structure: `PageHeader` → `SimulationSourceBar` → `WorkbenchGrid(PlateViewport, PlateControlPanel)` → `SimulationDiagnostics` → `ModelAssumptions`.

Page actions: Save experiment primary, Save as preset secondary, Export in More actions. At entry, the ideal square configuration is visible and stopped until the user runs it. Show the actual model category prominently; an educational renderer cannot inherit the Physics simulation label merely by being on this route.

### Desktop

`SimulationSourceBar` spans the full width with Tone / Uploaded audio / Microphone source selection on the left and source details to the right. Tone mode shows the current frequency and “Audio output off” status. Uploaded audio shows filename and interval; Microphone shows device and explicit Start/Stop. Selecting Microphone alone does not request permission.

Large left viewport uses the standard sizing. The viewport toolbar contains Run/Pause simulation, Reset particles (rendering state), view mode, Show nodes, and Fullscreen. “Reset plate” is in the control panel footer and resets configuration; the distinction is visible in the labels. Excitation marker can be dragged inside the plate with a paired X/Y editor adjacent to the relevant excitation controls.

Right panel begins with Basic/Advanced and a preset selector. Basic fields, in order: Plate preset, Boundary, Drive frequency for Tone, Excitation level, Excitation position. In audio/microphone mode, replace Drive frequency with Mapping method and Sensitivity; show detected frequencies as readouts, never as freely editable measured values.

Advanced accordion order:

1. `GeometryControls`: supported shape, normalized size or calibrated width/height, thickness when operative, and excitation position.
2. `MaterialControls`: declared material preset and solver-used constants with units and definitions. Inoperative fields are omitted or explicitly unavailable.
3. `BoundaryControls`: supported boundary type and boundary diagram.
4. `ExcitationControls`: source, position, waveform, supported sweep settings, input mapping/normalization.
5. `SolverControls`: model identifier/version, supported resolution or retained modes, damping if modeled, and stability/validity limits.
6. `RenderingControls`: particles, particle size, display quality, color view, and seed if used.

After a pending expensive change, a 56px `PendingPlateChanges` row appears inside the panel with Apply plate changes and Discard. Undo is adjacent to Reset plate at the bottom. Keep the last computed plate visible with a stale/updating label until Apply completes.

`SimulationDiagnostics` is a row below the viewport: response/energy plot only if the model produces that quantity, mode information where meaningful, and convergence/status text. Use real units or explicitly normalized units. `ModelAssumptions` below the workspace summarizes the model, valid parameter space, ignored effects, and Methodology link.

### Tablet

Use the standard split only when the main drawing region retains 440px width; otherwise stack. At stacked widths, Basic controls form two-column groups below the viewport, with each field at least 220px wide. Advanced sections are single-column. Diagnostics display one chart at a time through accessible tabs; assumptions stay beneath them. Source selector can occupy its own line.

### Mobile

Order: source selector → source summary → plate → Run/Pause toolbar → Basic/Advanced → essential controls → advanced sections → diagnostics → assumptions. Frequency and excitation-level sliders each take a full row with a 96px number field below or alongside when space permits. Position controls use an explicit “Edit excitation position” button to enable dragging; normal touches on the canvas scroll the page.

Place Save experiment in the page header and a compact experiment-actions row after Basic controls when needed. Expensive Apply changes is inline below its edited section, not hidden below all advanced fields. Preset and reset actions remain reachable in the control panel footer. Fullscreen adds Run/Pause, view mode, and Exit; controls open as an accessible full-screen settings dialog only when requested.

### Interaction and state details

- Show “Advanced settings active” on return to Basic when those settings differ from defaults.
- Tone simulation is silent by default; enabling audio is explicit and provides independent mute/volume. Changing frequency does not silently enable sound.
- Shape/boundary changes validate the selected model. Unsupported combinations explain why they cannot be applied.
- Sweeps specify start/end frequency, duration, and linear/log progression; no sweep begins merely by editing fields. A running sweep shows progress and Stop sweep.
- Rendering quality changes do not alter stored scientific parameters. Recomputing with another model/version creates a derived result linked to the source configuration.
- If no physics solver is available, present an Educational mapping model with its actual controls and limits; do not expose decorative material controls that imply physical fidelity.

## 5. Real Experiment Analyzer — `/physical`

### Purpose and component hierarchy

Inspect real footage and quantify what is visible, with calibration and processing assumptions attached. H1 is “Real Experiment Analyzer”; subtitle is “Measure visible patterns in your footage.” Structure: `VideoImport` → `AnalysisStepIndicator` → `VideoAnalysisWorkspace` → `AnalysisResults` → `FootageMethodNotes`.

Steps are Source, Region & calibration, Processing, Results. The step indicator expresses progression while retaining access to earlier settings; it is not a forced multi-page wizard. Primary action changes by stage: Choose video → Apply region → Run analysis → Save experiment.

### Desktop

Before import, show a 16:9 preview placeholder with Choose video, sample-footage link, supported-container guidance, and a local-processing note. MP4 and WebM may be offered, with actual decode support checked at runtime. A file being accepted by its extension is not proof it can be decoded.

After import, use `minmax(0, 1fr) 320px`. Left: `FootageViewport` with original frame, toggleable segmented-mask overlay, plate-region outline, and a label stating Original / Overlay / Mask. Preserve source aspect ratio with letterboxing; do not crop silently. Canvas is 360–640px high. Below: `VideoTransport`, timeline, selected analysis interval, and frame-step controls.

Right: `FootageAnalysisPanel`, containing Region, Calibration, Processing, and Run analysis. Region has a rectangle/polygon tool with numeric vertex/bounds fields and Reset region. Calibration is optional for pixel/ratio metrics: user marks a known reference and enters its length/unit; show the resulting scale. Include perspective-correction status and any assumed plane. Require calibration only for metrics using physical distance.

Processing controls: Basic/Advanced, automatic/manual threshold mode, threshold value when manual, background polarity, and overlay opacity. Advanced adds documented denoising/morphology choices and frame sampling. Do not describe arbitrary heuristic quality values as statistical confidence probabilities. `AnalysisReadiness` lists concrete prerequisites such as region valid, interval chosen, and calibration available/unavailable.

Run analysis sits immediately after processing controls. Below it show stage, processed frame count, elapsed time, and Cancel. Results below the workspace include coverage versus time, a pattern-stability metric with its formula linked, and a measurements table. A 96px thumbnail strip selects representative frames; it scrolls only within its own labeled region.

### Tablet

Always prioritize full-width video and transport. Move the settings to a full-width panel beneath, with Region, Calibration, and Processing tabs. Analysis action sits below the active panel but progress is visible in a shared status row. Results charts become one column; thumbnails remain a horizontal strip with previous/next buttons. On wide tablets, optional numeric calibration fields can be two-column.

### Mobile

Source → video → frame/time transport → current step controls → Run analysis/progress → results. ROI drawing opens an expanded in-page editor with a large Done editing button, zoom controls, and numeric-coordinate alternatives. It temporarily captures gestures only while edit mode is active. Analysis interval uses Start/End time fields instead of relying on tiny handles.

Use a two-button Original/Overlay toggle and a separate Mask option in View options. Results start with a brief textual summary and quality flags, then chart tabs and the data table's stacked rows. Save experiment and Export become available after completed or explicitly accepted partial results. Do not make a floating overlay cover the calibration points or video transport.

### Interaction and state details

- Calibration summary says “Uncalibrated — pixel and ratio measurements only” until valid reference data exists. A manually entered drive frequency is “User-provided excitation frequency,” not a CV measurement.
- Region/calibration/processing changes invalidate dependent results; retain the old result labeled “Settings changed — rerun analysis” and disable saving it as current. Users may save the old result with its original settings.
- Compare Original and Mask without moving the playhead. Overlay opacity changes viewing only, not segmentation output.
- Overexposure, occlusion, camera movement, compression, and insufficient contrast appear as specific quality flags where detected or documented; allow notes for manually observed limitations.
- Run analysis is off the main interaction thread when implemented. Cancel retains completed partial results with interval/frame count and a Partial badge. Never silently present partial results as complete.
- Output is always Footage measurement. A similarity to a simulation is an optional comparison observation, not model validation or proof of physical causation.

## 6. Compare Experiments — `/compare`

### Purpose and component hierarchy

Inspect differences without hiding incompatible assumptions. Structure: `PageHeader` → `ComparisonSelectionBar` → `ComparisonCompatibility` → `ComparisonToolbar` → `ComparisonFrames` → `ComparisonCharts` → `ComparisonMetrics` → `ComparisonNotes`.

Support two to four records. Before two are selected, show named A/B slots and instructions. Primary action is Save comparison once valid; Export is secondary. Add experiment remains near the selection bar rather than in a distant page menu.

### Desktop

`ComparisonSelectionBar` shows A–D record pills with title, evidence category, and replace/remove controls. Unfilled optional slots collapse into Add experiment. Picker is a 640px dialog with local search, type/date filters, and explicitly selected records; unavailable slots explain the four-record maximum.

`ComparisonCompatibility` is a full-width definition summary with Same / Different / Unavailable text for category, source interval, units, model/version, geometry, calibration, and preprocessing. Start with the meaningful differences expanded. A mixed-category comparison is allowed but displays “Different evidence types — visual review only” wherever a quantitative combined metric would otherwise appear.

`ComparisonToolbar` contains Side by side / Overlay / Difference view, Link time, time offsets, axis scale settings, and normalization. Unavailable modes remain disabled with a visible reason; do not allow a toggle to produce an unexplained blank view.

Two selected experiments produce equal columns with a 24px gap. Three or four use a 2×2 grid rather than four narrow columns. Each `ComparisonFrame` has a visible A/B/C/D label, title, provenance, image/plate area, timestamp, and Open experiment link. Equal visual frame dimensions do not imply physical scale equivalence; scale text appears beneath each frame.

Under frames, use a shared plot only for compatible definitions/units; otherwise place named plots side by side with “Independent scales.” `ComparisonMetrics` is a table with metric names in the first column and experiments in subsequent columns; changed values may use weight and explicit delta, not red/green winner coloring. Missing cells show an em dash with “Unavailable” accessible text.

### Tablet

Two columns remain for frames if each can be at least 320px; otherwise stack. Three/four remain a two-column grid when possible. Toolbar wraps into View, Timing, and Scaling rows. Compatibility becomes an initially expanded disclosure. Metrics table scrolls within a labeled region with a sticky metric-name column, without horizontally scrolling the page.

### Mobile

Display an active pair picker (“Left: A”, “Right: B”) when there are more than two records. The selected pair is stacked, each retaining its label and time readout. A “Show all records” view expands all frames vertically. Never compress four plates into a tiny grid or require swiping to discover that a comparison exists.

Linked transport sits between the pair picker and frames; a small time label remains inside each frame. Controls for offsets, scale, and normalization are in a Comparison settings disclosure. Metric comparison becomes a stacked definition list: metric heading, then A/B/C/D values and units. The pair picker affects visual frames only; a visible note indicates when the metrics still include all selected records.

### Interaction and state details

- Link time needs temporal data in all linked records. Static snapshots show their stored timestamp and are excluded from temporal playback.
- Offsets are editable in seconds and labeled relative to each original source; playback uses only their overlapping range. If overlap is empty, disable linked playback with an explanation.
- Overlay is allowed only where axes and definitions are compatible. An image overlay requires user-reviewed registration. Difference additionally records the transform, crop, interpolation, and normalization method.
- Any similarity metric names its domain and method, e.g. “Registered mask overlap,” and describes sensitivity to preprocessing. No global “best recording,” “most powerful pattern,” or scientific-ranking score.
- Removing a record updates dependent plots, preserves other selections, and offers Undo. A missing local ID shows an unavailable record slot with Replace; do not silently substitute a sample.
- Saved comparisons retain input references and settings. Exported bundles include the records needed for portability, or explicitly declare external/missing references.

## 7. Saved Experiments — `/experiments`

### Purpose and component hierarchy

A local research notebook with visible storage status. Structure: `PageHeader` → `LibraryStorageSummary` → `LibraryFilterBar` → `ExperimentTable/ExperimentList` → `SelectionActions` → `ExperimentDetailPanel` when opened.

Primary action is New experiment, opening a compact menu for Live, Audio, Simulator, or Footage. Import bundle is secondary. Export all and Manage storage appear in More actions. No sign-in, cloud-sync, or collaboration controls.

### Desktop

`LibraryStorageSummary` is a quiet inline row under the header: “Stored in this browser,” estimated usage if available, and a brief Export backup link. It also explains that clearing site data removes saved records. Use no alarming persistent banner for normal local storage.

`LibraryFilterBar` has a 320px search field, evidence-type filter, tag filter, and Sort (default Updated, newest first). Search matches title, notes, and tags. An optional Grid/List switch follows, with List as default. Display result count and a Clear filters action only when filters are active.

`ExperimentTable` columns: checkbox 44px, preview 88px, title flexible min 220px, evidence type 160px, source/duration 160px, updated 144px, actions 44px. Rows are at least 88px high. At widths that cannot fit, remove redundant source summary from the table and retain it in details; do not hide category or title. Each title is a link/button to detail; row selection uses its checkbox, not every click on the row.

Opening detail reveals a 400px side panel or, if it would reduce the list below 600px, an overlay sheet. Detail shows a 16:10 preview, title, provenance, dates, source media availability, parameters summary, tags/notes, Reopen, Duplicate, Export, Compare, and Delete. Editing title/notes is explicit with Save changes and Cancel.

`SelectionActions` appears after selecting at least one record, sticky below the app header without obscuring the filter bar. It states the count and offers Compare (2–4 only), Export selected, Clear selection, and Delete selected. Selecting more than four leaves export/delete valid while explaining comparison's limit.

### Tablet

Replace the table with 96px compact list rows: checkbox, 72px thumbnail, title/type/date, and actions. Filters wrap into search first, then type/tags/sort. Detail is a 480px side sheet. Selection toolbar wraps; its secondary actions can use a labeled menu. Storage summary remains visible above search.

### Mobile

List rows are at least 104px, with 64px thumbnails, multiline title, evidence badge, date, and an overflow button. Start selection through a visible Select action; selection checkboxes then appear without making tiny targets. Filters open an inline disclosure below the full-width search field. Show active filter count and removable chips.

Detail opens as a full-screen dialog with Back to saved experiments, title, scrollable details, and inline Reopen/Export controls. Do not layer a side sheet over an already narrow list. Selection actions live immediately below search; avoid another persistent bottom bar. Delete is in the selection menu and always confirms the named count.

### Interaction and state details

- Empty library offers Start an experiment and Import bundle. Empty search offers Clear filters and retains the current query.
- Reopen routes by record type: measured audio to `/audio`, simulation to `/simulator` or `/live` snapshot view as appropriate, footage to `/physical`, comparison to `/compare`. Original microphone capture never restarts automatically.
- Media availability is “Replay available,” “Snapshot only,” or “Source required.” It must not be guessed from a thumbnail.
- Duplicate creates a new ID and editable copy with original provenance retained. Changes to notes do not rewrite measured results.
- Import shows a preflight summary of records/media, sizes, incompatible schema entries, and duplicate IDs. Commit only after the user confirms the import action.
- Manage storage lists large retained sources and their dependent records. Removing media separately warns which records become snapshots; it does not delete metadata silently.
- Export/delete feedback appears inline and in the status region. Keep the library functional when storage-usage estimation is unavailable.

## 8. Learn — `/learn`

### Purpose and component hierarchy

A concise educational reference connected to the instruments. Structure: `PageHeader` → `LearningPathIndex` → `FeaturedLesson` → `TopicSections` → `Glossary` → `RelatedExperiments`.

Use section anchors on this route, such as `/learn#audio-basics`, rather than inventing additional required routes. H1 “Learn cymatics and audio analysis”; introductory text explains the distinction between sound analysis, models, and observations.

### Desktop

Inside the 1200px article shell, use a 220px `ArticleContents` column and `minmax(0, 1fr)` content with a 48px gap. Contents sticks below the header only while it fits vertically and lists Audio basics, Plate modes, Simulation assumptions, Reading footage, Fair comparisons, and Glossary.

Main introduction uses a 48px article title maximum and 68ch prose. `FeaturedLesson` is a single annotated plate diagram paired with a short explanation, not a grid of generic lesson cards. A Play demonstration control explicitly starts an interactive example; initial state is paused. Its evidence badge remains next to the diagram caption.

Each `LessonSection` includes a 24px heading, 2–4 short paragraphs, one relevant static/interactive figure where needed, a “Try this in the simulator” or “Inspect sample audio” action, and a limits note. Use equations only with a plain-language reading and definitions of symbols. `Glossary` is a definition list with term anchors and search/filter only if the number of entries warrants it.

### Tablet

Contents becomes an “On this page” disclosure below the introduction. Main content is a centered 68ch column. Figures may extend to the full available width. Paired figure/text lessons stack when either side would become less than 280px wide. Keep the demonstration's controls below its image rather than over text.

### Mobile

Title, one-paragraph orientation, On this page, then lessons. Use 24px section spacing within lessons and 48px between topics. Equations wrap or get a locally scrollable mathematical region with a readable textual equivalent. Figures remain at least 240px wide when space allows. Related experiment buttons are full-width and include what will open, e.g. “Open square-plate example.”

### Interaction and state details

- Sample lessons that map frequency features to pattern geometry are labeled Educational mapping, not implied demonstrations of physical truth.
- “Try” actions open a configured workspace in a paused state and retain a return link to the source section. A new sample should not overwrite an unsaved experiment without review.
- Topic anchors update the URL and move focus to the destination heading when activated through contents. Reading position is not required to be persisted.
- Avoid points, badges, completion pressure, or ranked pattern beauty. Explain uncertainty as part of the lesson.
- No claim about cultural or linguistic content is presented as a scientific superiority result. Fair comparisons discusses controls, normalization, recording conditions, and interpretive limits.

## 9. Hardware Guide — `/hardware`

### Purpose and component hierarchy

Help users plan a documented physical experiment and capture usable footage. Structure: `PageHeader` → `HardwareScopeNote` → `SetupDiagram` → `ComponentChecklist` → `CaptureProtocol` → `Troubleshooting` → `SetupExport`.

This is educational setup guidance, not a purchasing marketplace or a guarantee that virtual settings reproduce a physical plate. Avoid default brand/product recommendations and unverified component ratings. The guide must defer operating limits to component documentation.

### Desktop

Use the 1200px article shell, 220px contents column, and 48px gap. Contents: Setup overview, Components, Mounting & excitation, Camera & lighting, Recording checklist, Troubleshooting. The main top section pairs a simple labeled SVG diagram with a short numbered signal-chain explanation: source → suitable driver/amplifier → actuator → plate; camera captures the plate and any synchronization reference.

`SetupDiagram` is at least 480×300px in its content box and has a text equivalent. Differentiate mechanical support, signal connection, and camera line of sight with labels and line styles. Do not use a simulated nodal picture as a promised hardware outcome.

`ComponentChecklist` is a table: Component, Purpose, What to record, Constraints to verify. Include plate geometry/material/thickness, boundary/support arrangement, actuator and attachment position, drive source, camera, lighting, and scale reference. Avoid unstated nominal dimensions or electrical limits. Fields such as actual plate width, thickness, and source frequency can be recorded in a local `SetupNotesForm` with units and “Unknown” allowed.

`CaptureProtocol` is an ordered checklist: document setup, stabilize camera/lighting, include a scale in the plate plane when measuring distance, record source timing if synchronization is needed, capture a suitable baseline, and note changes. Link directly to `/physical` with “Analyze recorded footage.” Troubleshooting uses symptom/possible cause/check rows, not claims of diagnosis certainty.

### Tablet

Move contents to the top disclosure. Diagram spans full width, explanation follows. Component table retains four columns only when readable; otherwise use component subsections with labeled values. Setup notes use two columns for dimensions/units and one for descriptions. Analyze recorded footage stays below the capture checklist.

### Mobile

Diagram becomes a vertical signal chain with 44px focusable labels; tapping a label opens its explanation inline. The static text equivalent always remains available. Component checklist becomes accordions with name, purpose summary, and “What to record.” Setup notes and checkboxes stack. Export setup notes and Analyze recorded footage are full-width buttons at the end.

### Interaction and state details

- Checklist completion is stored locally and can be reset without affecting experiments. Setup notes are explicitly saved/exported and optionally attached to a footage experiment.
- Use “Record your setup” rather than “Match the simulation.” Unknown parameters stay visibly unknown in attached metadata.
- Keep practical operating guidance adjacent to the relevant setup step, using verified equipment documentation when implementation adds specific hardware. Do not invent safe drive limits.
- Camera guidance explains that perspective, lighting, grain visibility, frame rate, and compression affect CV results. No video-based claim of force, displacement, or resonance without a valid measurement method.
- Export is a readable Markdown or JSON setup note containing entered values, units, unknowns, and date; no hidden online submission.

## 10. Methodology — `/methodology`

### Purpose and component hierarchy

Make the scientific boundary of each output inspectable. Structure: `PageHeader` → `MethodologySummary` → `MethodologyContents` → `EvidenceTaxonomy` → method sections → `ReproducibilityManifest` → `Limitations` → `MethodVersionHistory` → `References`.

H1 “Methods and limitations.” Show methodology version and last-reviewed date derived from the actual release metadata, not a fabricated “verified” badge. Source links resolve to primary technical references when methods are implemented.

Required anchor IDs: `#evidence-types`, `#audio-analysis`, `#plate-models`, `#educational-mappings`, `#footage-analysis`, `#calibration`, `#normalization`, `#comparison`, `#reproducibility`, `#local-storage`, `#limitations`, and `#references`. Component help links elsewhere use these exact anchors.

### Desktop

Use a 240px `MethodologyContents` left column and a 68ch article right column, with 48px gap. Contents can scroll locally if taller than the viewport but must retain visible focus; the main article uses normal page scrolling. An initial full-width four-row taxonomy table compares what each evidence type measures/computes and what it cannot establish.

Each `MethodSection` repeats a clear structure: Inputs → Processing/model → Outputs and units → Assumptions → Known limitations → Reproduction details. Titles are 24px, subheads 18px. Formula blocks use surface-raised backgrounds, 16px padding, and adjacent symbol definitions. Do not use large collapsible sections to hide every limitation; key caveats remain expanded.

Audio analysis describes sample rate, channel handling, FFT/window, smoothing, magnitude convention, interval aggregation, clipping, and what peak detection means. Plate models describe the actual solver, geometry/boundary support, units, forcing, damping, discretization/retained modes, seeds, and validation scope. Educational mappings describe their transformation without physical claims.

Footage sections specify ROI, segmentation, preprocessing, sampling, coverage/stability definitions, registration, perspective, calibration, and sources of error. Normalization describes exact transformations and how original values remain accessible. Comparison describes compatibility checks, offsets, scaling, missing data, and why image resemblance alone is not physical equivalence.

`ReproducibilityManifest` shows an annotated example of exported metadata with fictional clearly labeled sample identifiers, model version, processing parameters, units, and media-availability status. It must never imply the browser stores raw media when retention was off. Local storage describes IndexedDB, browser-specific availability, export/import, and clearing-data behavior.

`MethodVersionHistory` is a compact table with version, date, changed calculations, and compatibility impact. References appear at the end and adjacent to the method they support; distinguish implemented methods from possible future research.

### Tablet

Contents becomes a top disclosure with the current section highlighted by text and selected state. Article max-width stays 68ch. Taxonomy table can reformat to category blocks with Inputs / Outputs / Limits. Reproducibility example spans the content width and has Copy example and Download sample only if a sample artifact actually exists.

### Mobile

Title, review/version metadata, a short boundary summary, On this page disclosure, then sections. Taxonomy becomes four stacked definition groups. Formula/code regions may scroll locally and include a textual explanation; body text never overflows. Keep key limitations in normal flow. A “Back to section list” link follows long method sections; avoid persistent floating controls over the article.

### Interaction and state details

- Deep links scroll the target below the sticky header and focus its heading when activated from the interface.
- “View settings in current experiment” is available only when a workspace exists; otherwise link to a clearly labeled example. Preserve current user settings when returning.
- If a calculation is not implemented, say so and omit its result controls elsewhere. A methodology page is not a place to make speculative capabilities appear shipped.
- A model/version mismatch in a reopened record links directly to its compatibility explanation. Historical settings remain readable even if re-running that version is unavailable.
- Scientific neutrality appears in the initial summary and comparison section: measured audio, models, mappings, and footage are distinct evidence; no passage, language, or recording receives an inherent scientific-status claim.

## Cross-route implementation checklist

| Route | First meaningful action | Persistent provenance | Local output |
| --- | --- | --- | --- |
| `/` | Start microphone session / Upload audio | Sample demo category | None by default |
| `/live` | Start microphone | Measured audio + actual renderer category | Snapshot; optional recorded source |
| `/audio` | Choose audio | Measured audio | Analysis + optional source media |
| `/simulator` | Run simulation | Physics simulation or Educational mapping | Configured result/preset |
| `/physical` | Choose video | Footage measurement + calibration state | CV measurements + optional footage |
| `/compare` | Add at least two experiments | Category and compatibility for every input | Comparison settings/references/bundle |
| `/experiments` | Open / import / create | Category and replay availability per record | Local library and exports |
| `/learn` | Choose lesson / Try example | Figure-specific evidence label | Optional configured example in workspace |
| `/hardware` | Review setup / record notes | User-provided setup metadata | Setup notes/checklist |
| `/methodology` | Inspect a method | Actual implementation/version | Reference/sample metadata only |

Before implementation sign-off, verify each route at desktop, tablet, and 320–390px mobile widths; confirm source/transport placement, keyboard order, readable provenance, local save status, missing-input recovery, and access to every control without relying on hover or dragging.
