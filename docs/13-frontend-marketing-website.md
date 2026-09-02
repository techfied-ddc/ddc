# 13 — Marketing Website (`desiredrycleaning.in`)

Public, SEO-focused brand site for **Desire Premium Dry Cleaning**. React + Vite SPA with
pre-rendered meta. Its job: build trust, explain services, capture leads, and send people
into the customer app or the store signup.

## 13.1 Pages

| Page | Route | Content |
|---|---|---|
| Home | `/` | Hero (value prop + "Order now" CTA → `user.desiredrycleaning.in`), how it works (4 steps), featured services, coverage areas, testimonials, trust badges, footer |
| Services | `/services` | Full catalog from `GET /site/services` (category → services with price/unit), "Order this" CTA |
| About Us | `/about` | Story, quality promise, team, locations, contact |
| Contact Us | `/contact` | Contact form (`POST /site/contact`, captcha + rate-limited), phone `+91 91186 78519`, email, address (Greater Noida West, UP 201009), map embed |
| Partner with us | `/partner` | Pitch for store owners → CTA to `store.desiredrycleaning.in` registration |
| Coverage check | `/coverage` (or Home widget) | Pincode input → `GET /site/coverage` → "We serve your area / not yet — notify me" |
| Legal | `/terms`, `/privacy` | T&C, privacy policy |
| Auth entry | `/login`, `/signup` | Google + email; on success redirect: customers → `user.`, store intent → `store.` |
| 404 | `*` | Friendly not-found |

## 13.2 Header / footer

- Header: logo, Services, About, Contact, Partner, **Sign in** / **Order now**.
- Footer: quick links, services list, contact block, social, copyright, legal links.

## 13.3 Auth behaviour

- Website hosts the shared sign-in. On success it sets the `.desiredrycleaning.in` refresh
  cookie, so the customer/store app opens already authenticated.
- "Order now" for a signed-in customer goes straight to `user.` ; for a guest, to
  `/signup?redirect=user`.

## 13.4 SEO & performance

- Per-route `<title>`, meta description, canonical, Open Graph / Twitter cards, JSON-LD
  (`LocalBusiness` with name, phone, address, geo, opening hours; `Service` items).
- `sitemap.xml`, `robots.txt`. Pre-render/SSG the static routes at build (e.g.
  `vite-plugin-ssg` or prerender) so crawlers get real HTML; Services page can hydrate from
  the API but ship a prerendered snapshot.
- Image optimisation (Cloudinary transforms), lazy-loading, system font stack + one brand
  font, Lighthouse SEO/Perf ≥ 90.
- Analytics: privacy-friendly (Plausible/Umami) or GA4 — client to confirm; behind a
  consent check.

## 13.5 Content model

- Services/categories come **live from the catalog API** (single source of truth with the
  apps). Home testimonials, "how it works", coverage-area copy, About content: simple JSON/
  MDX files in the repo for v1 (no CMS). A headless CMS is a later option.

## 13.6 Design

- Full expression of the **black & gold liquid-glass** system (`docs/20-design-system.md`):
  glass nav + hero card + feature cards floating over an animated gold "aurora" backdrop,
  premium dark garment photography, gradient-gold CTAs.
- Type: Fraunces display for hero/section titles, Inter for body.
- Motion: **Lenis smooth scroll** (marketing only) + Framer Motion — parallax hero,
  scroll-reveal sections with stagger, testimonial/partner marquee, magnetic primary CTAs,
  number-roll on stats. Everything degrades to simple fades under `prefers-reduced-motion`.
- Fully responsive; glass mobile nav drawer.
- Accessibility AA: semantic landmarks, alt text, visible focus, ≥ 4.5:1 text contrast on
  glass (add solid backing where photography would drop it).
- Performance: cap simultaneous `backdrop-filter` layers, provide the non-blur fallback,
  keep Lighthouse Perf ≥ 90 despite the effects (lazy-load below-the-fold glass/motion).

## 13.7 Data / endpoints used

`GET /site/services`, `GET /site/coverage`, `POST /site/contact`, `GET /api/v1/meta/settings`
(support contacts, currency), plus the shared `/auth/*` routes.
