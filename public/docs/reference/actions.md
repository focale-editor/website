# Actions and batch processing

Focale records reusable editing intent rather than serializing undo objects or
pointer events. The Actions panel stores named sets, actions, and ordered steps;
the batch workflow applies one action either to a folder without opening
visible document tabs or to a stable snapshot of the documents already open.

This follows the hierarchy and primary controls documented for
[Photopea Actions](https://www.photopea.com/learn/actions) and the
[Photoshop Actions panel](https://helpx.adobe.com/photoshop/desktop/automate-tasks/automation-settings-and-presets/use-the-actions-panel.html).
ADR 0102 records the execution and ownership boundaries.

## Recording and playback

Open **Window ▸ Actions** to show the global catalogue. A new action records
immediately after its name, destination set, optional F1–F12 shortcut,
modifiers, and colour are confirmed. The panel then provides Record, Stop,
Play, new set, new action, delete, rename, import, export, and batch controls.
A supported step can be enabled or disabled independently.

Only a successful feature operation reaches the recorder. Document mutations
publish after entering history; transient pixel- or layer-selection commands
publish separately after their editor state has changed. Each recorded value
contains a stable operation identifier and deeply immutable, JSON-compatible
parameters; it never retains an undo snapshot, raster bytes, or a
document-local layer identifier. Repeated samples from one continuous control,
such as layer opacity, coalesce until the interaction ends.

Playback uses the same feature services and serialized document-mutation queue
as direct editing. It therefore retains normal validation, GPU acceleration,
undo, and resource ownership. Layer commands resolve the active layer when the
step runs. Adding or duplicating a layer updates that active target normally,
so a following contextual step applies to the new layer.

Playback is intentionally not one atomic history entry. A failed step leaves
the successful prefix in the interactive document, where each step can be
undone normally. During a folder batch, a failed action produces no output for
that input and the invisible working document is discarded.

Automatic Tone, Contrast, and Colour are recorded as data-dependent commands:
they recompute statistics for every playback target. Ordinary adjustments and
filters retain their exact settings. Match Colour stores the sampled source
statistics so the action remains portable without requiring another open
document.

## Supported semantic operations

The current command vocabulary can replay these operations:

| Identifier | Captured intent |
|---|---|
| `document.resizeCanvas` | Width, height, and canvas anchor. |
| `document.resizeImage` | Resampled width and height. |
| `document.transform` | Document rotation or reflection. |
| `document.revealAll` | Expansion to reveal off-canvas content. |
| `document.trim` | Transparent-pixel or corner-colour trim basis. |
| `adjustment.apply` | Adjustment kind, complete scalar/curve/gradient settings, and optional Match Colour statistics. |
| `adjustment.applyAuto` | Automatic Tone, Contrast, or Colour recomputed from the current target. |
| `filter.apply` | Filter kind and sanitized settings, including smart-filter insertion when the target supports it. |
| `filter.gallery` | Complete cumulative Filter Gallery recipe. |
| `filter.shapeBlur` | Shape Blur radius and embedded custom-shape kernel. |
| `filter.cameraRaw` | Complete Camera Raw Filter recipe. |
| `edit.fade` | Opacity and blend mode applied to the preceding compatible raster operation. |
| `selection.selectAll` | Select the complete canvas. |
| `selection.deselect` | Clear the current pixel selection. |
| `selection.reselect` | Restore the most recently discarded pixel selection. |
| `selection.invert` | Invert the current pixel selection inside the canvas. |
| `selection.modify` | Border, Smooth, Expand, Contract, or Feather with a pixel radius. |
| `selection.grow` | Grow from the current selection using captured tolerance and sampling scope. |
| `selection.similar` | Select similar colours using captured tolerance and sampling scope. |
| `selection.geometry` | A rectangular, elliptical, single-pixel-axis, freehand, polygonal, or magnetic selection in document-relative coordinates, with combination and edge settings. |
| `selection.magicWand` | A document-relative seed plus the complete Magic Wand sampling recipe. |
| `selection.quickSelection` | Ordered positive and negative guide marks, brush geometry, sampling scope, and combination mode; segmentation is recomputed on the target. |
| `selection.brush` | Document-relative selection-brush dabs and their add/subtract coverage settings. |
| `paint.stroke` | A deterministic procedural paint or retouch stroke, its tablet axes, colours, effect settings, Mixer Brush wells, and supported same-document sampled-source mapping. |
| `layer.addRaster` | New raster layer with a contextual unique name. |
| `layer.addGroup` | New layer group with a contextual unique name. |
| `layer.duplicate` | Duplicate the active layer or group. |
| `layer.smartObject.duplicate` | Duplicate the active smart object with an independent source. |
| `layer.delete` | Delete the active layer or group. |
| `layer.rename` | Rename the active layer. |
| `layer.setVisibility` | Change active-layer visibility. |
| `layer.setLock` | Change active-layer transparency, pixel, and position locks. |
| `layer.setOpacity` | Change active-layer opacity. |
| `layer.setBlendMode` | Change active-layer blend mode. |
| `layer.selectAll` | Select every reachable content layer. |
| `layer.deselectAll` | Clear primary and additional layer targets. |
| `layer.selectSimilar` | Select layers in the active layer's category. |
| `layer.selectLinked` | Select every member of the active layer's link group. |
| `layer.mergeDown` | Merge the active layer into its lower sibling. |
| `layer.mergeVisible` | Merge visible contributions while retaining hidden layers. |
| `layer.applyMask` | Bake the active raster layer's mask into its alpha channel. |
| `layer.flatten` | Flatten top-level layers into one rendered layer. |

Other committed history commands remain visible as unsupported steps and block
playback until removed. This is deliberate: silently skipping a crop, paint
stroke, or structural edit could export a plausible but incorrect batch.
Tool changes, direct row clicks, dialog navigation, and other incidental
interface state are not recorded. Explicit Select menu commands can establish
pixel and multi-layer context without adding undo entries. Playback reports a
failure when a transient command's prerequisite is absent, for example when
Inverse has no pixel selection or Select Linked Layers has no link group.
Finalized marquee, lasso and Magic Wand gestures are recorded only after their
selection commits. Marquee bounds, one-pixel axes and lasso vertices are
document-relative, so folder batches replay them proportionally on each input.
Lassos retain at most 4,096 vertices; Magic Wand steps recompute from each
target's pixels using the captured tolerance, contiguity, sample size, sampling
scope and antialiasing. Live previews and raw pointer events are not steps.
Quick Selection keeps its complete accumulated guide, while paint recipes
retain at most 8,192 canonical engine samples. Brush, Pencil, Eraser, Spot
Healing, Healing Brush, Colour Replacement, Mixer Brush, Clone Stamp, Pattern
Stamp, Background Eraser, Blur, Sharpen, Smudge, Dodge, Burn, and Sponge use
this path. A history-source brush and a clone or healing source in another
document remain unsupported because their source pixels are neither a portable
setting nor part of the target document. A same-document source on another
layer is likewise recorded only when the sampling mode reads the complete
composite; current-layer and current-and-below modes depend on a layer identity
that cannot be transferred safely to another document.

## Native `.faction` format

`.faction` is a portable UTF-8 JSON file containing exactly one action set.
Public version 1 has this shape (resource arrays are empty when no paint step needs
them):

```json
{
  "format": "focale-action-set",
  "version": 1,
  "set": {
    "id": "set.example",
    "name": "Web preparation",
    "actions": [
      {
        "id": "action.example",
        "name": "Resize and sharpen",
        "functionKey": 4,
        "shiftModifier": true,
        "commandModifier": false,
        "color": "blue",
        "steps": [
          {
            "id": "step.resize",
            "enabled": true,
            "operation": "document.resizeImage",
            "parameters": {
              "width": 1600,
              "height": 900
            }
          }
        ]
      }
    ]
  },
  "sampledTips": [],
  "patterns": []
}
```

Identifiers are stable inside the file but receive fresh identities when a set
is imported, so importing the same library twice cannot collide with the local
catalogue. Unknown operation identifiers and their parameters are preserved for
forward compatibility, displayed as unsupported, and never executed by an
older build. Development version 2 requires the one-time
[baseline conversion](persistence-baseline.md).

Version 1 makes paint actions self-contained. Every active referenced imported
primary or dual brush tip and every active imported brush/effect pattern is
embedded once, under its content-derived identifier. Disabled resources do not
bloat the bundle or make export depend on a preset value that cannot affect the
stroke. Import validates the identifier and raster geometry against the
decoded bytes before creating GPU resources, then installs the assets in the
normal brush-tip and pattern stores. Export fails visibly if an active
referenced resource has disappeared; it never substitutes a default that would
change the action's result.

The decoder rejects duplicate identities, invalid function keys, non-finite or
non-JSON parameters, more than 2,048 actions or 32,768 steps, strings longer
than 1,024 characters, collections longer than 65,536 entries, and parameter
nesting deeper than 16 levels. A complete bundle is limited to 256 MiB before
decoding, with separate 64 MiB sampled-tip and 128 MiB pattern pixel budgets
and at most 4,096 entries per resource catalogue. Large JSON and Base64 work is
performed away from the interface isolate; GPU image creation remains on the
isolate required by Flutter.

The application-support catalogue uses a separate internal
`actions/library.json` envelope because it can hold several sets. It is loaded
before the first frame, validated with the same model limits, serialized in
invocation order, limited to 8 MiB because it carries no embedded resources,
and replaced atomically. A corrupt file is logged and left untouched for
recovery while the running application starts with an empty catalogue.

Adobe ATN version 16 import and export use the separate pure-Dart `AtnKit`
package, which shares Action Descriptor primitives with `PsCore`. Exact native
mappings currently cover Trim, Reveal All, Inverse, Duplicate/Delete Layer,
Merge Down, Merge Visible, Flatten Image, and layer-selection commands. These
events enter the same semantic model and playback engine as `.faction` files.

Unknown Adobe events remain visible as disabled steps and retain their encoded
event for a lossless re-export. Focale commands without an exact Photoshop
event are likewise stored as disabled extension events: another Focale build
can restore them, while Photoshop is never told that it can execute semantics
it does not understand. Import therefore favours explicit partial compatibility
over silent approximation. Photoshop's recording workflow is documented in
[Record an action](https://helpx.adobe.com/photoshop/desktop/automate-tasks/create-record-actions/record-an-action.html).

## Advanced batches

Open **File ▸ Automate ▸ Batch…** from either the home screen or an editor. The
dialog chooses a source, destination, action, output format, lossy quality,
error policy, and existing-file policy. A source is either a folder or the
documents open when the run starts. A destination is an export folder, no
export (leaving edited documents open), or Save and Close. Save and Close is
only available to the open-document flow and refuses any document that would
need a file picker; it therefore cannot suspend an unattended run.

Sources are discovered from Focale projects and every raster, PSD/PSB, or
camera-RAW extension accepted by the normal import pipeline, then processed in
stable path order. With subfolders enabled, their relative layout is preserved
under the destination. Focale imports one invisible document, replays the
action, exports atomically, and releases all document and history assets before
starting the next file. Peak working memory is therefore bounded by one input,
its action history, and its export buffers rather than the complete folder.
Transient batch sessions do not create autosave or recovery records.

Folder exports accept `{name}`, `{extension}`, `{index}`, and `{index:N}` name
tokens, with a configurable first sequence number. Unknown tokens, path
separators, and reserved file-name characters invalidate the settings before
processing begins. Open documents use their visible file name and ordinary
editor sessions: action steps remain individually undoable, dirty state is
updated normally, and a failed action leaves its successful prefix visible.

An optional versioned JSON report records the source, intended destination,
terminal status, and diagnostic for each item plus aggregate counts. It is
written through a sibling staging file only after terminal results are known,
so cancellation or an application error cannot expose a partial report.

Cancellation is cooperative between files and action steps, and is checked
again before export. Encoding already in progress is allowed to finish so an
engine resource cannot be abandoned mid-operation. The result lists every
processed failure, skip, or cancellation with its diagnostic and explicitly
reports an early stop, while **Continue after errors** controls whether later
sources remain eligible.

Colour-profile prompts and action-level Open/Save override switches remain
future refinements. Adobe documents those choices in
[Batch-process files](https://helpx.adobe.com/photoshop/desktop/automate-tasks/process-a-batch-of-files/batch-process-files.html).
