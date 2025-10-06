# Design audit — front end maturity pass

## Purpose
- Capture the tactile brand primitives already coded so future screens stay consistent.
- Flag UX friction and responsive gaps observed in the current builder and landing page code.
- Provide quick suggestions to guide a visual token library and polish backlog.

## Visual token inventory
- **Paper surfaces:** `paper`, `builder-mat`, `tray-mat` use off-whites `#f7f5f2/#f6f3ef` with radial confetti accents; elevate via `shadow-[3px_3px_0_#000]` and 1px black borders.
- **Sticker chips:** `.chip`, `.sticker`, `.slot` share thick `border-black`, dual drop shadows (`2px` + `4px`) and rounded-full silhouettes; highlight overlay uses radial gradient + gloss pseudo-element.
- **Tape buttons:** `.tape-btn` brand the CTA; yellow base `#fef08a`, hand-torn tape arms created via `::before/::after` rectangles with `rotate(-8deg/6deg)`.
- **Accent palette:** warm yellow (`#fef08a/#fde68a`), blush pink (`#fff6fb/#ffeef7`), sky blue (`rgba(56,189,248,0.45)`), mint (`rgba(134,239,172,0.22)`), lilac (`rgba(253,186,248,0.24)`).
- **Typography motion:** `.wonky` applies `rotate(var(--r))`, but many components randomize `--r` on each render, creating layout jitter.
- **Micro-illustrations:** Decorative unicode (✶, ★) injected via pseudo-elements; good candidate to centralize as tokenized assets for reuse.

## Interaction patterns to preserve
- All primary elements (chips, slots, tape button, toast dismiss) follow press state of translating `1px` and reducing shadow; keep this consistent when new components land.
- Gloss overlays and inset highlights communicate tactile depth; ensure new cards leverage `::after` highlights to stay on-brand.
- Coachmarks, modals, and toast stack already codify overlay z-index; reuse these wrappers for upcoming upgrade panels instead of bespoke overlays.

## Product copy observations
- Tone is playful ("Tape to Checkout", "cute tactile builder"). Future microcopy should live in a shared dictionary (potential `src/copy.ts`) to support localization later.

## Friction + polish backlog
- **Randomized rotation jitter:** `Math.random()` inside render (e.g., `PackCard` titles, `DraggableChip`) fires on every re-render; causes hydration mismatches and text jank. Cache rotations per item.
- **Mobile tray density:** `grid-cols-2` with wide chips pushes tray height; consider compact chip variant (`text-xs`, tighter padding) for screens <360px.
- **Keyboard focus:** Chips and slots rely on mouse/touch; ensure focus rings appear with Tailwind `focus-visible` to support keyboard placement.
- **Builder viewport scaling:** Slot grid locked to 4 columns; on small phones slots shrink <56px (readability risk). Add responsive breakpoint to drop to 3 columns with vertical scroll safety margin.
- **Color token duplication:** Hex values repeated across CSS; extract to CSS variables (e.g., `--paper-base`, `--ink-shadow`) to simplify theme tweaks.
- **Pseudo-element decorations:** Hard-coded glyphs (✶/★) may be hidden by reduced-motion modes; offer prefers-reduced-motion fallback.

## Recommended next actions
- Create `src/styles/tokens.css` exporting color + shadow variables, then refactor `.paper`, `.chip`, `.tape-btn` to consume them.
- Add device targets for audit screenshots (iPhone SE, iPhone 15 Pro Max, Pixel 7, 1440px desktop) to evaluate slot sizing and tray scroll friction.
- Build a brand component storybook (even lightweight Vite story routes) to preview chips, slots, buttons with different copy states before expanding flows.
- Pair with analytics (step 2 below) to observe where users abandon (e.g., tray scroll vs. rotation controls) and feed into polish priorities.

