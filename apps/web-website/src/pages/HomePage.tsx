import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GlassCard, Reveal, staggerContainer, fadeInUp } from '@ddc/ui';
import { useSeo } from '../lib/seo';

// ── Icons ──────────────────────────────────────────────────────────────────

function Icon({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const CalendarIcon = () => (
  <Icon><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Icon>
);
const SparklesIcon = () => (
  <Icon><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/><path d="M5 18l.75 2.25L8 21l-2.25.75L5 24l-.75-2.25L2 21l2.25-.75L5 18z"/></Icon>
);
const TruckIcon = () => (
  <Icon><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Icon>
);
const ShirtIcon = () => (
  <Icon><path d="M20 7l-4-4-4 4-4-4-4 4 2 2v10a1 1 0 001 1h10a1 1 0 001-1V9l2-2z"/></Icon>
);
const TrousersIcon = () => (
  <Icon><path d="M5 2h14v7l-3 13H8L5 9V2z"/><path d="M5 9h14"/><path d="M12 9l2 13"/></Icon>
);
const SuitIcon = () => (
  <Icon><path d="M6 2l-3 5h4l2 15h6l2-15h4l-3-5"/><path d="M6 2l3 7 3-7 3 7"/></Icon>
);
const EthnicIcon = () => (
  <Icon><path d="M12 2C6 2 4 7 4 12v9h16v-9c0-5-2-10-8-10z"/><path d="M4 16h16"/><path d="M8 8h8"/></Icon>
);
const WinterIcon = () => (
  <Icon><path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07L19.07 4.93"/><circle cx="12" cy="12" r="3"/></Icon>
);
const HomeTextileIcon = () => (
  <Icon><rect x="2" y="7" width="20" height="13" rx="1"/><path d="M2 11h20"/><path d="M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2"/></Icon>
);
const LeatherIcon = () => (
  <Icon><path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M8 10h8M8 14h5"/><path d="M12 2v4"/></Icon>
);
const ShieldIcon = () => (
  <Icon><path d="M12 2l9 4v6c0 5-4 9-9 11C7 21 3 17 3 12V6l9-4z"/></Icon>
);
const StarIcon = () => (
  <Icon><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>
);
const LeafIcon = () => (
  <Icon><path d="M17 8C8 10 5.9 16.17 3.82 19.34A9 9 0 0019 19c1-1.67 1-5 1-5M19 9a9 9 0 00-9 9"/></Icon>
);
const ClockIcon = () => (
  <Icon><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></Icon>
);

// ── Data ───────────────────────────────────────────────────────────────────

const STEPS = [
  { num: '01', Icon: CalendarIcon, title: 'Schedule Pickup', desc: 'Choose a date and time slot that works for you. We come to your door — no drop-off needed.' },
  { num: '02', Icon: SparklesIcon, title: 'Expert Cleaning', desc: 'Our certified team inspects every garment and applies the right treatment for each fabric.' },
  { num: '03', Icon: TruckIcon,    title: 'Door Delivery',   desc: 'Fresh, clean, perfectly pressed clothes delivered right back to your door.' },
] as const;

const CATEGORIES = [
  { Icon: ShirtIcon,        name: 'Shirts & Tops',        desc: 'Dress shirts, T-shirts, blouses, polos with precise press' },
  { Icon: TrousersIcon,     name: 'Trousers & Jeans',     desc: 'Careful wash & press for all cuts and fabrics' },
  { Icon: SuitIcon,         name: 'Suits & Formal Wear',  desc: '2-piece, 3-piece, blazers, ties — dry cleaned to perfection' },
  { Icon: EthnicIcon,       name: 'Ethnic Wear',          desc: 'Sarees, lehengas, sherwanis with the care they deserve' },
  { Icon: WinterIcon,       name: 'Winter Wear',          desc: 'Sweaters, jackets, coats — deep clean before every season' },
  { Icon: HomeTextileIcon,  name: 'Home Textiles',        desc: 'Bed sheets, curtains, duvets, blankets freshened up' },
  { Icon: LeatherIcon,      name: 'Accessories & Leather',desc: 'Leather jackets, handbags, shoes — conditioning included' },
] as const;

const TRUST = [
  { Icon: ShieldIcon, title: 'Insured Garments',   desc: 'Every item is covered while in our care.' },
  { Icon: StarIcon,   title: 'Certified Cleaners', desc: 'Trained professionals with proven processes.' },
  { Icon: LeafIcon,   title: 'Eco-Friendly',       desc: 'Responsible solvents and water-saving methods.' },
  { Icon: ClockIcon,  title: 'On-Time Guarantee',  desc: 'Delivered within your agreed window, every time.' },
] as const;

const STATS = [
  { value: '3+',  label: 'Stores' },
  { value: '33+', label: 'Services' },
  { value: '48h', label: 'Turnaround' },
  { value: '12+', label: 'Pincodes served' },
] as const;

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  useSeo({
    title: 'Desire Premium Dry Cleaning — Greater Noida West',
    description: 'Professional dry cleaning picked up from your door and delivered back fresh. Serving Greater Noida West, UP.',
  });

  return (
    <main id="main">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        {/* Gold glow background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_65%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-void to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto pt-24 pb-20">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs text-silver mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" aria-hidden="true" />
            Serving Greater Noida West &amp; surrounding pincodes
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[84px] text-chalk leading-[1.04] tracking-tight mb-6"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Your Finest Pieces,{' '}
            <span className="text-gold-gradient">Returned&nbsp;Immaculate.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="text-lg sm:text-xl text-silver max-w-lg mx-auto mb-10 leading-relaxed"
          >
            Pickup from your door. Expert dry cleaning. Delivered back fresh — in 48&nbsp;hours or less.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href="https://user.desiredrycleaning.in"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gold hover:bg-gold-bright text-void text-base font-semibold transition-colors duration-200 shadow-gold"
            >
              Book a Pickup →
            </a>
            <Link
              to="/services"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-[var(--border)] hover:border-gold/40 text-silver hover:text-chalk text-base font-medium transition-colors duration-200 text-center"
            >
              Explore Services
            </Link>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          aria-hidden="true"
        >
          <span className="text-[10px] text-slate tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            className="w-px h-7 bg-gradient-to-b from-gold/40 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────── */}
      <section className="bg-onyx border-y border-[var(--border)]" aria-label="Key facts">
        <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4">
          {STATS.map(({ value, label }, i) => (
            <div
              key={label}
              className={`px-4 sm:px-8 py-3 text-center ${i < STATS.length - 1 ? 'border-r border-[var(--border)]' : ''}`}
            >
              <div className="font-display text-2xl sm:text-3xl text-gold">{value}</div>
              <div className="text-xs text-silver mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-xs text-gold tracking-widest uppercase mb-3">Simple process</p>
              <h2 className="font-display text-3xl sm:text-4xl text-chalk" style={{ textWrap: 'balance' } as React.CSSProperties}>
                Three steps to spotless
              </h2>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {STEPS.map(({ num, Icon: StepIcon, title, desc }) => (
              <motion.div key={num} variants={fadeInUp}>
                <GlassCard padding="lg" className="relative h-full">
                  <span className="font-mono text-5xl font-bold text-gold/15 absolute top-4 right-4 select-none" aria-hidden="true">
                    {num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold-glow)] border border-[var(--glass-border)] flex items-center justify-center mb-4 text-gold">
                    <StepIcon />
                  </div>
                  <h3 className="text-base font-semibold text-chalk mb-2">{title}</h3>
                  <p className="text-sm text-silver leading-relaxed">{desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Service categories ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 bg-onyx">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-xs text-gold tracking-widest uppercase mb-3">What we clean</p>
              <h2 className="font-display text-3xl sm:text-4xl text-chalk mb-3" style={{ textWrap: 'balance' } as React.CSSProperties}>
                Every garment, every fabric
              </h2>
              <p className="text-sm text-silver max-w-md mx-auto">
                From everyday shirts to heirloom ethnic wear — each piece gets the treatment it deserves.
              </p>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {CATEGORIES.map(({ Icon: CatIcon, name, desc }) => (
              <motion.div key={name} variants={fadeInUp}>
                <GlassCard hoverable sheen padding="md" className="flex flex-col gap-3 h-full">
                  <div className="w-9 h-9 rounded-lg bg-[var(--gold-glow)] border border-[var(--glass-border)] flex items-center justify-center text-gold shrink-0">
                    <CatIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-chalk mb-1">{name}</p>
                    <p className="text-xs text-silver leading-relaxed">{desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}

            {/* View all */}
            <motion.div variants={fadeInUp}>
              <Link to="/services" className="block h-full">
                <GlassCard hoverable padding="md" className="flex flex-col items-center justify-center h-full min-h-[130px] text-center gap-2">
                  <span className="text-2xl text-gold/50" aria-hidden="true">→</span>
                  <p className="text-sm font-medium text-gold">View all services</p>
                </GlassCard>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust signals ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-xs text-gold tracking-widest uppercase mb-3">Why Desire</p>
              <h2 className="font-display text-3xl sm:text-4xl text-chalk" style={{ textWrap: 'balance' } as React.CSSProperties}>
                Trusted with your finest
              </h2>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {TRUST.map(({ Icon: TrustIcon, title, desc }) => (
              <motion.div key={title} variants={fadeInUp}>
                <GlassCard padding="lg" className="h-full">
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold-glow)] border border-[var(--glass-border)] flex items-center justify-center mb-4 text-gold">
                    <TrustIcon />
                  </div>
                  <h3 className="text-base font-semibold text-chalk mb-1.5">{title}</h3>
                  <p className="text-sm text-silver leading-relaxed">{desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────────── */}
      <Reveal>
        <section
          className="py-20 sm:py-24 px-4 border-t border-[var(--border)]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.07) 0%, transparent 70%)' }}
        >
          <div className="max-w-lg mx-auto text-center">
            <h2
              className="font-display text-3xl sm:text-4xl text-chalk mb-4"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              Ready for clothes that look brand new?
            </h2>
            <p className="text-silver mb-8 text-sm leading-relaxed">
              Schedule your first pickup today. No subscription required.
            </p>
            <a
              href="https://user.desiredrycleaning.in"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-gold hover:bg-gold-bright text-void text-base font-semibold transition-colors duration-200 shadow-gold"
            >
              Book a Pickup →
            </a>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
