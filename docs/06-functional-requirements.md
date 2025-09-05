# 6) Functional Requirements

## 6.1 Builder Canvas
- 20 circular slots per case template (grid; mobile‑first).
- Interactions: drag‑drop or click‑select then click‑place.
- Click occupied slot to clear.
- Randomize (fills ~40% slots at random). Reset (clear all). Glitter toggle.
- Progress indicator: `X / 3 minimum trinkets placed`.
- Persist current design to `localStorage`.

Acceptance Criteria:
- A1: Placing/removing works on mobile (touch) and desktop (mouse).
- A2: CTA disabled until `placedCount ≥ 3`.
- A3: Randomize never exceeds available catalog; Reset returns to empty.
- A4: Reloading keeps the last design (until cleared).

## 6.2 Trinket Catalog
- Each trinket: `{ id, name, emoji/icon, price }` (emoji placeholder in prototype).
- Catalog renders as sticker chips with price.
- Multiple instances allowed (no per‑item cap in v1).

Acceptance Criteria:
- B1: Selecting a chip highlights it; drag‑start sets data payload.
- B2: Dropping on a slot places trinket, replacing existing if present.
- B3: Catalog and prices configurable via JSON file.

## 6.3 Checkout (v1)
- Shows Case base price + trinket line items (name, qty, subtotal) and total.
- Buttons: Edit Design, Pay Now (demo → real later).
- Payment integration (v1.1): Stripe/Shopify Checkout redirect with payload:

```json
{
  "caseModel": "iphone-15-pro",
  "slots": { "s0": "bear", "s1": null },
  "items": [{"id":"bear","qty":3}],
  "total": 28.50
}
```

Acceptance Criteria:
- C1: Line items match placed trinkets.
- C2: Total = case price + Σ(trinket subtotal).
- C3: Returning from checkout preserves the design.

