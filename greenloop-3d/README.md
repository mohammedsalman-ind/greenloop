# GreenLoop — 13-chapter scroll experience

A Tailwind CSS website recreated from the supplied GreenLoop reference collage, with scroll-controlled Three.js assets, cinematic photographic backgrounds and responsive layouts.

## Open or run

The built site is in `dist/`. Open `dist/index.html` directly, keeping its assets beside it. JavaScript, fonts, photography and the 3D renderer are bundled locally; viewing the build needs no installation or API key.

To edit, use Node.js 20 or later:

```bash
npm ci
npm run build
npm run check
npm run preview
```

Open http://localhost:4173. The preview command serves the existing build; rebuild after editing.

## Chapters

| Chapter | Reference scene | Motion and interaction |
| --- | --- | --- |
| 01 | Hero | Slow camera push, journey entry, two-minute guided tour |
| 02 | Valuable assets | Drawn connectors and four material records |
| 03 | Recovery | Real beveled 3D I-beam, lifting chains and recovery stages |
| 04 | Identification | Asset identity, photo previews and passport navigation |
| 05 | Inspection & verification | Perspective scan grid and staged checklist |
| 06 | Material passport | 3D model, QR record, documents, photos and history |
| 07 | Marketplace | Search, category tabs, five filters and material records |
| 08 | Matching engine | Shared 3D asset, drawn match score and suitability factors |
| 09 | Procurement decision | Animated price comparison and working cost calculator |
| 10 | Order & booking | Five-stage order illustration, 3D material and terms |
| 11 | Logistics & delivery | Route marker, delivery milestones and truck background |
| 12 | Verification & impact | Receipt record, recovered quantity and calculated savings |
| 13 | GreenLoop network | India outline, drawn connections and interactive cities |

The supplied collage contains chapters 1–11 and 13. Chapter 12, **Verification & impact**, follows the user's selected completion for the missing panel. It uses the same visual language.

Scroll position controls the entire presentation. Scrolling up reverses the motion. Native wheel, touch and scrollbar input work alongside the chapter menu, arrow keys, Page Up/Down and Home/End. The guided tour starts only when selected, and manual scrolling stops it. The 3D viewer supports pointer dragging and arrow keys.

The reference is a small desktop collage. Desktop placement follows it; mobile and tablet layouts adapt its hierarchy. `prefers-reduced-motion` switches to completed still scenes. Unsupported or unavailable WebGL falls back to the included material photograph.

## Source files

| File | Purpose |
| --- | --- |
| `src/index.html` | All 13 chapter layouts, navigation, dialogs and SVG icons |
| `src/input.css` | Tailwind theme, glass panels, composition and responsive rules |
| `src/app.js` | Scroll control, modal interactions, filtering, tour and calculations |
| `src/journey-data.js` | Sample inventory, filter logic and scroll-state calculations |
| `src/scene-engine.js` | Three.js I-beam geometry, procedural steel texture, rig and cameras |
| `src/network-map.svg` | Geographic India outline, city markers and connections |
| `dist/assets/` | Local images, Inter font, QR and asset licenses |
| `scripts/build.mjs` | Tailwind compilation, esbuild bundling and inline map assembly |
| `scripts/check.mjs` | Navigation, data, asset, scroll-state and geometry verification |

A single WebGL canvas moves between the active chapter and the material viewer. Rendering follows scroll or pointer changes; there is no permanent background animation loop. The steel uses beveled geometry, a deterministic worn-metal texture, environmental reflections, warm lighting and shadows. The surrounding architecture remains photographic, with layered movement for depth.

## Connect your existing app

By default, **Enter platform** opens the local marketplace chapter. To point it at your real application, add this before the `app.js` script in `src/index.html`, then rebuild:

```html
<script>
  window.GREENLOOP_CONFIG = { platformUrl: '/app' };
</script>
```

The experience is a standalone presentation and UI demonstration. It does not replace or integrate the separate GreenLoop backend. No live inventory, payment, reservation or authentication service is connected. Sample record downloads are labeled as sample data.

To use this within a React/Vite application, mount it as a dedicated presentation route, retain the current app routes and backend, and port the scene markup and controller lifecycle into your component. The built files can also be served independently from a landing route.

## Adjusting the experience

- Change `--chapter-height` in `src/input.css` for scroll length: 150svh desktop, 175svh mobile.
- Motion thresholds and camera offset values are in `src/app.js` and `src/scene-engine.js`.
- Replace background WebP files when original full-resolution photographs are available.
- Edit sample material records in `src/journey-data.js`.
- Model proportions are an illustration, not a fabrication or engineering specification.

## Fidelity and verification

The reference layout, chapter order, color palette, headings and glass-panel style guide this reconstruction. It is not the original website source. Photography was recreated from the reference with ImageGen; Inter is the closest selected typeface. Exact original image pixels, font identity and animation timing cannot be recovered from a small static collage.

Reference network numbers, material specifications and verification badges are illustrative presentation content. No real engineering certificates were provided. The additional impact chapter uses the reference prices to calculate `(65000 − 38000) × 2.4 = ₹64,800` in material savings.

The production build, JavaScript syntax, chapter navigation targets, local assets, filtering, cost calculations, scroll-state continuity, reduced-motion states and beam geometry are checked. A DOM simulation checks interaction wiring and the WebGL fallback. Automated visual rendering in an actual browser was unavailable in this environment; desktop/mobile appearance and GPU motion still require a browser review.

Image and font provenance is in `ASSETS.md`.
