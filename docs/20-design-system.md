# 20 — Design System (Black & Gold · Liquid Glass · Motion)

The visual language for **Desire Premium Dry Cleaning**. Implemented once in
`packages/ui` (Tailwind preset + CSS variables + shared components + motion primitives) and
consumed by all four frontends. **Dark-only by design** — there is no light theme; the brand
*is* black and gold.

> Priority order when a rule conflicts: **legibility & accessibility > brand aesthetic >
> visual flourish**. Glass and motion never win over readability or performance.

## 20.1 Brand palette

Near-black grounds, warm off-white text, metallic gold accent.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0B0B0C` | App background (true near-black) |
| `--bg-raised` | `#141416` | Cards / sheets behind glass |
| `--bg-sunken` | `#060607` | Recessed areas, code/OTP blocks |
| `--surface-glass` | `rgba(255,255,255,0.055)` | Default frosted glass fill |
| `--surface-glass-strong` | `rgba(255,255,255,0.10)` | Elevated glass (modals, popovers) |
| `--border-hairline` | `rgba(255,255,255,0.10)` | 1px glass edge |
| `--border-gold` | `rgba(212,175,55,0.45)` | Active/selected edge |
| `--text` | `#F4F1E9` | Primary text (warm white) |
| `--text-muted` | `#A7A296` | Secondary text |
| `--text-faint` | `#6E6A60` | Tertiary / placeholders |
| `--gold` | `#D4AF37` | Primary accent (buttons, links, highlights) — **FINAL** |
| `--gold-bright` | `#F0D67E` | Hover / specular highlight |
| `--gold-deep` | `#9A7B1F` | Pressed / gradient end |
| `--gold-veil` | `rgba(212,175,55,0.14)` | Gold glow / tint washes |
| `--on-gold` | `#0B0B0C` | Text/icon colour on gold fills (near-black) |
| `--success` | `#4FB477` | Paid, delivered |
| `--warning` | `#E0A83E` | Pending, awaiting action |
| `--danger` | `#E5675C` | Failed, cancelled, destructive |
| `--info` | `#6FA8DC` | Neutral info |

> **`--gold = #D4AF37` is locked** (client-approved 2026-08-31). Classic metallic gold;
> contrast ≈ 8.9:1 on `#0B0B0C` (passes WCAG AA for normal text, comfortably for UI/large).
> Don't substitute other golds — use `--gold-bright` / `--gold-deep` for state, `--gold-veil`
> for washes. If the client later supplies a Pantone, map it here and re-check contrast.

**Gradients**
- Gold metallic (buttons/borders): `linear-gradient(135deg, #F0D67E 0%, #D4AF37 45%, #9A7B1F 100%)`.
- Aurora backdrop (behind glass hero): slow-animated radial blobs of `--gold-veil` +
  `rgba(111,168,220,0.08)` over `--bg`.

**Contrast rules**
- Body copy is always `--text` / `--text-muted` on a solid or sufficiently opaque backing —
  **never gold, never on raw glass over a busy area**.
- Gold is for headings ≥ 20px, icons, borders, small accents, and button fills (with
  near-black label `#0B0B0C` on gold — ~10:1).
- Every glass surface carrying text must resolve to ≥ 4.5:1 (add `--bg-raised` under the
  glass if a background image would drop it).

## 20.2 Typography

Self-hosted via `@fontsource-variable/*` (no external CDN — matches the privacy stance in
doc 15). Three families:

| Role | Family | Weights | Notes |
|---|---|---|---|
| **Display / headings** | **Fraunces** (variable, `opsz`, "Soft" style) | 400, 500, 600 | High-contrast literary serif → premium/couture feel. Use for h1–h3, hero, section titles, marketing. `font-optical-sizing: auto`. |
| **Body / UI** | **Inter** (variable) | 400, 500, 600 | All product UI, forms, tables, buttons, store & admin consoles. `font-feature-settings: "cv05","ss01"; font-variant-numeric: tabular-nums` for money/analytics. |
| **Mono** | **JetBrains Mono** (variable) | 400, 500 | Order refs (`DPD-000123`), OTP display, invoice numbers, code. Unambiguous digits. |

Fallback stacks:
```css
--font-display: "Fraunces Variable", Fraunces, Georgia, "Times New Roman", serif;
--font-sans: "Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

**Type scale** (rem, 16px base): 0.75 / 0.875 / 1 / 1.125 / 1.25 / 1.5 / 1.875 / 2.5 / 3.5.
- Marketing hero h1: `clamp(2.5rem, 6vw, 3.5rem)` Fraunces 500, tracking `-0.02em`.
- App screen title: 1.5rem Fraunces 500. Section/card title: 1.125rem Inter 600.
- Body: 1rem / 1.6 line-height. Small print: 0.875rem `--text-muted`.
- Buttons/labels: 0.9375rem Inter 600, tracking `+0.01em`, not all-caps (small-caps for
  eyebrows only).

## 20.3 Liquid-glass surfaces

The signature component look. Base "glass" recipe:

```css
.glass {
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);           /* 20px */
  box-shadow:
    0 1px 0 rgba(255,255,255,0.06) inset,      /* top inner highlight */
    0 20px 50px -20px rgba(0,0,0,0.6);         /* soft drop */
}
```

**Liquid / specular layer** — a pseudo-element with a moving gold sheen that tracks pointer
(desktop) or scroll (mobile):
```css
.glass::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: radial-gradient(120px 120px at var(--mx,50%) var(--my,0%),
              var(--gold-veil), transparent 60%);
  opacity: .6; transition: opacity .3s;
}
```
`--mx/--my` updated by a `useLiquidGlass` hook (throttled `pointermove` / `scroll`).

**Gradient border** (selected / focus / primary cards): 1px gradient using
`border-image` or a masked wrapper with the gold metallic gradient.

**Tiers**
- `glass` — cards, nav bars, bottom tab bar, sheets.
- `glass-strong` — modals, dropdowns, toasts (higher opacity for text safety).
- `glass-inline` — chips, inputs (blur 12px, radius 12px).
- **No glass** on long scrolling lists (order queues, tables): use a solid
  `--bg-raised` with a hairline border — `backdrop-filter` per-row is too expensive.

**Fallback**: `@supports not (backdrop-filter: blur(1px))` → replace glass fill with opaque
`--bg-raised` + hairline border. Never rely on blur for contrast.

## 20.4 Radii, spacing, elevation

- Radius: `--radius-sm 10px`, `--radius-md 14px`, `--radius-lg 20px`, `--radius-xl 28px`,
  pill `999px`.
- Spacing scale (px): 2, 4, 8, 12, 16, 20, 24, 32, 40, 56, 80.
- Elevation is expressed through blur amount + shadow depth + border brightness, not
  opaque grey steps. Max 2 stacked glass layers visible at once.
- Focus ring: `0 0 0 2px var(--bg), 0 0 0 4px var(--gold)` (always visible, never removed).

## 20.5 Motion

Library: **Framer Motion** (`motion/react`) for component/scroll animation; **Lenis** for
smooth scrolling **on the marketing website only** (apps keep native scroll for a snappy
PWA feel). Central config in `packages/ui/motion`.

**Tokens**
```
duration: xfast 120ms · fast 180ms · base 260ms · slow 420ms · xslow 700ms
easing:   standard cubic-bezier(.2,.0,.0,1) · entrance cubic-bezier(.16,1,.3,1) ("liquid")
          exit cubic-bezier(.4,0,1,1)
stagger:  60ms children
```

**Patterns**
- **Scroll reveal** — `<Reveal>` wrapper: `opacity 0→1`, `y 24→0`, `filter blur(6px)→0`,
  `easing entrance`, triggered at 15% in view, once. Sections stagger their children.
- **Slide transitions** — route changes slide + fade (`x: 24 → 0`, 260ms) in the apps;
  bottom sheets spring up (`type:"spring", stiffness 320, damping 34`).
- **Parallax** — hero art and aurora blobs move at 0.2–0.5× scroll (`useScroll` +
  `useTransform`); marketing only.
- **Liquid hover** — buttons/cards: slight scale `1.02`, gold sheen sweep, shadow lift;
  "magnetic" pull toward cursor within 12px on primary CTAs (desktop).
- **Marquee** — testimonials / partner logos auto-scroll horizontally, pause on hover.
- **Number roll** — analytics KPIs count up on reveal.
- **Skeletons** — shimmer uses a gold-tinted gradient sweep, 1.4s loop.
- **Toasts / OTP reveal** — spring in; OTP digits do a quick stagger flip.

**`prefers-reduced-motion: reduce`** — disable all transform/parallax/marquee/magnetic;
keep only ≤120ms opacity fades. `<Reveal>` becomes an instant fade. This is enforced in the
shared motion primitives so individual screens can't forget it.

**Performance guardrails**
- Animate only `transform`, `opacity`, `filter`. Never animate layout/`width`/`top`.
- `will-change` applied transiently, removed after.
- No scroll-linked animation on lists > ~30 rows.
- Lenis disabled on touch if it fights native momentum; test on a real mid-range Android.
- Keep total simultaneous `backdrop-filter` nodes ≤ 4 on screen.

## 20.6 Core components (in `packages/ui`)

Built on shadcn/ui (Radix) primitives, restyled to the glass/gold system:

`GlassCard`, `GlassPanel`, `AppBar` / `BottomTabBar` (glass, safe-area aware),
`Button` (variants: `gold` solid, `glass` outline, `ghost`, `danger`),
`Input` / `Select` / `Stepper` / `OtpInput` (mono, big), `Badge` (status colour map),
`StatusPill`, `Sheet` / `Modal` (glass-strong), `Toast`, `Skeleton`, `KpiTile` (number roll),
`Timeline` (order status), `Reveal` / `Parallax` / `Marquee` / `Magnetic` (motion),
`Map` wrapper, `PhotoUploader` (camera), `EmptyState`, `PriceTag` (`formatMoney`).

**Status colour map** (shared by customer + store + admin):
`PLACED/ROUTED/ACCEPTED` → info · `PICKUP_*/OUT_FOR_DELIVERY/IN_PROCESS` → warning ·
`PICKED_UP/AT_STORE/READY` → gold · `INVOICED` → warning · `DELIVERED/COMPLETED` → success ·
`ROUTING_FAILED/REJECTED/CANCELLED` → danger.

## 20.7 Per-surface application

| Surface | Glass usage | Motion usage |
|---|---|---|
| Marketing website | Heavy — glass nav, hero card, feature cards over animated aurora; Lenis smooth scroll | Full: parallax, scroll reveals, marquee, magnetic CTAs |
| Customer PWA | Moderate — glass app bar + bottom tabs + sheets + order cards; solid rows in long lists | Route slides, sheet springs, reveal on first paint, OTP reveal, KPI roll; native scroll |
| Store PWA | Light — glass chrome only; **boards & queues use solid `--bg-raised` rows** for perf | Minimal: subtle reveals, toast/spring; no parallax |
| Admin panel | Light — glass top bar, drawers, modals; dense tables stay solid | Minimal: drawer/modal transitions, number roll on dashboard |

## 20.8 PWA manifest / meta colours

- `theme_color`: `#0B0B0C` · `background_color`: `#0B0B0C`.
- Splash / icons: black field, gold monogram/wordmark "Desire".
- iOS status bar: `black-translucent`. `<meta name="color-scheme" content="dark">`.

## 20.9 Assets still needed from the client

Logo (SVG, light-on-dark + monogram), final gold spec if they have a Pantone, hero/garment
photography (shot dark & moody), and any existing brand guideline. Until then, use the
tokens above and a typographic "Desire" wordmark in Fraunces.
