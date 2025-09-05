# The Zhunk Box — DIY Case Lab (PRD)

> **Version:** v0.1 (concept clarification)  
> **Owner:** Product (Cey)  
> **Supporting:** Design, Front‑end, Ops  
> **Reference Prototype:** “The Zhunk Box — Website Demo (interactive)” (single‑file React on canvas)

> Modularity: This PRD is also split into focused modules under `docs/`. See `docs/README.md` for a section index.

---

## 1) Problem & Outcome
**Problem:** Buying a decorated phone case is either too generic (pre‑made) or too technical (3D configurators that feel sterile). People want the joy of making something *themselves*—like a craft table—without friction.

**Outcome:** A web experience where anyone can quickly assemble a DIY case by placing "trinkets" (stickers/charms) onto a guided case template, hit the minimum build requirement, and check out. Feels playful, handmade, and shareable.

**Primary KPI(s):**
- Builder → Checkout unlock rate (placed ≥3 trinkets): **≥ 65%**
- Checkout → Purchase conversion: **≥ 25%** (first month target)
- Avg. trinkets per case: **5–9**
- Share/Save events per builder session: **≥ 20%**

## 2) Concept & Brand Vibe
**Creative Direction:** *DIY / zine / craft‑table*, not glossy sci‑fi.
- Hand‑cut letterforms with confetti dots (inspired by resin letters image).
- Case = clear plastic pane with **dashed placement guides** (punched‑hole feel).
- Trinkets = **sticker chips**: thick black outline, slightly wonky, drag‑gable.
- Optional **"Glitter"** overlay toggle (spinning sprinkles layer).  
- Micro‑copy feels scrappy and friendly ("Tape to Checkout").

**Out of Scope (v1):** Photoreal 3D rendering, phone‑model switching UI, user‑uploaded images, account system.

## 3) Users & Use Cases
- **Primary:** Teens/young adults customizing gifts; fans of kawaii/decoden aesthetics; DIY hobbyists.
- **Jobs‑to‑be‑done:** “I want a unique case I assembled myself, without craft‑store mess.”

**Top Use Cases:**
1. Quick build on mobile: pick 3–6 trinkets, checkout fast.
2. Playful explore on desktop: try randomize, glitter, rearrange, then buy.
3. Save/share a design to decide later (link or image export).

## 4) Information Architecture
- **Landing/Builder (single page)** → interactive case + trinket tray
- **Gated CTA** → enabled only after *min. 3 trinkets*
- **Checkout** → line items (case + trinkets), total, pay

## 5) User Flow (happy path)
1. **Load**: Title animates (hand‑cut letters). One‑line instruction banner.
2. **Design**: Drag‑and‑drop or click‑to‑place trinkets into dashed guides.
3. **Gate**: At **≥3 trinkets**, “Tape to Checkout” activates.
4. **Checkout**: See case price + trinket list, pay. (Payment provider TBD.)

## 6) Functional Requirements
### 6.1 Builder Canvas
- 20 circular slots per case template (grid; mobile‑first).
- Interactions: drag‑drop or click‑select then click‑place.
- Click occupied slot to clear.
- **Randomize** (fills ~40% slots at random). **Reset** (clear all). **Glitter** toggle.
- **Progress indicator**: `X / 3 minimum trinkets placed`.
- **Persist** current design to `localStorage`.

**Acceptance Criteria:**
- A1: Placing/removing works on mobile (touch) and desktop (mouse).
- A2: CTA disabled until `placedCount ≥ 3`.
- A3: Randomize never exceeds available catalog; Reset returns to empty.
- A4: Reloading keeps the last design (until cleared).

### 6.2 Trinket Catalog
- Each trinket: `{ id, name, emoji/icon, price }` (emoji placeholder in prototype).
- Catalog renders as sticker chips with price.
- Multiple instances allowed (no per‑item cap in v1).

**Acceptance Criteria:**
- B1: Selecting a chip highlights it; drag‑start sets data payload.
- B2: Dropping on a slot places trinket, replacing existing if present.
- B3: Catalog and prices configurable via JSON file.

### 6.3 Checkout (v1)
- Shows **Case base price** + **trinket line items** (name, qty, subtotal) and **total**.
- Buttons: **Edit Design**, **Pay Now** (demo → real later).
- Payment integration (v1.1): Stripe/Shopify Checkout redirect with payload:
  ```json
  {
    "caseModel": "iphone-15-pro",
    "slots": { "s0": "bear", "s1": null, ... },
    "items": [{"id":"bear","qty":3}],
    "total": 28.50
  }
  ```

**Acceptance Criteria:**
- C1: Line items match placed trinkets.
- C2: Total = case price + Σ(trinket subtotal).
- C3: Returning from checkout preserves the design.

## 7) Visual & Content Guidelines
- Palette: off‑white paper, black outlines, confetti accents (pink/sky/yellow).
- Components look **cut‑out** (shadow: `3px 3px 0 #000`).
- Copy tone: playful DIY—short verbs, craft metaphors ("sticker sheet," "pop it off").
- Accessibility: high contrast; focus states visible; labels for assistive tech.

## 8) Performance & Quality
- **Performance budget:** initial payload < 250KB gz (excluding fonts).
- 60fps on modern mobile for drag/drop.
- No layout shift on title animation; use transforms not reflow.
- Automated tests (vitals): slot logic, min‑gate, totals.

## 9) Analytics & Experiments
- Events: `trinket_add`, `trinket_remove`, `randomize`, `glitter_toggle`, `checkout_unlocked`, `checkout_start`, `purchase_success`.
- A/B ideas: gate at 3 vs 4 trinkets; glitter default on vs off; randomize hint nudge.

## 10) Compliance & Ops
- **Safety note** in checkout: small parts choking hazard (if physical trinkets ship separately or embedded).
- **Return policy** link in checkout. Tax/shipping handled by payment provider.
- **GDPR/CCPA**: only local storage for v1; no PII until checkout.

## 11) Tech Approach
- **Front‑end:** React + Tailwind + Framer Motion (prototype already working).
- **State:** local component state; persisted via `localStorage`.
- **Data:** static `catalog.json` (v1), fetch on load.
- **Payments (v1.1):** Stripe/Shopify redirect; payload encodes slot map.
- **Share (v1.1):** compress slot map to URL param (e.g., base64) for shareable links.

## 12) Milestones
- **M0 (now):** Interactive prototype (done on canvas).
- **M1 (1–2 wks):** Catalog JSON + real icons, responsive polish, analytics events.
- **M2 (1–2 wks):** Stripe/Shopify handoff, linkable designs, basic legal copy.
- **M3 (optional):** Photo export, inventory caps, phone‑model selector.

## 13) Open Questions
1. Payment stack: Stripe Checkout vs Shopify? Who fulfills orders?
2. Case models: iPhone 15 Pro only at launch or multiple SKUs?
3. Inventory rules: unlimited per trinket or enforce stock per order?
4. Shipping logic: flat vs weight‑based? Regions supported at launch?
5. Do we need user uploads / custom text trinkets in v1.2?

## 14) Acceptance for v1 Launch
- Builder works on iOS Safari + Android Chrome + desktop.
- Checkout unlocks at 3 trinkets; totals accurate.
- Visual style matches DIY brief (hand‑cut letters, dashed guides, sticker chips).
- Analytics events firing; performance budget met.

---

### Appendix A — Data Shapes
```ts
// catalog.json
{
  "casePrice": 18,
  "trinkets": [
    { "id": "bear", "name": "Bear", "price": 5.0, "icon": "/icons/bear.png" },
    { "id": "cookie", "name": "Cookie", "price": 2.5, "icon": "/icons/cookie.png" }
  ]
}

// encoded design payload
{
  "model": "iphone-15-pro",
  "slots": { "s0": "bear", "s1": null, "s2": "cookie" }
}
```

### Appendix B — Copy Snippets
- Banner: **“Grab from the sticker sheet. Pop onto the case. Tape to checkout.”**
- CTA (locked): **“Add 3 pieces to continue.”**
- Glitter toggle: **“Glitter: Off/On.”**
