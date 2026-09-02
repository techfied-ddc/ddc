# Brand Guidelines — Desire Premium Dry Cleaning

> Authoritative brand reference. Locked values come from `docs/20-design-system.md`.
> Syncs to `packages/ui` tokens. Update here first; run design-token sync before
> shipping any visual change.

---

## 1. Brand story & positioning

**Desire Premium Dry Cleaning** is not a laundry service — it is a care ritual.
The brand exists at the intersection of luxury and precision: the dark,
considered aesthetic of a high-end atelier, delivered with the operational
clarity of a great logistics company.

**Single positioning line**
> *Your finest pieces, returned immaculate.*

**Brand promise**: We take something irreplaceable and give it back better.
On time, verifiably, with no guesswork about cost or status.

**Tone in one word**: Assured. Not warm, not clinical — assured. Desire knows
what it is and does not over-explain.

---

## 2. Brand voice

### Core voice properties

| Property | What it means | Do | Don't |
|---|---|---|---|
| **Assured** | Speaks from knowledge, not bravado | "Your pickup is confirmed for 9–12 today." | "We'll try to be there!" |
| **Precise** | Exact language, never vague | "Your invoice total is ₹2,400." | "Your bill is around ₹2,400." |
| **Warm without being casual** | Professional register, human moments | "Your order is on its way." | "Hey, your stuff's coming!" |
| **Active** | Subject does the thing | "We picked up your order." | "Your order has been picked up." |

### Register by surface

| Surface | Register | Example |
|---|---|---|
| Marketing site | Aspirational, minimal | "Cleaned to a standard worthy of the garment." |
| Customer app | Clear, helpful | "Tap to see your pickup OTP. Show it to the rider." |
| Store platform | Operational, direct | "3 new orders. Accept or assign a pickup rider." |
| Admin panel | Neutral, factual | "Commission: 20% · Net to store: ₹4,320" |

### Voice don'ts

- Never apologise in a UI label ("Sorry, something went wrong"). State what happened and how to fix it.
- No filler words ("just", "simply", "quickly", "easily").
- Never use passive voice in actions or status descriptions.
- Never mix registers in the same surface.
- No exclamation marks on operational messages (a completed order is not "Order Complete!").

---

## 3. Visual identity

### 3.1 Colour palette (locked)

See `docs/20-design-system.md §20.1` for the full token table.
The values below are the locked, client-approved palette.

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0B0B0C` | App background — near-black, slightly warm |
| `--bg-raised` | `#141416` | Cards, sheets behind glass |
| `--gold` | `#D4AF37` | Primary accent — **FINAL, do not substitute** |
| `--gold-bright` | `#F0D67E` | Hover/highlight state |
| `--gold-deep` | `#9A7B1F` | Pressed/gradient end |
| `--text` | `#F4F1E9` | Primary text — warm white, not pure white |
| `--text-muted` | `#A7A296` | Secondary text |
| `--success` | `#4FB477` | Paid, delivered, completed |
| `--warning` | `#E0A83E` | Pending, awaiting action |
| `--danger` | `#E5675C` | Failed, cancelled, destructive |
| `--info` | `#6FA8DC` | Informational, in-progress |

**Dark-only**: There is no light theme. The brand identity *is* the dark
palette. Do not add light-mode variants; do not use `prefers-color-scheme`
to flip to a light design. Every surface is dark.

### 3.2 Colour usage rules

- `--gold` is for: primary CTA buttons, active navigation items, key headings,
  icon accents, selected states, the gradient border on featured cards.
- `--gold` is **not** for: body text, long-form labels, disabled states, or
  surfaces where it competes with the background gradient.
- Text on a gold fill always uses `--on-gold` (`#0B0B0C`). Never use `--text`
  on a gold button — the contrast is insufficient.
- Semantic colours (`--success`, `--warning`, `--danger`, `--info`) are for
  state indicators only. They are not accent colours and do not substitute for gold.
- Never add a new colour. Use `--gold-veil` for gold-tinted washes;
  use `--surface-glass` for backgrounds.

### 3.3 Typography (locked)

Three families, each with a distinct role. See `docs/20-design-system.md §20.2`.

| Family | Role | Usage |
|---|---|---|
| **Fraunces** (variable, optical sizing) | Display / headings | h1–h3, hero, section titles, marketing. Never for UI labels or body copy. |
| **Inter** (variable) | Body / UI | All product UI: forms, tables, buttons, store/admin consoles. The default face everywhere except headings. |
| **JetBrains Mono** (variable) | References / data | Order refs (`DPD-000123`), OTPs, invoice numbers, code, any string that must be scannable. |

**Self-host only** — import via `@fontsource-variable/*` in `packages/ui/src/fonts.ts`.
No Google Fonts CDN in production (privacy policy).

**Type rules**:
- Headings: `text-wrap: balance`; negative tracking (`-0.02em` for display).
- Body: ~65 chars wide max; `line-height: 1.6`.
- Money/analytics: `font-variant-numeric: tabular-nums` (Inter feature).
- Uppercase labels: `letter-spacing: 0.08–0.12em` always (legibility).
- OTP display: JetBrains Mono, large, `--bg-sunken` background, `--gold` text.

### 3.4 Logo & wordmark

**Current state**: Client logo not yet supplied. Use the typographic wordmark:
- **"Desire"** set in Fraunces 500 italic, `--gold`, tracking `+0.02em`.
- For monogram: **"D"** in Fraunces 600, gold on `--bg`, within a circle border in `--border-gold`.
- PWA icons: gold monogram on `#0B0B0C` field, maskable.

**When the client supplies SVG**:
- Light-on-dark version: white/gold on transparent.
- Monogram: gold on transparent.
- Minimum size: 24px height in UI; 44px in navigation.
- Clear space: 1× the cap height on all sides.
- Never place the logo on a coloured background other than `--bg` or `--bg-raised`.
- Never recolour the logo.

### 3.5 Glass surfaces

The signature visual treatment. Every surface is a tier; do not mix tiers.

| Tier | Token | Use |
|---|---|---|
| `glass` | `rgba(255,255,255,0.055)` | Cards, nav bars, bottom tabs, sheets |
| `glass-strong` | `rgba(255,255,255,0.10)` | Modals, popovers, toasts |
| `glass-inline` | (blur 12px, radius 12px) | Chips, inputs |
| **No glass** | solid `--bg-raised` | Long lists (order queues, tables) — performance rule |

Max 4 simultaneous `backdrop-filter` nodes on screen. Never apply glass to
list rows — renders at 60fps in lab, drops to 15fps on a mid-range phone.

### 3.6 Motion

All motion from `packages/ui/motion`. Reduced-motion guard is mandatory in
every component — use the shared `<Reveal>` wrapper, never roll custom motion
without honouring `prefers-reduced-motion`.

**Lenis smooth scroll**: marketing website only. Customer and store apps use
native scroll for PWA feel.

**Never animate**: layout properties (`width`, `height`, `top`, `left`).
Only `transform`, `opacity`, `filter`.

---

## 4. Messaging framework

### 4.1 Key messages (by audience)

**Customers**
1. Your garments are safe with us — tracked every step.
2. Know the price before you pay. No surprises.
3. Pickup at your door. Delivery when it's ready.

**Stores / partners**
1. One screen. Every order, every rider, every day.
2. Earnings split automatically — no manual reconciliation.
3. Join Desire's network; grow your business.

**Investors / press**
1. India's first branded multi-store dry-cleaning platform.
2. Verified handovers. Commission-tracked settlements. Real-time operations.

### 4.2 Order ref format

Always displayed as `DPD-000123` — JetBrains Mono, never truncated.
The `DPD-` prefix is part of the brand mark and must always appear.

### 4.3 Error message pattern

Pattern: **[What happened] · [What to do]**

- OTP expired: "This code has expired. Request a new one."
- Slot full: "That pickup window is full. Choose another time."
- Payment failed: "Payment didn't go through. Try a different method or pay cash on delivery."
- Routing fail: "We're finding the right store for your address. We'll notify you shortly."

Never: "An error occurred. Please try again." — too vague.
Never: "Oops!" — too casual.
Never: error codes without human text.

---

## 5. Asset organisation

```
assets/
├── logo.png          # Source PNG from client (when supplied)
├── logo.svg          # SVG version (preferred)
├── logo-mark.svg     # Monogram only
└── brand/
    ├── palette.ase   # Swatch file for design tools
    ├── fonts/        # Licence files for self-hosted fonts
    └── photography/  # Dark garment photography (moody, client-supplied)
```

**Cloudinary folder structure** (production):
```
ddc/
├── stores/{storeId}/logo
├── stores/{storeId}/garments/{orderId}/
├── riders/{riderId}/selfie
└── invoices/{orderId}/
```

Upload rules: max 10MB per image; accepted formats JPEG/PNG/WebP; unsigned
uploads disabled on the Cloudinary account.

---

## 6. Consistency checklist

Before any screen ships, verify:

- [ ] All colours from the token set — no literal hex values in component code
- [ ] No light-mode code anywhere
- [ ] Fraunces used only for headings/display; Inter for all UI copy
- [ ] OTPs and order refs use JetBrains Mono
- [ ] Money formatted with `formatMoney()` from `packages/shared` — never formatted inline
- [ ] `prefers-reduced-motion` honoured via the shared motion wrapper
- [ ] No glass applied to list rows or tables
- [ ] Max 4 simultaneous `backdrop-filter` nodes on any screen state
- [ ] Gold text never on a glass surface over a busy background (add `--bg-raised` backing)
- [ ] Touch targets ≥ 44px on all interactive elements
- [ ] Focus ring visible (`0 0 0 2px var(--bg), 0 0 0 4px var(--gold)`)
- [ ] Error messages follow the pattern: what happened · what to do
- [ ] Uppercase labels have `letter-spacing ≥ 0.08em`
- [ ] Logo not recoloured or placed on a non-brand background

---

*Last updated: 2026-08-31. Maintained alongside `docs/20-design-system.md`.
Any conflict: the spec in `docs/20` is authoritative for token values;
this document is authoritative for voice, messaging, and usage rules.*
