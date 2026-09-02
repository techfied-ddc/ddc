import { motion } from 'framer-motion';
import { GlassCard, Reveal, staggerContainer, fadeInUp } from '@ddc/ui';
import { useSeo } from '../lib/seo';

const CATEGORIES = [
  {
    name: 'Shirts & Tops',
    desc: 'Machine-washable and delicate fabrics handled with equal care. Every shirt returned crisp and pressed.',
    services: [
      { name: 'Shirt — wash & iron',    unit: 'per piece', note: '' },
      { name: 'Shirt — starch finish',  unit: 'per piece', note: 'Extra crispness' },
      { name: 'T-shirt — wash & iron',  unit: 'per piece', note: '' },
      { name: 'Blouse — dry clean',     unit: 'per piece', note: 'Delicate fabrics' },
      { name: 'Polo — wash & iron',     unit: 'per piece', note: '' },
    ],
  },
  {
    name: 'Trousers & Jeans',
    desc: 'All cuts and fabrics — dress trousers, denim, chinos — cleaned and creased to perfection.',
    services: [
      { name: 'Trousers — wash & iron', unit: 'per piece', note: '' },
      { name: 'Jeans — wash & iron',    unit: 'per piece', note: '' },
      { name: 'Shorts — wash & iron',   unit: 'per piece', note: '' },
    ],
  },
  {
    name: 'Suits & Formal Wear',
    desc: 'Dry cleaning for your finest suits, blazers, and formal pieces — professionally finished and bagged.',
    services: [
      { name: 'Suit — 2-piece dry clean',  unit: 'per suit',  note: 'Jacket + trousers' },
      { name: 'Suit — 3-piece dry clean',  unit: 'per suit',  note: 'Jacket + trousers + waistcoat' },
      { name: 'Blazer — dry clean',        unit: 'per piece', note: '' },
      { name: 'Waistcoat — dry clean',     unit: 'per piece', note: '' },
      { name: 'Tie — dry clean',           unit: 'per piece', note: '' },
    ],
  },
  {
    name: 'Ethnic Wear',
    desc: 'Heirloom-level care for sarees, lehengas, and sherwanis. Specialised treatment for zari, embroidery, and silk.',
    services: [
      { name: 'Saree — dry clean',         unit: 'per piece', note: 'Silk & embroidered safe' },
      { name: 'Salwar Kameez — dry clean', unit: 'per set',   note: '' },
      { name: 'Lehenga — dry clean',       unit: 'per set',   note: 'Skirt + blouse + dupatta' },
      { name: 'Kurta — wash & iron',       unit: 'per piece', note: '' },
      { name: 'Sherwani — dry clean',      unit: 'per piece', note: '' },
      { name: 'Dupatta — wash & press',    unit: 'per piece', note: '' },
    ],
  },
  {
    name: 'Winter Wear',
    desc: 'Deep clean before and after the cold season. Sweaters, jackets, and coats emerge fresh and fluffy.',
    services: [
      { name: 'Sweater — dry clean',       unit: 'per piece', note: 'Wool & acrylic safe' },
      { name: 'Jacket — dry clean',        unit: 'per piece', note: '' },
      { name: 'Woollen coat — dry clean',  unit: 'per piece', note: '' },
      { name: 'Hoodie — wash & dry',       unit: 'per piece', note: '' },
      { name: 'Muffler / Stole — dry clean',unit: 'per piece',note: '' },
    ],
  },
  {
    name: 'Home Textiles',
    desc: 'Large-format cleaning for the items your washing machine struggles with — beds, baths, curtains.',
    services: [
      { name: 'Bed sheet — single',          unit: 'per piece', note: '' },
      { name: 'Bed sheet — double / king',   unit: 'per piece', note: '' },
      { name: 'Pillow cover',                unit: 'per piece', note: '' },
      { name: 'Curtain — dry clean',         unit: 'per panel', note: '' },
      { name: 'Duvet / Comforter — dry clean',unit: 'per piece',note: '' },
      { name: 'Blanket — dry clean',         unit: 'per piece', note: '' },
    ],
  },
  {
    name: 'Accessories & Leather',
    desc: 'Leather conditioning, bag cleaning, and shoe restoration — handled by specialists.',
    services: [
      { name: 'Leather jacket — dry clean',              unit: 'per piece', note: 'Conditioning included' },
      { name: 'Handbag — cleaning & conditioning',       unit: 'per piece', note: '' },
      { name: 'Shoes — cleaning & polishing',            unit: 'per pair',  note: '' },
      { name: 'Cap / Hat — dry clean',                   unit: 'per piece', note: '' },
    ],
  },
] as const;

export default function ServicesPage() {
  useSeo({
    title: 'Services — Desire Premium Dry Cleaning',
    description: 'Complete list of dry cleaning and laundry services: shirts, suits, ethnic wear, winter wear, home textiles, leather, and more.',
  });

  return (
    <main id="main" className="pt-16">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-24 px-4 overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(212,175,55,0.08),transparent_70%)]" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs text-gold tracking-widest uppercase mb-4"
          >
            What we offer
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl sm:text-5xl text-chalk mb-4"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Every garment, every fabric
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-silver text-base leading-relaxed max-w-xl mx-auto"
          >
            Prices shown are estimates. After pickup, our store inspects each garment and issues the final invoice — you approve before we proceed.
          </motion.p>
        </div>
      </section>

      {/* ── Category sections ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20 space-y-16">
        {CATEGORIES.map(({ name, desc, services }, ci) => (
          <Reveal key={name} delay={0}>
            <section aria-labelledby={`cat-${ci}`}>
              <div className="mb-6">
                <h2
                  id={`cat-${ci}`}
                  className="font-display text-2xl sm:text-3xl text-chalk mb-2"
                >
                  {name}
                </h2>
                <p className="text-sm text-silver max-w-xl">{desc}</p>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {services.map(({ name: svcName, unit, note }) => (
                  <motion.div key={svcName} variants={fadeInUp}>
                    <GlassCard padding="md" className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-chalk">{svcName}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate font-mono">{unit}</span>
                        {note && (
                          <span className="text-xs text-gold/70 bg-[var(--gold-glow)] px-1.5 py-0.5 rounded">
                            {note}
                          </span>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {ci < CATEGORIES.length - 1 && (
              <hr className="mt-16 border-[var(--border-muted)]" />
            )}
          </Reveal>
        ))}
      </div>

      {/* ── Pricing note ─────────────────────────────────────────────── */}
      <Reveal>
        <section className="py-12 px-4 bg-onyx border-t border-[var(--border)]">
          <div className="max-w-3xl mx-auto">
            <GlassCard padding="lg">
              <h2 className="text-base font-semibold text-chalk mb-2">How pricing works</h2>
              <p className="text-sm text-silver leading-relaxed">
                Prices on this page are estimates based on our standard catalogue. After we pick up your garments, our store team physically inspects each piece — checking fabric, condition, and care label — and issues a binding invoice. You see the exact total before we begin cleaning. Unusual stains, delicate embellishments, or special fabrics may attract additional charges, which we&rsquo;ll always discuss with you first.
              </p>
            </GlassCard>
          </div>
        </section>
      </Reveal>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="py-16 px-4 text-center border-t border-[var(--border)]">
          <h2 className="font-display text-2xl sm:text-3xl text-chalk mb-3">
            Ready to book?
          </h2>
          <p className="text-silver text-sm mb-7">Schedule a pickup and we&rsquo;ll handle the rest.</p>
          <a
            href="https://user.desiredrycleaning.in"
            className="inline-flex items-center px-7 py-3.5 rounded-xl bg-gold hover:bg-gold-bright text-void text-base font-semibold transition-colors duration-200 shadow-gold"
          >
            Book a Pickup →
          </a>
        </section>
      </Reveal>
    </main>
  );
}
