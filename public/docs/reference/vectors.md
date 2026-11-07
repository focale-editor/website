# Vector projects

[Documentation](../README.md) · [File formats](README.md)

A Focale vector project uses the **`.fvector`** extension, distinct from `.focale`. The file contains UTF-8 JSON. The envelope holds `format: "fvector"`, `version`, the identifier `id`, the name `name` and a `scene` with its dimensions and objects in painting order, from back to front. Writers emit **version 1** for every current feature, following the original development baseline. The [`.fvector` specification](fvector.md) now publishes the envelope, core records, resource rules and a complete example. Readers also accept development envelopes 2–9 without changing their authored payload; saving them writes version 1. Unknown envelope versions are rejected. Internal recipe and grid versions remain independently validated. See [ADR 0427](../adr/0427-unpublished-vector-envelope-baseline.md).

Each object keeps its identifier, name, decomposed affine transform, fill and stroke paints, stroke width, opacity, visibility, lock and children. Its content can be a parametric shape, a Bézier path with anchors and handles, text, or a group. Children stay local to their group. Moving an object between groups composes the transforms so that its position on the document is unchanged.

Text uses Focale's `TextContent` model: Unicode content, base style, character ranges, paragraph ranges, font and variable axes, alignment, box dimensions, leading, kerning, ligatures, hyphenation, Asian composition, orientation, flow and warp. The common model already serialized these fields in version 1; enabling their editing in the interface does not change the envelope.

Explicit [text outline conversion](../features/text-outlines.md) replaces admitted
native point text with ordinary glyph paths inside its original composition group.
It introduces no stored text-outline metadata or format revision. Undo retains the
original editable text in the current session.

Colours and gradients, including stops, positions and interpolation modes, are retained. Interface preferences, panel layout, recent files, the current selection and the undo history are not part of the project. Crash recovery uses separate bounded checkpoint files, independently of preferences; it does not replace explicit saving.

The decoder rejects unknown formats and versions, duplicate object identifiers, non-finite values, invalid scene sizes and structures exceeding its limits. Reading and writing are limited to 128 MiB of UTF-8 JSON, a depth of 100 and two million JSON values. A lexical preflight rejects excessive nesting before JSON tree allocation. Binary resources have the separate limits below. A native save writes a temporary file in the chosen directory before renaming it. On the Web, the browser receives a `.fvector` download and chooses its destination.

The [edited interchange corpus](../development/interchange-corpus.md) records
adapter-specific editing guarantees, current limits and independent validation.

SVG is a limited interchange format. Parametric shapes become paths; paints may be sampled. Export rejects text whose advanced properties cannot be kept instead of dropping them. PDF has an [editable adapter](#pdf-interchange-and-shared-graphics-unreleased-version-1); PDF-compatible AI files are imported through IllustratorKit; legacy PostScript is explicitly rejected.

SVG/SVGZ/PDF export now provides [explicit output choices](../features/vector-export-review.md):
a format-compatible copy, expanded paths, a disclosed RGB composition image or the
complete editable `.fvector` project. Feature diagnostics and remedies precede
confirmation, and the selected copy is encoded before it can be saved. This does
not change the native format version.

Section titles retain historical “unpublished” and “unreleased” labels to keep
existing anchors stable. These describe the implementation history; the current
specifications are also distributed with the website documentation.

## Portable resource collection

The resource workspace can collect a ZIP containing `project.fvector`, captured
source files, admitted full font files and `report.json`. The project copy embeds
available linked snapshots and still uses native version 1. It preserves authored
font families; separate font files must be installed on the receiving system.
The report identifies unresolved dependencies, original source paths and collected
file mappings. Nested editable archives are copied intact; inactive data-set paths
remain unchanged. See the [resource collection specification](resource-collection.md) for archive
entries, report fields, limits and incomplete-dependency handling.

## Resolution and strokes (optional version 1 fields)

`scene.dpi` is the resolution used for physical conversions (96 when absent; a finite, strictly positive value of at most 9,600). It never forces a raster allocation and is kept when a scene changes its objects.

Each object may carry `strokeCap` (`butt`, `round`, `square`), `strokeJoin` (`miter`, `round`, `bevel`), `strokePosition` (`center`, `inside`, `outside`) and `strokeDashes` (a list of non-negative lengths, in multiples of `strokeWidth`, subject to the general limit of 100,000 entries per collection). The defaults are `butt`, `miter`, `center` and an empty list respectively. A pattern made only of zeros renders as a solid stroke. Open ends render centred even when the object stores another alignment. Rendering bounds the extraction of extremely dense patterns without changing their serialization.

Shape parameters (radii, sides, points, arrows) use the common geometry codec. Text flow keeps an embedded Bézier path, its mode and options. An optional [source binding](#editable-text-path-sources-unpublished-version-1) refreshes that snapshot from editable vector geometry. Gradients also keep their opacities, transition midpoints and smoothness.

SVG interchange converts dashes to absolute units and keeps caps and joins. Solid-colour arrows are split into a shaft and filled heads inside a group. Non-centred strokes and gradient arrows are rejected at export, because this exporter does not yet guarantee their exact appearance.

## Guides and ruler origin (optional version 1 fields)

`scene.guides` uses Focale's `GuideCollection` codec: an `order` list of stable IDs and a `guides` list containing `id`, `orientation` (`horizontal` or `vertical`), finite `position`, and optional packed ARGB `color` (default `0xff00a8ff`). Absent or malformed entries are skipped by the shared tolerant reader; the native envelope retains its global size, nesting and finite-number validation. Existing order is normalized and valid unlisted IDs are appended. Empty collections are omitted.

`scene.rulerOrigin` is an optional pair of finite document-space coordinates `[x, y]`, defaulting to `[0, 0]`. It shifts ruler readings and grid coordinates without moving artwork. Object changes preserve both fields. Undo/redo records these metadata changes alongside scene snapshots. SVG imports default them and SVG exports omit them. Earlier version 1 projects remain readable; earlier application builds may drop these optional fields when re-saving.

Grid spacing/subdivisions, snapping flags and guide visibility/locking are application preferences, not project metadata. Exact anchor/segment selections and the rotation pivot are transient canvas state.

## Resource independence and clipboard

Placed vector `source` entries may retain an `identities` map from source-owned
IDs to their independent placement IDs (at most 200,000 nonempty, one-to-one
associations). It covers objects, paths, links, filters and nested source owners.
Duplication remaps the placement values. Source editing restores the current
children to their source IDs and intrinsic coordinates, retaining native metadata
and refusing to overwrite concurrent inline edits. Source saves keep surviving
placement IDs stable. Legacy entries without this optional map retain their current
child IDs; historical associations are not guessed from order or geometry.
This remains unpublished format version 1; see [ADR 0441](../adr/0441-placed-vector-identity-restoration.md).

Catalogue custom shapes store a self-contained `PresetShapeGeometry` outline in version 1. Swatches and gradient presets apply their values to objects; the document does not depend on an external library ID for rendering. Personal libraries and favourites are application preferences, not project fields. Existing shared library formats retain their `.fswatch`, `.fgradient` and `.fshape` extensions.

The separate clipboard text envelope has `format: "focale-editable-clipboard"` (the previous `atelier-vector-clipboard` spelling remains readable), `version: 1`, a copy `token` and an `objects` array using the shared object codec. It also carries optional `fonts` and `profiles` maps, containing base64 font programs and source ICC profiles. Base faces and character-range faces are retained. It omits guides, viewport and document metadata. Structural bounds follow the native object codec; the clipboard retains its separate 20,000,000-character envelope limit. Copy roots are expressed in document coordinates with inherited opacity; paste regenerates object/path identities and optionally adds a positional offset. This format does not change `.fvector` versioning.

## Artboards and live boolean paths (optional version 1 fields)

The unreleased project format remains version **1**. `artboard` holds `ArtboardProperties` (`left`, `top`, `width`, `height`, background policy/color) on a root group. Its children remain local to the group transform and are clipped to that rectangle. Artboards may extend beyond the original scene dimensions; the workspace fits their bounds and loose artwork. Nested artboards are rejected. Missing metadata retains the original single-canvas behavior.

`booleanComposition: true` selects live sequential composition of the editable path's subpaths using their `union`, `subtract`, `intersect` or `exclude` operations. The default `false` retains SVG compound-path winding semantics. This distinction prevents imported holes from becoming unions. The project keeps operand anchors and handles, so direct editing and undo remain possible. Older prototype builds may ignore these new fields; there is no released-format compatibility promise yet.

Manual **Expand Boolean paths** converts selected writable compositions in one undoable edit. The result stores `booleanComposition: false`, `fillRule: "evenOdd"` and ordinary closed subpaths with union markers, preserving holes, curve handles and paint placement. It introduces no new native-format fields. Export uses the same geometry projection on a derived scene, including owned masks and pattern artwork.

Expansion rejects open contours, non-finite coordinates, coordinates outside ±1e9, unrepresentable extents, more than 4,096 input anchors, more than 16,384 intermediate/output anchors or a cumulative 4,000,000 curve-pair intersection budget. Intersection accuracy is approximately 1e-8 of the control bounds. Failure aborts the command/export explicitly; no partial result or pixel-traced substitute is published. Asynchronous edits are discarded if the target document revision, adoption or selection changes.

Named history snapshots are bounded to 32 per open document and remain session-local. Ordinary undo follows the application's history memory limit, counting each step's new objects and newly embedded sources and fonts. Neither is embedded in the project. Recovery writes `.fvector` checkpoints through the shared photo/vector autosave store, with at most eight versions per session. The default store admits 4 GiB per session and 16 GiB globally, reserving 2 GiB + 32 MiB for an incoming complete write before pruning. These storage limits are separate from the native envelope limit. Session rows identify checkpoints and clean closes; complete snapshots are staged and atomically published before pruning. Captures follow the common autosave preferences, and save/close cleanup drains admitted work. Recovery tries older complete snapshots if the latest one is corrupt. Edits since the last completed capture can still be lost on abrupt termination. See [ADR 0401](../adr/0401-shared-recovery-storage-for-vector-documents.md).

Batch exports write a ZIP of SVG/SVGZ or supported raster files for the whole workspace, selected objects/groups, or root artboards. Each target uses its own bounds and configurable scales/suffixes. Naming collisions are resolved or rejected before rendering. PNG is limited to 16,777,216 pixels and 16,384 pixels per dimension; encoded archive contents are capped at 128 MiB. SVG artboards use rectangular clip paths supported by the bounded clip-path importer. Closed live Boolean compositions are projected into editable Bézier contours for SVG/SVGZ and PDF export; the original `.fvector` operands remain unchanged. No unsupported composition is silently flattened or omitted.

## Editable stroke outlines

**Outline stroke** converts a selected writable path or supported shape into
ordinary filled Bézier contours. The result uses even-odd winding and has no
stroke. If a fill is present, the original identity becomes a group containing
the retained fill below the expanded stroke; placement, overall opacity and masks
stay on that group. Stroke paint coordinates and independent paint opacity are
preserved. Selected groups, artboards, clipping groups, placed vector sources and
glyph-program groups are traversed without flattening their hierarchy. Selecting
points converts the entire owning object's stroke, then selects the resulting
object instead of obsolete anchors. Descendants selected both directly and through
a parent are converted once. The operation is one guarded undo step, and the
format stays version 1.

Center, inside and outside alignment, butt/round/square caps, miter/round/bevel
joins, miter limits, odd dash patterns and dash phase are supported. Dash values
remain multiples of the authored stroke width throughout rendering and expansion.
Open or mixed open/closed paths use the same centered alignment fallback as the
renderer, even when inside/outside alignment is stored. Line arrowheads become a
separate editable filled path above the shaft when the renderer paints separate
passes. Native filter inputs that paint their union instead retain that union,
preserving the actual overlap opacity. Custom presets with an embedded outline
are supported.

Styles, filters, filter masks, clipping masks and knockout remain editable on the
original compositing boundary. Filter sampling bounds are retained. A knockout
object's original fill, shaft and arrowheads stay together as one child so they do
not erase each other. Existing descendants remain above that content.

Locked or hidden objects (including inherited flags), absent strokes, raster images, meshes, adjustments and custom
shape references without a resolvable path are not converted. Artboards and placed
sources are containers, not invented stroke geometry. Frame-border strokes remain
authored on the frame; eligible child artwork is still converted. Layer-style
stroke effects remain effects rather than being baked into paths. Authored shape strokes retain their curves without pixel tracing.

Editable text uses a separate sampled conversion of its actual painted stroke.
Ordinary text retains its full editable fill beneath the new outline; positioned
glyphs retain separate fill/stroke pairs and advances to preserve overlap opacity.
The outline is independent: editing the retained text does not regenerate it.
Temporary opaque coverage is sampled at 8 pixels per local unit (up to 64 for
thin strokes), thresholded at half coverage and simplified within half a sample.
The result is editable closed polygon contours, not original font curves, and
has no embedded bitmap. Existing rich-text stroke rendering limitations remain
unchanged. Tiling-program text strokes and positioned private-glyph aliases whose split
would lose Unicode editing are not converted. Intrinsically colored glyphs are
rejected if their coverage cannot preserve their authored colors.

Text conversion admits at most 4,096 source code units, 16,384 pixels per temporary
dimension, 16,777,216 pixels per capture, 67,108,864 pixels across the selection,
and 16,384 output anchors. Widths requiring more than 64 samples per local unit,
clipped captures and excessive work fail atomically without reducing precision.
Invisible/empty stroke coverage does not create a history entry.

Offsets retain curve segments and check their normal-distance error against
`min(0.01, width / 1000)` local units (with a normalized numerical floor of 1e-7).
Circular caps/joins refine their cubic arcs according to the same tolerance.
Each offset is subdivided at most 16 times. Input is bounded to 4,096 anchors,
generated geometry to 2,000 pieces, cumulative topology work to 4,000,000 curve
pairs, and the result to 16,384 anchors. Degenerate or numerically unresolved
geometry fails explicitly before any selected object is replaced.

Detached variable-width profiles also have an ordinary artwork fallback through
`VectorWidthExpansion.expand`. It currently admits independent explicit open
or closed paths with centered, undashed strokes, all caps/joins, without effects or soft masks.
The normalized boundary and any retained fill use the same paint-coordinate and
composition contract above. The fallback stores **ordinary paths only**; it does
not persist width nodes. Retained artwork separately stores the optional profile
described below and supports the ordinary Outline stroke command. See the
[width-profile contract](../features/path-width-profiles.md#evaluation-and-publication)
for admission and validation.

## Shared binary resources (unpublished version 1)

New writers keep `version: 1` and optionally add `binaryResources`. Keys are
lowercase SHA-256 hex digests; each value has exactly `byteLength` (decoded bytes)
and `bytes` (base64). Participating binary fields hold `{"resource": "<digest>"}`
instead of repeating base64. Readers also accept the former inline strings.

This applies to placed `source.bytes` and `source.editableDocument`,
`pdfOrigin.bytes`, `aiOrigin.bytes`, `embeddedFonts` entries, scene `iccProfile` and
`sourceProfiles` entries, and embedded pattern `rgba`, native `pixels` and
native `icc` fields. Internal printing-function schemas retain their independent
encoding and limits. Nested projects remain opaque source payloads until opened.

A table admits at most 4096 unique resources and 80 MiB of decoded bytes.
Placement metadata and source identities remain independent; equal bytes share
one immutable buffer after reopening. Inline legacy sources are interned during
that read, under the same aggregate resource budget. Binary fields copied by font, profile,
PDF and pattern models additionally have an 80 MiB logical expansion budget;
repeated immutable placed-source references do not duplicate that charge.
Every table payload is
checked against its declared length and digest; missing, malformed, oversized
and unreferenced entries fail before document adoption. References cannot access
external files or another project. Per-field limits still apply, including
32 MiB per placed source/archive, 16 MiB per font, the source-profile collection
budget and the existing pattern validation.

Old version-1 and development version-2–9 files remain readable. Ordinary saving
writes the new version-1 representation. Older prototype applications may not
read these new references; publishing the current schema does not make those
prototype readers compatible.
Clipboard and standalone preset writers still emit inline base64. The outer
`.focale` archive version is unchanged when its embedded `.fvector` changes.
See [resource ownership and loading](../architecture/vector-resources.md) and
[ADR 0435](../adr/0435-shared-vector-project-resources.md).

## Creative production metadata (optional version 1 fields)

The unreleased native envelope remains **version 1**. `scene.variables` contains bounded variable definitions, named data sets and their active identity. `scene.compositions` contains at most 256 uniquely identified variants: name, comment, capture flags and per-object visibility, local translation and appearance. Applying a composition changes only captured property families and respects inherited locks; missing object references are reported instead of deleting other objects.

An object's optional `style` stores the complete shared `LayerStyle` representation: all ten effect families, their contours/noise/gradients/textures, fill opacity, channel blending, Blend If, knockout and mask/effect ordering. `blendMode` accepts the same `LayerBlendMode` values as native layers. Display and raster captures use the historical `DocumentCompositor`; SVG/PDF exporters still validate their own representability instead of discarding unsupported appearance.

The optional `stylePatterns` array embeds imported effect textures using the existing `PatternAssetJson` entries (`id`, `width`, `height`, base64 straight RGBA and optional native process samples). Content identities and byte counts are validated with the common portable pattern codec. Built-in patterns require no embedded pixels. This payload follows object copying, appearance presets, undo, project save and recovery; decoded textures belong to rendering resources rather than history values. Older version-one files omit it. The 128 MiB project limit includes every payload; effect texture preparation additionally admits at most 32 MiB of decoded display/native samples per capture. The unreleased format remains version 1.

An object's optional `source` stores source identity/name, embedded or linked storage, format, optional local path and modification time, base64 retained source bytes, local width/height and the raster flag. SVG source groups retain their child objects. Raster placements render retained bytes; external links are never followed by the project decoder. Both storage modes remain viewable without the external file. Explicit refresh/relink installs a new snapshot with one undo entry. Each retained source or nested editable archive is limited to 32 MiB; image decoding is limited to 16 million pixels per image and 32 million pixels per scene display capture. Native projects use the 128 MiB envelope and shared resource budgets above. Visible display captures share identical decoded sources and defer hidden subtrees until shown; their 32-million-pixel allowance counts distinct images, including filter previews.

SVG exports embed supported raster bytes using data URLs and preserve vector source children. Placed SVG children are clipped to their retained source viewport for rendering and picking; export uses rectangular clip paths, which the bounded clip-path importer supports. Import accepts embedded PNG/JPEG/WebP image data with intrinsic-size aspect fitting and rejects external URLs. Supported vector patterns, CSS blend modes and soft masks remain editable. Unsupported native effects require native storage or raster export. An SVG export is an interchange projection and does not retain source-link metadata, variables, compositions, histories or actions.

## Canvas production metadata (optional version 1 fields)

The unreleased envelope remains **version 1**. Absent fields retain the prior behavior.

* `scene.inspection` stores a shared `MeasurementScale` and at most ten uniquely numbered color-sample positions/display formats. Coordinates must be finite and within ±1e9; colors are derived from the current rendered scene and are never serialized. Calibration and marker edits participate in undo. The ruler gesture, measurement-log rows/column settings, hover readouts and selected gradient handles remain session state. Tool defaults and saved calibration presets are preferences.
* `VectorPaint.pattern` embeds a bounded PNG tile as a `VectorSource`, plus positive local `scale` (0.01–100), `angle` in radians and a local `origin`. Fill, outline and text paints use the same repeating shader. Documents own their tile bytes independently of catalogue removal. The pattern catalogue is the one used by photo documents, imported and exported as `.fpattern` or PAT libraries; choosing a preset embeds a PNG copy of its tile.
* `object.mask` holds one self-contained closed `VectorPath`, fill rule, enabled flag and optional `frame` flag. Frame masks belong to structural groups, independently of child placement. A cover-fit command updates content transforms; it never changes the frame path. Nonprinting placeholders and selection edges are not exported. Ordinary masks can be enabled/disabled or removed without removing content. SVG accepts bounded single-shape `clipPath` definitions in user-space coordinates, including transformed paths/rectangles/ellipses/polygons and even-odd winding. External, recursive and object-bounding-box clips are rejected. SVG preserves clipping appearance; native frame semantics remain `.fvector` metadata.
* `object.blendMode` and captured appearances accept the full shared `LayerBlendMode` enumeration; absent means normal. Group isolation and pass-through follow the common compositor. Unknown names fail admission. Effects use the complete shared `LayerStyle` codec described above.
* `scene.slices` uses shared `SliceCollection` (`order`, `slices`) and `SliceWebOptions`: authored rectangles, layer-driven rectangles with a stored fallback, names, image/no-image mode, links, accessible alternative text, background and text/HTML alignment. At most 512 slices are admitted; IDs/order must match and rectangles must have finite coordinates and positive extents. Deleting a source freezes its last resolved bounds as a user slice. Derived automatic cells and selection are not stored.

Slice exports reuse Focale's partition, numbering, safe filename planner and HTML/CSS builder. Each visible cell is cropped from the composited scene, including cells crossing artboards; SVG/PNG variants go into one ZIP. Optional HTML uses the first requested size variant at the original cell dimensions. No-image cells contribute only markup. Coordinates are normalized against the workspace for negative artboard positions. The common per-image and archive budgets apply. Slice overlays, guides, ruler measurements, color markers, source links and application metadata are not included in image output.

SVG remains an explicitly limited interchange format: pattern fills, appearance effects, non-normal blend modes and advanced text are refused at export rather than silently discarded. Native projects retain them, and PNG exports render the supported appearance.

## Production metadata (optional version 1 fields)

`scene.metadata` uses Focale's bounded document metadata serialization (title, author, description, keywords, copyright, camera fields and retained EXIF/IPTC/XMP packets). The File Information dialog records one reversible edit. SVG exports synchronize XMP; PNG/JPEG include descriptive packets only when requested in export settings.

`scene.counts` stores ordered count groups and markers using the shared model, including names, colours, visibility and marker/label sizes. These are non-printing overlays. `isMeasurementScaleMarker` identifies an ordinary editable group containing vector bar geometry and optional rich text; the calibration remains in `scene.inspection.scale`. No image is baked into the native project.

Affine transforms retain original paths/shapes. Projective transforms now retain a deformation operation and the original artwork; expanded sampling extents are described below. The geometry-only projection utility remains available for callers explicitly requesting editable outlines. Proof settings, selections, lasso drafts, export recipes, diagnostics preferences and update state remain outside the native project. The `.fvector` envelope is still version 1.

## Frame animation and editable deformations (optional version 1 fields)

The native envelope remains **version 1**. Optional `scene.animation` uses Focale's `DocumentAnimation` codec: one to 1,000 uniquely identified frames, each with `id`, `name`, `durationMilliseconds` (0–655,350 milliseconds) and `layerVisibility` keyed by stable object identity. `loopCount` absent means a single pass; zero means infinite looping; a positive integer is the repeat count after the initial pass. Playback uses a 20 ms minimum delay for zero-duration frames; the project retains the authored duration. Missing animation metadata preserves still-document behavior.

Frame projection does not alter authored object visibility. Geometry edits, saves, undo and recovery retain the authored scene plus its frame overrides; selected frame and playback timer are session state. GIF export renders each immutable frame with the common timing/loop model and bounded streaming encoder. It does not include nonprinting guides, handles or overlays. No transform interpolation or keyframe tracks are stored.

Confirmed grid, pin and perspective deformations retain the original content and their editable parameters in the common smart-filter stack. See the retained-modifier contract below. View identities, window placement, synchronized navigation, mirror/repeat preview and display calibration are not native artwork metadata. Calibration and tool options are application preferences; view framing is session-local.

## Retained SVG source (unreleased version 1)

The optional top-level `svgSource` string stores the SvgKit-decoded original XML,
including metadata and unused definitions. SVGZ is decompressed and UTF encodings
are normalized before retention. This is immutable source context, not the current
artwork: `scene` remains authoritative during editing, history, recovery and save.
Older projects without this field still load. The 128 MiB project limit
includes the source, and reopening validates it with bounded SvgKit XML parsing.
No scripts or external resources are executed or fetched.

Whole-file SVG imports have no URL fragment, so CSS `:target` selectors never
match. Their conditional declarations remain in the retained source and an
unchanged SVG export, without affecting the editable default appearance.
Imported clipping outlines close open contours using fill semantics and omit
move-only contours; a wholly empty outline still clips away all content.

An unchanged scene can export the original document. Changed scenes are encoded
from native values, retaining supported nonvisual annotations by object identity.
Deleting an object cannot resurrect it from the source. Referenced instances are
expanded into independently editable native objects; their SVG `<use>` structure
is retained only by an unchanged export. See [ADR 0345](../adr/0345-svg-corpus-compatibility.md) for import and rendering compatibility decisions.

The shared gradient coordinate helpers use `userSpace`, `gradientTransform`,
`focus` and `focalRadius` for imported paints. Ordinary encoded-sRGB stops remain
exact; other native interpolation modes use sampled vector stops. Gradient handles
map through the same affine coordinates as the renderer. These optional scene
fields and the SVG envelope addition do not increment the unpublished version.

## PDF interchange and shared graphics (unreleased version 1)

Optional top-level `pdfOrigin` owns base64 PDF `bytes`, imported baseline `pages`,
text-object-to-font-object `fonts`, and annotation-object-to-reference-pair
`annotations`. These are immutable source context; the editable `scene` remains
authoritative. The 128 MiB envelope budget includes this source and baseline; the original PDF payload remains limited to 20 MiB.
Top-level `embeddedFonts` maps stable content-hash family names to base64 font
programs used by current text, including auxiliary artwork. This also retains
embedded text copied into a project with no PDF origin. Reopening registers and
checks those identities before presenting the document.

PDF documents display transparent page backgrounds as white paper in the canvas
and its color-proof preview. This cached display projection does not modify the
authored artboards, source baseline, history, native serialization or exported
alpha. Explicit page colors remain authoritative. Native/SVG artwork, placed PDF
content and Illustrator documents with a PDF compatibility source keep their
existing transparency; white paper applies only to top-level PDF document pages.

PDF file opening prepares the first page and fits it in the viewport. Other
artboards retain `deferredPdf: {source, index}` until requested by the viewport
(including a half-viewport prefetch margin). `source` is the complete original
PDF in the shared binary-resource envelope, limited to 20 MiB; `index` is a
zero-based page index below 10,000. The marker requires an artboard group. It is
not an empty page: its children are the user's additions, and source children
are inserted before them when preparation completes. IDs, transforms, names and
later edits remain authoritative. A malformed or unsupported pending page
produces a visible error with retry; it is never exported as an empty page.

Native save preserves pending references, including copied pages. PDF, SVG,
raster and native-layer projection resolve their pending source artwork before
conversion. Low-level PDF/SVG writers reject unresolved markers. Preparing a
page updates the saved baseline without adding an edit; undo/redo reapplies
already prepared content. Results from a closed/replaced session are ignored.
Copied pages in another PDF use their own embedded fonts rather than borrowing
coincident object numbers from the destination graph. Page source graphs and
font caches have weak ownership; encoded image reuse is limited to 32 MiB per
source. GPU image demand follows visible pages. Prepared editable objects stay
available for editing, so this is progressive loading rather than constant-memory
streaming of arbitrarily large documents. See [ADR 0455](../adr/0455-pdf-fidelity-and-progressive-pages.md).

New optional object fields are `fillOpacity`/`strokeOpacity` (0–1, default 1),
`strokeMiterLimit` (at least 1, default 4), `strokeDashOffset` (stroke-width units,
default 0), `isolated` (default true), `softMask` (native artwork),
`luminanceMask` (default false), `textLayoutSource` and finite `textAdvances`.
Opacity masks also retain optional `maskInverted` (default false) and `maskClips`
(default true). Luminance artwork is composited over black when clipped and over
white otherwise; alpha masks ignore `maskClips`. Inversion complements the
complete resulting coverage before density and feather. Disabled masks retain
all their authored parameters. The shared compositor and mask capture apply the
same order. Current SVG/PDF preparation produces a bounded grayscale mask when
these non-default semantics require it, reports rasterization, and resets the
consumed flags on the derived mask. Vector-only export refuses that conversion.
Native project storage retains editable artwork and both flags unchanged.
The optional `maskLinked` flag defaults to true. When false, authored affine
placement edits compensate the local mask transform so its position in the
owner's parent space stays fixed, including while disabled. A singular object
placement is rejected for an unlinked mask. Reparenting and export coordinate
conversion retain the local object/mask relationship rather than compensating
an apparent edit. Linking is independent of linked-object selection groups.

Imported advances apply only while the text and its metrics remain unchanged.
PDF-supported darken/lighten, dodge/burn, hard/soft light, difference/exclusion
and hue/saturation/color/luminosity join the previously supported blend modes.

`VectorPaint.tiling` stores `artwork`, `[left,top,right,bottom]` bounds, nonzero
`[x,y]` repeat steps and a six-number affine transform. Gradient paints also retain
`extendStart`/`extendEnd` (default true) and `constrainFocus` (default true).
`object.mesh` owns `points`, ARGB `colors` and triangle vertex `triangles`; it is
exclusive of path, procedural shape, text, source and child geometry. Mesh limits
are 65,535 vertices and 300,000 indices. `source.interpolate` defaults to true;
false selects nearest-neighbour raster sampling.

All fields are optional for older projects; the unpublished format remains
version 1. Auxiliary editing tabs and selected mesh vertices are session state,
not additional native artwork fields. See the [interchange corpus](../development/interchange-corpus.md) for export
precision, retained source semantics and unsupported PDF policies.

## Precise paints and editable transfers (optional version 1 fields)

A solid `VectorPaint` may carry `exactColor`, using the shared `ProfiledColor`
codec (profile identity, native components, alpha and floating working RGB).
Packed ARGB remains its display fallback; an exact value whose fallback no longer
matches is ignored. Text uses the same precise character colour, including styled
ranges. Gradient stops already use the common precise colour and independent
opacity-stop model; reversing a gradient preserves those values and midpoints.

`scene` carries `colorMode` and `colorProfile`, with optional base64 `iccProfile`
for its working profile. `sourceProfiles` maps content-derived profile IDs to
base64 ICC payloads referenced by imported or pasted paints. Built-in profiles
need no payload. Resource decoding validates profile identity, count and encoded
size before accepting the collection. Missing fields retain sRGB defaults.
CMYK/Gray/RGB and supported ICC paints retain their native components in PDF
output; gradient functions use bounded 257-sample, 16-bit tables. SVG exports
convert to the existing sRGB representation. Native projects retain full values
without changing the unreleased format version.

Portable clipboard data is shared with native layer copy/paste. Compatible
shapes, texts and groups become ordinary editable destination objects/layers.
Contents without an equivalent retain an incorporated editable source and a
preview. A vector `source` may therefore include base64 `editableDocument`,
containing the complete native `.focale` archive; its usual `bytes` hold the
preview image. The per-source 32 MiB bound also applies to this archive.
These bytes are retained through copying, undo, project save and recovery.
Editing the source opens the normal nested-document editor; saving updates its
owning object only while that parent adoption and source are still current.

### Positioned glyph clusters (unreleased version 1)

`textGlyphs`, `textClusters` and `textCodes` are optional arrays paired with
`textAdvances`. `textGlyphs` contains display strings, including private-use font
aliases for imported ligatures. `textClusters` contains the corresponding
original Unicode strings, whose concatenation equals `textLayoutSource`.
`textCodes`, when present, contains lowercase hexadecimal PDF character codes
of one to four bytes. Source codes are used only with a matching retained font;
re-embedding preserves display glyphs and emits original Unicode mappings.

Each array is limited to 100,000 items, each string to 128 UTF-16 units. Glyph,
cluster and advance counts must agree; source codes are either absent or have
the same count. Legacy objects without these arrays keep per-Unicode-scalar
advances. Changing text/font metrics invalidates positioned drawing. Ordinary
Unicode remains in `text.text`, so search and editing do not expose aliases.

Clipping masks accept empty and degenerate closed contours. They represent an
empty visible region; disabling or editing the mask can reveal its children.

`replacementText` is an optional Unicode string (at most 100,000 UTF-16 units)
representing a whole artwork span. PDF ActualText uses it for color emojis or
other graphics assembled from several glyphs. It belongs to the containing
pass-through group, survives native transfers and is re-emitted around the
entire span. It is distinct from each child text object's Unicode mapping.

## Editable filter stacks and common output

Objects may retain a `filters` array of native `SmartFilter` records (at most
128, with distinct IDs). Each record retains its operation, enabled state,
opacity and blend mode. Operations include catalogue filters, Filter Gallery,
Shape Blur, Camera Raw, the shared `adjustment` operation and retained SVG graphs
(`svgGraph`, documented in [SVG filters](svg-filters.md)). Geometry, text and
group children remain authored content; derived filter images are not saved.

Optional `filterMask` contains an authored object subtree in the owner's local
coordinates. Its luminance multiplied by alpha blends the unfiltered input with
the filtered result. `filterMaskEnabled` defaults to true and
`filterMaskInverted` to false. An absent mask means full coverage. These fields
remain independent of the outer clipping and soft masks. Older version-1
projects without these fields keep their previous appearance.

Canonical raster export uses the common encoder catalogue, colour profile,
conversion settings and raster admission limits (100 megapixels and 30,000
pixels per dimension, subject to memory and codec support). Compatible native
shapes, text, gradients and decoded placed images retain native channels before
encoding. Specialized leaves requiring the Canvas renderer still pass through
an 8-bit fallback at output resolution; full precision is not promised for those
constructs. Print and proof share the native conversion pipeline. Pixel-filter evaluation
scales up to the native parameter limits, then resamples that result for larger
output rather than shrinking the authored filter radius.

A sole supported SVG graph at full strength with normal blending and no active
filter mask exports as native SVG filter markup; its source geometry remains
vector. Other active pixel-filtered subtrees are prepared as embedded images for
SVG/PDF export,
retaining their outer transforms, masks, style and compositing. Other supported
artwork remains vector. The editable project keeps the original stack and
contents. Direct synchronous SVG encoding rejects active stacks outside the
retained SVG dialect when they have not been prepared. Embedded-image and codec admission limits still apply; raster
export and vector-container fallback admission are separate policies.

## Legacy PDF graphics and baseline sharing (unreleased version 1)

Optional `knockout` (false), `fillOverprint` (false), `strokeOverprint` (false)
and `overprintMode` (0 or 1, default 0) retain PDF graphics state independently
of the RGB preview. Group properties expose knockout; paint properties expose
fill/stroke overprint and zero-ink retention. Export preserves process components
and overprint settings. RGB display does not simulate printing separations.
Knockout coverage currently supports normal-blend geometric children, including
clipping and opacity masks; unsupported intrinsic shapes remain explicit errors.
Even an entirely transparent child removes earlier group coverage in its shape.

`glyphProgram` stores a Type 3 glyph's byte `code`, encoding `name` and finite
horizontal `advance`. Its owner's children are editable graphics in font units;
the owner's transform positions them. Native transfer, save and PDF export retain
this identity independently of Unicode. A supplied ToUnicode mapping remains
`replacementText`; unknown Unicode is never guessed. Rewritten glyphs use Type 3
programs, including binary image stencils; identical programs share one font. Arbitrary color edits require `d0`,
which can change a PDF viewer's glyph-cache rasterization relative to source `d1`
programs even when every stencil pixel remains identical.

A baseline page or subtree in `pdfOrigin.pages` can be `{"sceneObject": "id"}`
when it equals an already serialized scene object. Decoding resolves this only
against the validated immutable scene; missing references, repeated baseline
identities and expanded trees above 50,000 objects fail. A pattern tile shared by
several fills may repeat its identities only when every occurrence is equal. Edited subtrees retain
their original baseline. Older self-contained baselines remain readable, and the
128 MiB project budget includes retained baselines. Direct RGB JPEG scans keep their compressed
codestream after dimension checks, avoiding unnecessary native PNG expansion.

Nonembedded Standard 14 faces use the host font resolver and become portable
embedded metric peers for detached native copies. Such fonts can differ visually
from another PDF viewer's substitute. Bounded Type 1 conversion retains curves
and advances without executing PostScript; Type 1 raster hints are not retained.
Name-keyed CFF retains glyph identity and embeds explicit encodings.

Uncalibrated DeviceCMYK uses the CC0 CGATS001Compat preview LUT from ChromaLib.
Its exact colours use the built-in `pdfDeviceCmyk` profile identifier. Only its
forward conversion is needed; it is never assigned as an editing, proofing or
print profile, and conversions into its inks use the `genericCmyk` black
generation. Original CMYK components remain authoritative for PDF export, which
writes them as DeviceCMYK.
The pinned source, license and deterministic normalization are recorded in
`assets/legal/pdf-device-cmyk.txt` and `tool/generators/prepare_pdf_cmyk_preview/prepare_pdf_cmyk_preview.py`.
PDF alpha constants are clamped to [0, 1]. Only duplicate `Group` keys are
admitted by the host; PdfCore stays strict unless explicitly configured.

## Common editable artwork (unreleased version 1)

Paints optionally carry `content`, using the native `FillContent` codec, and
`resources`, using `EmbeddedPatterns`. This covers angular, reflected and diamond
ramps, dithering, reverse, exact gradient stops and native pattern tiles on fills
and strokes. Existing solid/linear/radial SVG paints remain readable. The common
paint controls and gradient handles retain these settings; native pattern bytes
travel through presets, clipboard, recorded operations and project JSON.

`adjustment` uses the native `LayerAdjustment` payload and identifies a backdrop
adjustment, without geometric/text/source content or children. It shares native
opacity, blend, group-isolation and mask rules. It operates on content below it,
whereas an adjustment in `filters` operates only on its owner's input. The common
backdrop planner serves both canvas compositors.

`maskEnabled` defaults to true; `maskSettings` and `filterMaskSettings` use native
`MaskSettings` (density and feather). Mask artwork remains local to its owner.
Painting opens a transient native mask workspace with brushes, pixel selections,
inversion and Select and Mask. Apply transfers coverage, coordinates and settings
in one parent undo step; Cancel leaves the parent unchanged. The workspace is not
an open document tab. Outstanding edits or a replaced parent invalidate Apply.
It stores a PNG coverage snapshot; native tool history belongs to the transient
session, while authored shapes/text/groups remain in the parent.

A filter with `operation.type = "deformation"` carries `recipe`: either a mesh
(`columns`, `rows`, backward normalized `offsets`) with optional `puppet` pins,
elasticity/density/expansion controls; or `planes`, each retaining source and target
corners. Mesh dimensions are 2–129 per axis and puppet drafts admit at most 1,024
pins. Existing plane validation applies. Parameters reopen in the original common
dialog. Evaluation uses native displacement/perspective kernels and source channel
precision. Optional `filterBounds` is a finite positive local `[x,y,width,height]`
sampling frame. A projective transform can expand it; when expanding an existing
stack, an editable child keeps the previous sampling frame. Affine transforms
remain exact geometry transforms. Mesh/pin dialogs use a fixed input extent;
content moved beyond it is clipped. Original paths, text, sources and paints are
never replaced by derived preview pixels.

Source preparation uses the ordinary file decoders, including TIFF, layered
PSD/PSB/XCF/native archives, and PDF/AI/SVG. Raster sources keep their original
encoded precision; layered sources retain `editableDocument` plus a display PNG,
and high-precision rendering reads the archive. Authored sources retain canonical
project bytes, source fonts/profiles and editable children. Linked saves use the
actual destination codec, with `byteLength` describing the external file rather
than the retained display snapshot. Linked native archive caches in `.fvector`
are owned inline; a `.focale` placed-content record still resolves its external
file. Existing import/source byte and area admission limits remain in force.

PSD/PSB/XCF export projects the scene into the native layer tree and reuses existing
adapters. Compatible groups, shapes, text, masks and adjustments follow each
adapter's supported representation; unsupported object appearances become raster
layers where the adapter permits it. Incompatible composition rules are explicitly
rejected by the adapter (notably XCF backdrop adjustments or unsupported blending).
The shared export option **Flatten image** converts the complete composition to
one native-precision raster layer when requested; it is off by default. XCF still
requires RGB. Those containers do not promise to preserve Focale deformation recipes.
The source project remains unchanged. SVG export rasterizes unsupported native
paints and filtered objects, evaluates mask density/feather, and flattens the full
composition if it contains backdrop adjustments (pass-through groups can affect
outside siblings). This explicit appearance conversion preserves the native
project's editable data. Container/source-image admission limits still apply.

## Object organization and export diagnostics

Objects persist `locked` as the shared `{transparency, pixels, position}` protection
record, `colorLabel` as a `LayerColorLabel` name and optional `linkGroupId` membership.
The unreleased format version stays unchanged. Fine locks apply through ancestry;
labels do not affect rendering. Clipboard duplication remaps link groups with object
identities, and linked movement retains each object's original parent space.

The export conversion report reads the same content rasterization policy as SVG/PDF
preparation and the same structural rejection rules as the XCF writer. It reports
pixel evaluation dimensions (including filter limits), expanded Boolean geometry,
mask conversions and known blockers. Layer retention is distinct from editable
content: PSD/PSB/XCF may adapt an individual layer's contents according to their
codec. Those conversions never mutate the source project.

## Retained variable-width strokes (unreleased version 1)

An explicit single-contour object may include `widthProfile`, using the strict
`PathWidthProfileCodec` payload: `{"version":1,"nodes":[{"id":"point","position":0.5,"left":0.8,"right":0.2}]}`.
Positions are normalized local arc length. Left/right values multiply the nominal
`strokeWidth` before the object transform. Nodes have stable nonblank IDs, distinct
positions in `[0,1]` and finite nonnegative factors; at most 1,024 nodes are allowed.
An empty node list explicitly means uniform `.5/.5`. Absence means an ordinary
stroke; explicit null, unknown fields/versions and malformed values are rejected.

The original `path`, paints, cap, join and miter limit remain ordinary object fields.
Derived outlines/caches are never serialized. Loading evaluates the complete binding
and rejects incompatible or numerically unsupported geometry instead of discarding
width data. Closed contours require continuous left/right endpoint factors. The
initial binding admits centered, undashed explicit single contours without styles,
filters, sources, text or mesh geometry. See the maintained
[width support contract](../features/path-width-profiles.md).

Copy, undo, native save/reopen and recorded vector profile edits retain width nodes.
SVG/PDF export emits ordinary filled outlines in a separate derived scene; raster
and layered export use the common appearance projection. Neither interchange output
changes the native original. Removing variable widths and expanding a stroke are
explicit undoable edits. Pressure strokes use this same payload: the fitted spine
and derived editable nodes survive reopening; raw device samples are not stored.
Reverse, exact subdivision, close and opening a single closed contour preserve
the geometry/profile pair. Other topology operations still require expansion.

## Retained vector brushes (unreleased versions 1 and 2)

An explicit stroke may contain a `brush` instead of `widthProfile`. Version 1
retains open calligraphic/art brushes:

```json
{"version":1,"kind":"calligraphic","angle":45,"roundness":0.25,"profile":{"version":1,"nodes":[]}}
```

Version 1 `kind` is `calligraphic` or `art`. Both carry a finite angle in `[-180,180]`,
roundness in `[0.05,1]` and the strict width-profile payload above. Angle and
roundness affect the calligraphic nib; art follows the spine tangent. Profile
positions always refer to the original spine's normalized local arc length.
The original `path`, `strokeWidth`, paints and placement remain object fields.

Art also requires `fillRule` (`nonZero` or `evenOdd`) and `artwork`, an array of
closed contours. Each contour contains at least three anchors encoded as
`[x,y,inX,inY,outX,outY]`, with relative handle offsets. Missing handles are pairs
of nulls. Anchor positions and absolute controls fit normalized x `[0,1]` and y
`[-0.5,0.5]`, with a `1e-12` normalization rounding allowance. At most 256 source
anchors are accepted. Source names, identities, paints and transforms are not part
of this silhouette payload. Each definition owns immutable source collections.

Version 2 requires `kind: "pattern"`, the same angle/roundness/profile fields and
one `pattern` object. It has exactly these fields: `version: 1`, required `side`,
nullable `start`, `end`, `rightCorner`, `leftCorner`, `fit` (`stretch` or `space`),
finite `scale` in `[0.1,10]` and finite `spacing` in `[0,3]`. Each non-null tile
has exactly `artwork` (the same normalized contour encoding), `fillRule` and a
finite positive `aspectRatio`. All five slots own their source geometry. Natural
tile length equals nominal stroke width times scale times aspect ratio; spacing
is relative to the side tile's natural length. Angle/roundness remain inert for
patterns. Version 2 does not accept top-level `artwork`/`fillRule`; version 1 does
not accept `pattern`.

Pattern spines may be open or closed; closed pressure endpoint factors must
agree. Endpoint sources are retained but ignored on closed spines. Corner slots
refer to the turn direction in local screen coordinates. Fitting, reserved corner
bounds and rigid ornament pressure semantics follow the maintained brush contract.
Named presets are local preferences containing complete definitions; native
objects never store a mutable preset reference.

Unknown fields, kinds or versions, null payloads, malformed coordinates, excessive
collections and dual `brush`/`widthProfile` ownership are rejected. Native loading
validates the complete geometry binding, including family-specific spine/stroke admission and aggregate tile work limits.
Cached outlines are never persisted. SVG/PDF receive ordinary painted contours
from the same derived geometry as display. See [Vector brushes](../features/vector-brushes.md)
for the supported authoring and numerical contract.

## Retained Live Paint (unreleased version 1)

An ordinary group may contain `livePaint` beside its editable `children`:

```json
{"version":1,"gapDistance":0,"edgeColor":4278190080,"edgeWidth":1,"marks":[{"source":"boundary-id","x":30,"y":40,"edge":false,"color":4294901760,"width":1}]}
```

Children are independent editable path/shape sources. Their transforms remain local
to the group. Source appearance is retained but inactive; initial fills are empty
and unpainted authored edges use `edgeColor` and `edgeWidth`, with round caps/joins.
Virtual gap bridges have no stroke. Gap distance and stroke widths use group pixels.

Each chronological mark holds a source object ID and a point in that source's
local frame. `edge: false` resolves into the containing face that still includes
that source; `edge: true` resolves to its closest boundary fragment. The last
resolving mark wins. A null colour explicitly erases paint. A split paints only the
face containing the seed; missing faces or sources leave dormant marks. Copying
remaps source IDs together with the group's children. Derived region IDs, edge IDs
and caches are never serialized. See the [editing contract](../features/live-paint.md).

The decoder validates version 1, finite coordinates with absolute values at most
`1e9`, widths in `(0, 1e6]`, gap distance in `[0, 1e6]`, nullable unsigned 32-bit
colours and at most 1,024 marks. Loading validates the full binding against the
bounded detector and its 4,000,000-operation matching budget. Invalid bindings
fail instead of silently losing paint. No released envelope version changes.

The shared renderer and SVG/PDF preparation consume ordinary derived filled paths
and stroke fragments; saving the native document retains the sources and marks.
Interchange does not retain Live Paint editability. **Path → Expand Live Paint**
replaces source children and marks with ordinary filled/stroked paths in one undo
step, preserving the group's identity, transform and compositing properties.
Generated object/path IDs avoid existing artwork and resource IDs. Empty appearance
becomes an empty group; undo restores hidden source data and dormant marks too.
Native save/reopen supports both states. Ordinary Ungroup remains refused on a
retained group; expanded groups follow the usual mask/effect/opacity restrictions.
The [independent acceptance matrix](../../tool/validation/live_paint/README.md)
verifies native round trips, exact expansion/undo and SVG/PDF vector appearance.

## Ordered object paints (unpublished version 1)

An optional object `paintStack` array stores back-to-front paints without source
geometry. An absent or empty list means the existing fill-then-stroke order.
Every nonempty list has exactly one `primaryFill` and one `primaryStroke` entry,
plus zero or more `fill`/`stroke` entries, with at most 32 entries total.

Primary entries reference the owner's existing paint
fields. Other entries contain `role` and `paint` (the ordinary `VectorPaint`
codec). Additional strokes also store `width`, finite and between zero and
1,000,000 local units. Their cap/join/alignment/dash settings follow the source.
Additional fills use width one internally and omit it. Unknown roles, duplicate
primary slots, missing primary slots and invalid widths fail validation.

Every entry can additionally store `opacity` (finite, zero through one, default
one), `blendMode` (the shared named layer blend mode, default `normal`), `visible`
(default true), `style` (the common layer effects and advanced blending codec)
and `stylePatterns` (the common embedded pattern payload). Defaults are omitted.
Primary slots may own these composition fields, but cannot own `paint` or
`width`. A pass's effects and opacity apply before the owner's composition.
Hidden passes retain their paints and effect resources for subsequent editing.

The stack belongs to shape, path or text content with no child artwork. It does
not supply geometry to image, mesh, Live Paint, artboard or adjustment objects.
Paint resources, profiles and pattern artwork follow the same native ownership
and duplication rules as ordinary paints. Runtime-derived paint passes are not
stored. Object transforms, clipping, effects and compositing remain outside the
ordered passes. Geometry is retained once; undo retains immutable paint recipes.

The separately versioned editable clipboard writes version 2 when copied artwork contains a
stack, and otherwise retains version 1. Its reader accepts both. Previous readers
reject version 2. Appearance recipes use the same optional `paintStack` field;
a complete captured recipe includes an empty list to clear a target's stack,
whereas older partial recipes without the key leave it unchanged.

Explicit paint-stack expansion writes ordinary groups and independent paint
objects; it has no new native field. The original object identity and composition
remain on the outer group. Hidden/empty paints, effects and retained text/brush
content remain editable children. Their paths, flow paths and pattern artwork
receive independent identities. Retained and expanded documents both use unpublished `.fvector` version 1.

## Document symbols (unpublished version 1)

`scene.symbols` is an optional list of `{id, name, artwork}` definitions. `artwork`
is an ordinary object tree in definition-local coordinates. Instances store only
`symbolId`, plus their own object identity, placement and outer composition. A
bound definition is derived at scene construction and never serialized inside an
instance. Definitions without instances remain stored in unpublished `.fvector` version 1.

References must resolve to exactly one document definition. Definitions cannot
contain symbol references or artboards, including in masks or paint tiles.
Instances cannot also own geometry, text, meshes, sources, paint stacks, brushes,
width profiles or children. At most 256 definitions and 10,000 artwork nodes per
master are admitted, within the existing envelope limits. Paths are immutable
owned values. Definition replacement updates all references in one undo step.

Native clipboard version 3 carries the same `symbols` table, restricted to used
resources. Paste regenerates instance identities, reuses equal local definitions
and assigns a new definition identity when an imported identity conflicts with a
different local master. Version-1/2 clipboard content remains readable.

SVG/SVGZ preserves admitted ordinary symbol references with standard `defs/use`;
other symbol appearances and PDF expand to independent artwork. See the transfer
rules below and [the editing contract](../features/vector-symbols.md).

### Scoped symbol overrides and detachment

An instance may store `symbolOverrides`, an object keyed by master object ID.
Each value has optional `fill`, `stroke` (ordinary `VectorPaint` JSON) and `visible`
(boolean) fields. Absence inherits the current master; a none paint explicitly
suppresses that primary channel. Only solid/gradient/none paint is admitted; no
external pattern or tiling resource is accepted in an override. At most 256 target
entries are allowed. Unknown fields are rejected.

Targets are ordinary master tree objects, excluding mask and tile internals.
Missing target IDs remain dormant. Paint fields on a target that no longer has
paintable geometry remain dormant, while its visibility override still applies.
Reset removes overrides explicitly. The master definition is never rewritten by
an instance override. Detached content resolves overrides, removes reference and
override fields, and renews all owned identities beneath the original instance
composition. Exact undo retains the original reference and dormant entries.

### Symbol resource admission and SVG transfer

The unpublished version-1 envelope retains these fields. Definitions are validated before geometry is
frozen, with separate per-master, aggregate-table and repeated-instance budgets
specified in [document symbols](../features/vector-symbols.md). Missing,
duplicate and recursive definitions are invalid. Clipboard conflict remapping
changes the definition identity while keeping master-relative override targets.

Supported SVG/SVGZ exports use standard `defs/use`, preserving instance identities
and library references via `data-focale-symbol-id`. Globally unique SVG content IDs
replace definition-local object IDs. Differing inherited contexts are separate
masters on import. Overrides/procedural appearances and PDF expand explicitly;
the native project remains the complete authoring representation.

## Named document colours (unpublished version 1)

`scene.colors` is an optional list of `{id, name, color, ink?}` definitions. `color` is
the existing portable-colour JSON record: exact profiled components plus portable
working RGB. The table admits at most 1,024 unique nonempty IDs; IDs/names are at
most 256 characters. Unused definitions remain stored. A solid paint may contain
`reference: {id, tint}`, where `tint` is finite and within `[0, 1]`. The usual
`color`/`exactColor` paint fields retain its resolved appearance. Binding resolves
the authoritative definition in the document profile before rendering or editing;
missing references and references on nonsolid paints are rejected. Derived
bindings are never embedded in paint JSON.

Process-colour tint interpolates components toward paper white, or multiplies
CMYK ink amounts toward zero. A spot definition evaluates its retained `ink`
function instead. Alpha is unchanged. The [colour contract](../features/document-colors.md)
describes supported channels, immutable binding, workspace merging and limits.
Native clipboard version 4 carries a used `colors` table alongside version-3
symbol resources, remapping incompatible destination identities while retaining
tints. Readers still accept older envelopes; older readers reject version 4.
Application appearance presets intentionally retain independent resolved values.

The raster `.focale` archive has no new top-level palette field. Editable vector
placement contains a version-1 nested project when named colours are present.

## Linked document graphic styles (unpublished version 1)

`scene.graphicStyles` is an optional list of `{id, name, appearance}` recipes.
`appearance` contains every field of the complete appearance contract: primary
and ordered paints, stroke settings, paint opacity, object opacity/blending,
isolation and object style/textures. Geometry, content, masks, smart filters and
placement are not part of a recipe. Each linked drawable stores `graphicStyleId`
alongside resolved appearance fields. Derived definitions are not repeated in
object JSON. Missing, duplicate and incompatible references fail explicitly.

There are at most 256 styles with nonempty IDs/names of at most 256 characters.
Recipes may reference named colours but cannot contain linked styles or symbols.
The [document library contract](../features/document-colors.md#linked-graphic-styles)
defines resource limits, immutable tile ownership and local-detachment behavior.
Unused definitions remain saved. Native clipboard version 5 carries used styles
and their colour dependencies once, remapping conflicts on paste. Readers accept
older envelopes; readers without style support reject version 5.

Recolour Replace redirects references while keeping the old colour definition;
Merge redirects and removes it. Both preserve local tints. Recipes, masters and
artwork participate in one history transaction. The `.focale` outer archive is
unchanged; an editable placed vector contains this complete version-1 project.

SVG/SVGZ and PDF export explicitly resolve colour/style links before other
appearance projections. Their output contains ordinary paints and composition,
without these native tables or identities. PDF additionally retains named ink
spaces and exact tint components. A single imported PDF spot ink creates its
explicit named colour; import does not infer libraries from matching process paints. Layered and raster exports follow their existing
conversion policy and disclose lost libraries, including unused definitions.
See the [interchange matrix](../features/document-colors.md#interchange-contract)
for native transfer conflict rules and each destination's scope.

## Retained object blends (unpublished version 1)

An optional `blend` field on an ordinary group stores `{version: 1, steps,
orientation, spacing?, spine?}`. The group owns exactly two source children;
generated intermediates are derived and never serialized. `steps` is an integer
from 1 to 128. Absent `spacing` selects count mode; present spacing is finite,
positive and at most 1 billion local units. Equal-length spacing intervals may
produce zero intermediates, but never more than 128. `orientation` is `fixed`
or `tangent`. The optional `spine` uses the native path codec with one open
contour, 2–512 anchors and finite control coordinates within ±1 billion units.

The source correspondence, work and placement contract is documented in
[object blends](../features/object-blends.md). A blend cannot also own shape,
path, text, placed-source, mesh, adjustment, artboard, symbol, Live Paint,
glyph-program, ordered-paint, retained-stroke or Boolean source geometry.
Ordinary outer group transforms, opacity, masks and effects remain supported.
The default spine is derived from source geometry centres. Custom spine
stationing moves the interpolated source-centre pivots, including both endpoints.

Native writers retain unpublished version 1. The editable clipboard uses envelope
6 whenever a retained blend is present, including auxiliary masks/tiles, symbol
masters and unused style resources. Older clipboard envelopes remain readable. The spine and private source identities participate
in copying; source geometry is owned immutably. Duplicate private object IDs
are validated even though these children are hidden from the parent editing tree.
The existing `.focale` outer archive remains unchanged.

Source paint references bind to the document palette/styles before evaluation.
The document interpolation profile, caches and generated paths are not stored in
`blend`. Reopening rebinds and validates the complete source/recipe pair. SVG,
SVGZ and PDF preparation derive ordinary artwork through the shared appearance;
export review discloses loss of the live relationship. Native projection keeps
the editable version-1 source instead of misrepresenting it as an ordinary group.
Explicit expansion removes `blend` from the selected owner, retains its outer
composition and gives all generated children/path resources fresh identities.
It does not discard unused document libraries. Save/reopen, clipboard conflicts,
CMYK source bindings, malformed envelopes and retained/expanded SVG/PDF output
are covered by the [blend acceptance contract](../features/object-blends.md).

## Retained object repeats (unpublished version 1)

An ordinary group can retain a `repeat` recipe and exactly one canonical source
child. The recipe has `version: 1` and one of these kind-specific payloads:

```json
{"version":1,"kind":"grid","rows":2,"columns":3,"step":[30,35]}
{"version":1,"kind":"radial","count":8,"center":[100,80],"angle":6.283185307179586}
{"version":1,"kind":"mirror","center":[100,80],"angle":1.5707963267948966}
```

Rows, columns and count are integers. Grid dimensions are positive with a product
at most 256; radial count is 2–256 and mirror count is implicitly two. Steps and
centres are finite local coordinate pairs bounded to ±1 billion. Angles are
radians within ±2π. Grid ordering is row-major, radial instances rotate with the
orbit, and mirror instances reflect across the line through `center` at `angle`.
Full signed turns omit a duplicate endpoint; partial sweeps include both endpoints.
Zero steps and zero sweep are valid. The first instance preserves the authored
source transform exactly. Generated instance translations and linear coefficients
are separately validated before copying, under the
[repeat resource contract](../features/object-repeats.md#limits-and-persistence).

The owner retains ordinary outer transform, opacity, masks and effects. It cannot
also contain shape/path/text/source/mesh/artboard/adjustment content, Live Paint,
a blend, symbol instance, positioned glyphs, ordered paints, retained width/brush
strokes or Boolean composition. The source cannot contain artboards or backdrop
adjustments. Generated objects, evaluation caches and derived profile bindings
are not serialized. Unknown recipe versions/kinds, malformed controls and invalid
source relationships fail admission instead of dropping the construction.

Native projects use unpublished version 1. Editable clipboard envelopes use
version 7 when repeats occur, including owned masks/tiles and stored symbol/style
resources. Previous development project envelopes remain readable. Copying remaps
private source identities and retains used document resources. SVG/PDF export
resolves repeats to ordinary instances and reports the lost live relationship.
An editable placed vector stores the complete version-1 nested project; the
outer `.focale` archive version remains unchanged.

Explicit expansion removes `repeat` from selected owners, preserving their outer
composition and creating fresh owned source copies. Document libraries remain
linked. Nested source constructions remain independently live until explicitly
expanded themselves; export-only projection resolves them recursively. The
[repeat acceptance contract](../features/object-repeats.md) covers actual native
files, clipboard library conflicts, undo, resource limits and independent SVG/PDF
rendering. Expansion introduces no additional persistence fields.

## Retained geometry effects (unpublished version 1)

An explicit path object may store `geometryEffects`, an ordered list of at most
eight records. An absent field means no effects; a present null or malformed
list is rejected. An offset record has these required fields:

```json
{"version":1,"kind":"offset","amount":8.0,"join":"round","miterLimit":4.0,"enabled":true}
```

`amount` is finite within ±1e6 local units. `join` is `miter`, `round` or `bevel`;
`miterLimit` is finite in [1, 1000]. `enabled` is a Boolean. Unknown versions and
kinds fail rather than silently disabling an operation. Recipes store neither
identities nor generated geometry. The ordinary `path` is the immutable editable
source; its fill interpretation remains authored. Generated geometry is rebuilt
and validated on admission, including owned masks/tiles and unused masters.

Two additional recipe kinds use the same unpublished project envelope and recipe version:

```json
{"version":1,"kind":"roundCorners","amount":8.0,"enabled":true}
{"version":1,"kind":"bend","amount":1.0,"enabled":true,"spine":[{"x":0.0,"y":30.0,"outX":30.0,"outY":-5.0},{"x":100.0,"y":30.0,"inX":-30.0,"inY":-5.0}]}
```

For `roundCorners`, `amount` is a finite radius in [0, 1e6]. For `bend`, it is
finite height scale in (0, 100], and `spine` owns 2–64 ordinary anchor records.
Positions and optional incoming/outgoing coordinate pairs must be finite and
within ±1e9, including absolute control positions. Handle coordinates are relative
to each anchor. Optional `type` uses the ordinary `corner`/`smooth` anchor enum.
The spine is implicitly open and has no path/object ID, name or external guide
reference. `join`/`miterLimit` are offset-only fields. Unknown kinds/versions still
fail explicitly. Corner rounding requires linear contours; bending requires closed
source artwork and a regular smooth open guide. Full geometry admission applies on
reopening as well as interactive edits; invalid active geometry is never cached.

Geometry runs before paint/stroke, clipping, raster effects and outer placement.
It cannot coexist with retained width/brush bindings or non-path source content.
The [geometry-effects contract](../features/geometry-effects.md) defines source,
output, cumulative work and coordinate budgets. Complete failure rejects the
project/edit; there is no stale output or partial path fallback.

Native projects retain unpublished version 1. Editable clipboard writers select
envelope version 8 whenever effects occur in owned artwork or referenced/stored
resources. Previous development project envelopes remain readable. SVG/PDF export ordinary derived geometry and disclose loss of
source editing/live parameters; editable photo placement embeds the native source.

## Authored gradient mesh grids (unpublished version 1)

An authored `object.mesh` variant stores `kind: "grid"`, internal `version: 1`,
`2` or `3`, integer
`rows` and `columns` (2–12 inclusive), row-major `points: [[x,y], …]` and packed
ARGB `colors`. Both arrays have exactly `rows * columns` entries. Positions are
finite and bounded to ±1e9; colours are integers from 0 to `0xffffffff`. Grid
records contain no document identities and no persisted triangle/sample cache.
Unknown kinds/versions, malformed pairs and excessive dimensions are rejected.

Version 1 retains implicit straight cubic boundaries and bilinear geometry.
Version 2 requires a row-major `handles` array with exactly `rows * columns`
entries. Each entry stores optional `left`, `right`, `up` and `down` numeric
`[dx,dy]` offsets relative to its node. Absent directions default to one third of
the adjacent chord; a direction without an adjacent node must not be stored.
Unknown directions, malformed pairs, nonfinite/oversized relative or absolute
controls and derived Bernstein hulls outside ±1e9 are rejected. Version 1 does
not accept a `handles` field.

Version 3 adds an explicit `interpolation` (`coons` or `smoothTensor`) and built-in
`colorProfile` identity. Its optional `exactColors` array has one nullable
`ProfiledColor` record per node. A retained exact record applies only while its
packed `argb` agrees with that node's `colors` entry; a packed color edit replaces
only the changed node's exact value. Geometry edits retain all process components
and floating alpha. Optional `handles` follow the version-2 layout. Versions 1/2
reject these new interpolation/color fields instead of misinterpreting them.

Smooth tensor geometry retains shared cubic boundaries and gives each corner
zero mixed derivatives. Color/alpha components use geometry-scaled, limited
Hermite slopes in the selected process space, then convert for display. A
single-cell axis uses endpoint secants. Smooth components must be normalized;
unavailable profiles, unqualified degenerate color tangents and nonfinite
derivatives reject. Existing Coons grids keep their prior default behavior.
Topology insertion samples the old colors and rebuilds smooth cells and slopes;
it does not inherit Coons' exact polynomial-restriction guarantee. Constant channels
and alpha stay exact through sampling/insertion. The `pdfDeviceGray` value profile
retains encoded neutral gray separately from gamma-2.2 gray. PDF shadings retain
supported RGB/CMYK/device-gray components at 16 bits, with precise alpha masks.
The AI adapter admits simple smooth tensor grids with unit weights and constant
corner alpha, preserving native cells and source identities. Broader profiles,
nonuniform placement and parameterized topology changes remain integration work.
New regression execution is deferred to final validation.

Cubic boundaries are shared by adjacent Coons patches. Their numeric 4×4
Bernstein nets are derived, never persisted. Straight display sampling uses eight
subdivisions per direction; cubic records use sixteen (at most 31,329 vertices
and 185,856 indices). These display triangles are not authored topology.
Shared colours interpolate encoded RGB and alpha. Row/column insertion restricts
the existing geometry and stores the resulting new source nodes/handles, with
one encoded-colour rounding step; it does not store an insertion recipe. Node and colour edits preserve
row/column ownership. Native writers retain unpublished version 1. Clipboard writers choose envelope
version 9 whenever a grid occurs in objects, owned masks/tiles or stored
symbol/style resources, including unused masters. Development project envelopes
2–9 remain readable. Arbitrary legacy meshes
without `kind` retain their `points`, `colors`, `triangles` representation.

Mesh source plus possible derived storage participates in aggregate resource and
history budgets. PDF writes sampled type-4 triangles and does not preserve this
editing topology. SVG/SVGZ export embeds bounded PNG images and retains outer
placement, opacity and masks. Export review distinguishes retained native controls,
PDF triangle conversion and SVG rasterization, including auxiliary masks and
vector tiles. Mesh-bearing symbols expand for SVG. Neither interchange importer
reconstructs authored rows, columns or cubic handles. See the
[authoring contract](../features/gradient-meshes.md) for limits and controls.

## Linked text frames (unpublished version 1)

`object.text.frames` stores the self-contained ordered rectangular collection
defined in [the common text format](focale.md#linked-text-frames). The object owns
one source string and rich style ranges. Each frame has a story-local identity,
dimensions and affine placement. Copies may retain those local identities because
there are no cross-object frame references. Layout fragments and connections are
derived; oversized or unplaced text remains in the source.

The unpublished `.fvector` envelope stays at version 1. The separately versioned
editable clipboard uses version 10. Text-frame collections in ordinary artwork,
owned masks/tiles and symbol masters follow the same persistence and rendering
contract. SVG/PDF preparation rasterizes the composed frames and reports the
conversion; direct codecs refuse the unprepared story.

## Named text styles (unpublished version 1)

Optional `scene.textStyles` stores at most 256 unique definitions. Each record has
an `id` of 1–128 code units, a nonblank `name` up to 256 code units, `kind`
(`character` or `paragraph`) and one `style` object using the existing typed
formatting fields. A definition cannot contain another named-style reference.
Unused definitions remain stored; unknown kinds and malformed values are rejected.

`TextContent.characterStyleBinding` and `paragraphStyleBinding` link the base
styles. A character/paragraph range's style may instead contain `namedStyle`.
Each binding stores `{id, overrides: [...]}` with unique, recognized formatting
keys. Current local values remain in the ordinary style fields. The authoritative
library replaces non-overridden fields on publication; a previous resolved
reference used to detect local edits is derived state and is not serialized.
Packed and exact colour keys are overridden together. Structured values are
whole-property overrides, not nested patches. References must resolve to the
correct family before a scene becomes editable.

Native `.fvector` writers retain version 1. Editable clipboard envelope 11 carries
used `textStyles` and remaps conflicting identities with their users. Readers
continue accepting earlier clipboard envelopes. SVG/PDF preparation retains
resolved formatting and discloses the lost named library. Editable photo
placement retains the nested source. See the [style contract](../features/named-text-styles.md).

## Editable text path sources (unpublished version 1)

`.fvector` remains version 1. Optional `text.flow.source` contains `objectId`,
`contours` and `offset`. The identity is a nonempty string of at most 128 code
units. `contours` contains 1–256 unique zero-based source contour ordinals, each
at most 100,000; along-path flow selects exactly one. `offset` is an invertible
six-number affine matrix in the common `[a,b,c,d,tx,ty]` order, with finite
coefficients of magnitude at most 1,000,000,000. Derived publication bookkeeping
is never serialized. The embedded path remains the last complete local geometry.

Bindings target non-text paths or parametric shapes in the same owned artwork
namespace. Symbol masters, masks, pattern tiles and retained blend/repeat sources
resolve independently. Publication uses authored editable geometry, before live
geometry effects. Source geometry/placement changes refresh dependant text;
explicit text movement updates its relative offset. A removed, singular or
incompatible source detaches during editing, preserving text and the last snapshot.
Native decoders reject invalid declared bindings instead of repairing file damage.
Contour ordinals follow valid replacement contours at the same positions; missing
or no-longer-usable contours detach. This is not persistent topology tracking.

Complete copies remap both object identities. A standalone text copy detaches.
The separate editable clipboard uses version 12 when carrying bindings; versions
1–11 remain readable. Shared photographic placement retains a complete linked
selection as one embedded `.fvector` source. Ordinary text projection detaches.
Portable action recipes do not store document-owned source references.

SVG/PDF export review reports geometric text flow as an image, including its
actual raster dimensions. Native source and links remain unchanged. Eligible
explicit outline conversion produces ordinary font-free curves. See the
[ownership and shaping contract](../features/text-path-sources.md).

## Named printing inks (unpublished version 1)

A solid paint optionally stores `ink: {space, tints}`. `tints` contains one finite
number in `[0, 1]` per named component. The authoritative `space` retains a PDF
Separation or DeviceN resource independently of source references, alongside
the ordinary packed/process preview. It survives palette detachment and native
clipboard transfer. Native clipboard version 13 is selected when any owned
paint carries an ink, so older readers reject it instead of discarding plates;
readers accept previous clipboard versions. A named colour definition may also carry `ink: space` for
a single ordinary plate whose name equals the definition name. Changing its
name preserves the function; redefining its base alternate creates a linear
spot function. Palette binding supplies the paint's tint.

Resources use a typed JSON value tree: primitive null/boolean/number;
`["name", string]`, `["string", base64]`, `["array", items]`,
`["dictionary", object]`, and `["stream", dictionaryRecord, base64]`. Streams
retain filters and decode parameters; lengths are derived at PDF serialization.
References are resolved before capture and streams receive destination object
identities on export. Resource traversal is bounded to depth 32, 4,096 visits
and an 8 MiB byte budget; standalone stream decoding is bounded to 8 MiB.
Names contain at most 256 nonzero PDF bytes; UTF-8 names have a Latin-1 fallback
for legacy sources. At most eight components are admitted; marking plate names
are unique, while `/None` may repeat to carry alternate-function inputs. `/All`
registration and `/None` retain their PDF identities; they are not ordinary
authorable spot swatches. All-None paints have a transparent canvas preview.

The shared evaluator supports the already admitted exponential, stitching,
bounded calculator and linear sampled tint functions. DeviceN attributes,
alternate profiles and function streams survive round trips. Solid fills and
strokes, including owned vector artwork, are covered; gradient stops, meshes
and image sample planes do not gain ink ownership from this field. Their
existing alternate-colour import remains appearance-only.

`fillOverprint`, `strokeOverprint` and `overprintMode` remain the existing object
fields. Selection controls edit supported writable drawable owners atomically.
SVG has no equivalent print-plate representation and blocks retained ink paints;
the explicit raster export choice keeps only ordinary RGB appearance.
The `.focale` outer archive version is unchanged; nested editable vectors retain
their complete version-1 ink payload. See [printing inks](../features/vector-printing-inks.md).

## Retained Illustrator source

Optional `aiOrigin` retains original container `bytes`, the imported `baseline`
scene, an optional `limitation` identifying PDF-only import and optional absolute
`sourcePath` for resolving relative linked-file references. Bytes participate
in the shared binary-resource table and are limited to 20 MB on decoding. The
baseline preserves the distinction between authored edits and retained artwork
through save/reopen, recovery and history. This is development format version 1.

Optional `aiOrigin.retainedEffects` marks an AI with verified Focale-only effect
authoring. `nativeOrigin` retains at most one ordinary imported source before
development; recursive retained origins reject. `effectNotice` explains ignored
stale or unsupported authoring metadata. These fields also survive project
recovery. A complete UTF-8 version-1 `.fvector` envelope may be stored in the AI
catalog's `AiKitHost_FocaleEffects` compressed stream (32 MiB decoded maximum,
20 MiB shared binary-resource budget). The SHA-256 binding includes the payload
and all canonical native/PDF objects after removing that stream. External edits,
including nonvisual rewrites, invalidate restoration; Focale imports the current
artwork instead.

This mode preserves editable guide bending, interior effects, bevels, overlays
and broader blends in Focale. Developed geometry remains native contours.
Unsupported active layer styles or advanced blending use complete page images
at three pixels per document unit for **all pages**, retaining their background
interactions. Illustrator gets the supplied appearance rather than equivalent
effect controls. Existing qualified native mappings remain unchanged. PDF-only
imports and rasterization over preserved opaque owners reject. See
[ADR 0448](../adr/0448-retained-ai-effect-authoring.md).

Optional `aiOrigin.preservedObjects` maps locked mixed-document owner identities
to their projection limitations. An absent map means no separately preserved
owners were recorded; `limitation` continues to identify whole-document PDF
fallback. Preserved display subtrees use qualified native printing data and do
not claim editable native authoring. Native save revalidates source ownership,
unchanged proxies/ancestors and exact retained pair/style bytes independently of
the persisted diagnostic map. The initial mixed save contract retains topology
and pages while allowing supported neighbor content edits.

The native AI adapter admits one ordinary native program, layers and simple
process-painted paths. Explicit CC artboards map to multiple PDF pages while
their artwork remains one global drawing outside the page containers; the older
ordinary profile still requires one page. Save to the original AI supports layer rename,
visibility/full locking, path anchors/handles, qualified affine placement and
ordinary process appearances.
Layer placement is composed with child paths before saving native geometry and
matching PDF artwork. Paths without strokes support rotation, reflection, nonuniform
scale and shear. Paths with strokes support translation, rotation and reflection;
scaling/shearing their strokes remains unsupported. Invalid or numerically
collapsed placement rejects before writing. Save As creates a `.fvector` retaining
both source and edits; PDF/SVG remain separate export choices. Compatibility-only
AI can be returned unchanged, but edits require a Focale project or explicit PDF
export. They are never written as PDF bytes under an AI filename.

Direct dynamic rectangles, ellipses, polygons, stars and unadorned lines now
project into the existing `geometry` field. Rectangles retain independent absolute
circular corners; regular polygons/stars convert native circle radii into the
host's tangent setbacks. Parameter axes, centers and all contour controls must
agree before a native source is exposed as procedural geometry. Nonuniform sharp
rectangles can retain native irregular-polygon ownership as affine host rectangles.
No project schema extension is needed for these existing geometry values.

New-document authoring, retained parameter/paint edits and ordinary tree lifecycle
use the same procedural contours for native source and PDF. Effective fitted
corner values are exported after existing host limits. Source name-only edits use
literal native metadata updates, preserving XML identities and the existing PDF.
Source center-display flags remain native auxiliary data. The broader appearance
profiles and final validation remain pending; these additions are not an assertion
of complete Illustrator interoperability.

Native source and compatibility PDF remain synchronized through the original
PDF graph. See [ADR 0439](../adr/0439-source-preserving-native-ai-editing.md).

New AI authoring can build a native CC document without source bytes. Its current
projection supports empty canvases, explicit artboards, ordinary process-painted
paths, nested layers, opacity, literal dashes and fresh identities. Dimensions
convert from scene DPI to points, and the host PDF is composed from that same
snapshot. Board backgrounds become editable paths. Groups become nested native
layers in this initial profile; opacity on groups requires a broader appearance
contract. Board-owned artwork must stay inside its board and outside other boards,
while global artwork can span overlapping boards without native duplication.
Resource libraries, text and advanced appearances remain to be connected;
unsupported content rejects before persistence. This adds the encoder path for
an explicit `.ai` destination; Save As/export UI completion remains separate.

New CC output can be reopened natively, serialized through a Focale project,
edited within the admitted source-backed operations and saved repeatedly. Nine
new-document tests and the existing AI/PDF/source tests cover this initial path.
Focale's [Illustrator export verifier](../../tool/validation/verify_ai_documents/README.md) independently checks native records,
shared multipage owners, header caches and matching Poppler pixels for three
Focale outputs. Adobe Illustrator exchange acceptance remains outstanding.
The broader work is tracked by [ADR 0442](../adr/0444-complete-native-ai-integration.md).

Ordinary source paths also support fill/stroke addition/removal, exact RGB/gray/CMYK
components, width/caps/joins/miter/dashes, normal opacity, winding, overprint,
visibility and full locks. The kit retains attached native identities and metadata
and restores both outgoing interpretations so neighboring paths retain their
appearance. Focale composes the corresponding PDF from the same edited scene.
Independent fill/stroke alpha, non-normal blending and resource-based paints
still need their own native appearance projection; they reject before writing.
The synthetic ordinary-source fixture includes matched layer comments so these
higher-level inventory checks exercise a complete layer owner.

Source-backed ordinary documents also support creating, duplicating and deleting
paths/layers, moving owners between layers or to the global canvas, and ordering
mixed path/layer siblings. Surviving owners retain their native identities; new
owners receive repeatable fresh identities across retried saves and project
restoration. Host group creation maps to native layers in this profile. Removing
all artwork and adding new paths after reopening is supported. Unknown inserted
semantics reject before overwriting the destination. Other native object families remain separate work. The integration verifier now checks
five generated outputs, including complete PDF pixel equality after insertion and
duplication; real Illustrator exchange remains unverified.

Ordinary CC artboards also support creation/duplication, deletion, reordering,
Unicode renaming, resizing and axis-aligned placement changes. Native board UUIDs
and retained PDF page identities stay linked across repeated saves. Catalog-only
native sources explicitly declare their original page ownership. Removed pages
cannot leave reachable PDF references, and at least one artboard must remain.
Page backgrounds become native paths; artwork remains one shared drawing, while
page-owned children still require admitted clipping/overlap semantics. Native
crop declarations and ruler origins remain independent of page rectangle edits.
The independent integration verifier now checks ten outputs, including page
lifecycle and matching page pixels. More general native families remain pending.

Embedded images now support first-save native RGB8/alpha creation, reopening and
subsequent placement or pixel replacement. Imported process gray/RGB/CMYK samples
use a derived RGBA8 display source, while original native bytes remain in
`aiOrigin`. Unchanged sample depth, padding and cache identities survive image or
parent placement and neighboring path edits. New pixel resolutions adjust the
native pixel matrix to retain authored display size. Unicode native image names
decode using their explicit string type. This uses existing placed-source/project
fields and does not add a manifest version.

The projection bounds aggregate image pixels and rejects unresolved private state,
recipes, editable nested sources and unsupported interpolation. Ordinary image
attributes and mixed lifecycle are now implemented, pending combined validation.
Linked images retain a raster preview plus their external path. Optional
`source.previewOnly: true` means the bytes do not represent the complete external
file. It defaults to false for older projects, survives duplication/interpolation
changes, and requires linked storage. Such a preview must be refreshed/replaced
before pixel editing or incorporation. Its byte length does not infer the external
file's size; an absent `byteLength` remains unknown. Resource collection preserves
these links, reports `previewOnly` and marks the collection incomplete.

No external source is opened by AI decoding. Relative links resolve only with a
known absolute source path. Explicit AI saves to another directory rebase native
links without repainting the retained PDF. Unknown relative bases reject that
relocation. These additive development-version fields require no version bump.
Twelve earlier independent outputs cover initial embedded images; newly added
attribute/lifecycle/link regressions await the final validation campaign and are
not certified by those earlier counts. Adobe exchange remains unverified.
