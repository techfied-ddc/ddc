import { motion } from 'framer-motion';
import { GlassCard, Reveal, staggerContainer, fadeInUp } from '@ddc/ui';
import { useSeo } from '../lib/seo';

const VALUES = [
  {
    title: 'Meticulous care',
    desc: 'Every garment is hand-inspected before and after cleaning. We treat your clothes as if they were our own.',
  },
  {
    title: 'Transparency',
    desc: 'No surprises. You see the exact invoice before we begin, and any additional charge is discussed first.',
  },
  {
    title: 'On-time, every time',
    desc: 'We set a delivery window when you book and honour it. Your time matters as much as your wardrobe.',
  },
  {
    title: 'Eco-responsibility',
    desc: 'We use responsible solvents, water-saving processes, and minimal single-use packaging wherever possible.',
  },
] as const;

const COVERAGE = [
  'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4',
  'Sector 10', 'Sector 16', 'Gaur City', 'Crossing Republik',
  'Noida Extension', 'Chi', 'Zeta', 'Omicron',
] as const;

export default function AboutPage() {
  useSeo({
    title: 'About — Desire Premium Dry Cleaning',
    description: 'Learn about Desire Premium Dry Cleaning — our story, our values, and the Greater Noida West neighbourhoods we serve.',
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
            Our story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl sm:text-5xl text-chalk mb-5"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Expert care, delivered to your door
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-silver text-base leading-relaxed"
          >
            Desire Premium Dry Cleaning was founded on a simple belief: your finest garments deserve professional care — and getting that care shouldn&rsquo;t be an inconvenience.
          </motion.p>
        </div>
      </section>

      {/* ── Story ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-chalk mb-5">
                  Built for Greater Noida West
                </h2>
                <div className="space-y-4 text-sm text-silver leading-relaxed">
                  <p>
                    Greater Noida West is home to a growing, busy community — professionals, families, and students — who care about their appearance but have little time to spare. We built Desire Premium Dry Cleaning to serve exactly that community.
                  </p>
                  <p>
                    We operate multiple physical stores across key sectors, each staffed by trained cleaning professionals. Our riders pick up from your door and return the finished garments to the same address — you never need to step out.
                  </p>
                  <p>
                    Every order goes through a documented inspection: garment type, fabric, existing stains, care labels. The store issues the final invoice only after this inspection, and you approve it before any cleaning begins.
                  </p>
                </div>
              </div>

              <GlassCard padding="lg" sheen className="flex flex-col gap-5">
                <div>
                  <p className="text-xs text-gold tracking-widest uppercase mb-2">Our mission</p>
                  <p className="font-display text-xl text-chalk leading-snug">
                    &ldquo;Return every garment in better condition than it arrived.&rdquo;
                  </p>
                </div>
                <hr className="border-[var(--border-muted)]" />
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Stores operating', value: '3+' },
                    { label: 'Services offered', value: '33+' },
                    { label: 'Max turnaround',   value: '48h' },
                    { label: 'Pincodes served',  value: '12+' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="font-display text-2xl text-gold">{value}</p>
                      <p className="text-xs text-silver mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-onyx border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-xs text-gold tracking-widest uppercase mb-3">What we stand for</p>
              <h2 className="font-display text-3xl sm:text-4xl text-chalk">Our values</h2>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {VALUES.map(({ title, desc }) => (
              <motion.div key={title} variants={fadeInUp}>
                <GlassCard padding="lg" className="h-full">
                  <h3 className="text-base font-semibold text-chalk mb-2">{title}</h3>
                  <p className="text-sm text-silver leading-relaxed">{desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Coverage ────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-xs text-gold tracking-widest uppercase mb-3">Where we operate</p>
              <h2 className="font-display text-3xl sm:text-4xl text-chalk mb-3">
                Serving Greater Noida West
              </h2>
              <p className="text-sm text-silver">
                We currently cover 12+ pincodes across the area. More sectors are being added regularly.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {COVERAGE.map(area => (
                <span
                  key={area}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-silver bg-[var(--glass-bg)]"
                >
                  {area}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-lg border border-gold/30 text-sm text-gold bg-[var(--gold-glow)]">
                + more expanding
              </span>
            </div>
          </Reveal>

          <Reveal>
            <div className="text-center">
              <p className="text-sm text-silver mb-5">Not sure if we cover your area?</p>
              <a
                href="https://user.desiredrycleaning.in"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-gold hover:bg-gold-bright text-void text-sm font-semibold transition-colors duration-200"
              >
                Check at checkout →
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
