import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Reveal, staggerContainer, fadeInUp } from '@ddc/ui';
import { useSeo } from '../lib/seo';

const HOURS = [
  { day: 'Monday – Saturday', hours: '7:00 AM – 8:00 PM' },
  { day: 'Sunday',            hours: '8:00 AM – 6:00 PM' },
] as const;

const INFO_CARDS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 9a19.79 19.79 0 01-3.07-8.67A2 2 0 012.88 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
    label: 'Phone',
    value: '+91 91186 78519',
    href: 'tel:+919118678519',
    cta: 'Call now',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M2 7l10 7 10-7"/>
      </svg>
    ),
    label: 'Email',
    value: 'techfied.desiredrycleaning@gmail.com',
    href: 'mailto:techfied.desiredrycleaning@gmail.com',
    cta: 'Send email',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s-7-6.5-7-11a7 7 0 1114 0c0 4.5-7 11-7 11z"/>
        <circle cx="12" cy="10" r="2"/>
      </svg>
    ),
    label: 'Location',
    value: 'Greater Noida West, Uttar Pradesh 201009',
    href: 'https://maps.google.com/?q=Greater+Noida+West+UP+201009',
    cta: 'Open in Maps',
  },
] as const;

type FormState = 'idle' | 'sending' | 'sent';

export default function ContactPage() {
  useSeo({
    title: 'Contact — Desire Premium Dry Cleaning',
    description: 'Get in touch with Desire Premium Dry Cleaning. Call, email, or send us a message — we\'re happy to help.',
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<FormState>('idle');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    setState('sending');
    const body = `Name: ${name}\nPhone: ${phone}\n\n${message}`;
    const subject = encodeURIComponent('Enquiry from desiredrycleaning.in');
    const bodyEnc = encodeURIComponent(body);
    window.location.href = `mailto:techfied.desiredrycleaning@gmail.com?subject=${subject}&body=${bodyEnc}`;

    setTimeout(() => {
      setState('sent');
      setName('');
      setPhone('');
      setMessage('');
    }, 400);
  }

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
            Get in touch
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl sm:text-5xl text-chalk mb-4"
          >
            We&rsquo;re here to help
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-silver text-base"
          >
            Questions about your order, our services, or coverage area? Reach out any time.
          </motion.p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: info */}
          <div className="flex flex-col gap-8">
            {/* Contact cards */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              {INFO_CARDS.map(({ icon, label, value, href, cta }) => (
                <motion.div key={label} variants={fadeInUp}>
                  <GlassCard hoverable padding="md">
                    <a
                      href={href}
                      target={href.startsWith('https') ? '_blank' : undefined}
                      rel={href.startsWith('https') ? 'noopener noreferrer' : undefined}
                      className="flex items-start gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[var(--gold-glow)] border border-[var(--glass-border)] flex items-center justify-center shrink-0 text-gold">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-sm text-chalk break-all mb-1">{value}</p>
                        <span className="text-xs text-gold group-hover:underline">{cta} →</span>
                      </div>
                    </a>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>

            {/* Business hours */}
            <Reveal>
              <GlassCard padding="md">
                <h2 className="text-sm font-semibold text-chalk mb-4 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  Business hours
                </h2>
                <ul className="space-y-2.5">
                  {HOURS.map(({ day, hours }) => (
                    <li key={day} className="flex justify-between items-baseline gap-4 text-sm">
                      <span className="text-silver">{day}</span>
                      <span className="text-chalk font-medium font-mono shrink-0">{hours}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate">Pickup &amp; delivery slots may vary by store.</p>
              </GlassCard>
            </Reveal>

            {/* Quick CTA */}
            <Reveal>
              <div className="text-center">
                <p className="text-sm text-silver mb-4">Ready to book a pickup?</p>
                <a
                  href="https://user.desiredrycleaning.in"
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-gold hover:bg-gold-bright text-void text-sm font-semibold transition-colors duration-200"
                >
                  Book now →
                </a>
              </div>
            </Reveal>
          </div>

          {/* Right: message form */}
          <Reveal>
            <GlassCard padding="lg">
              <h2 className="text-lg font-semibold text-chalk mb-1">Send a message</h2>
              <p className="text-sm text-silver mb-6">
                We&rsquo;ll open your email client pre-filled — just hit send.
              </p>

              {state === 'sent' ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[var(--gold-glow)] flex items-center justify-center mx-auto mb-4 text-gold">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <p className="text-chalk font-medium mb-1">Email client opened</p>
                  <p className="text-sm text-silver">Thank you — we&rsquo;ll get back to you shortly.</p>
                  <button
                    onClick={() => setState('idle')}
                    className="mt-5 text-sm text-gold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs text-silver mb-1.5">
                      Your name <span className="text-danger" aria-label="required">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Rahul Sharma"
                      className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-ash)] border border-[var(--border)] text-chalk text-sm placeholder:text-slate focus:outline-none focus:border-gold/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-phone" className="block text-xs text-silver mb-1.5">
                      Phone number <span className="text-danger" aria-label="required">*</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      inputMode="tel"
                      className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-ash)] border border-[var(--border)] text-chalk text-sm placeholder:text-slate focus:outline-none focus:border-gold/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs text-silver mb-1.5">
                      Message <span className="text-danger" aria-label="required">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Tell us how we can help…"
                      rows={5}
                      className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-ash)] border border-[var(--border)] text-chalk text-sm placeholder:text-slate focus:outline-none focus:border-gold/50 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={state === 'sending'}
                    className="w-full py-3 rounded-xl bg-gold hover:bg-gold-bright text-void text-sm font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {state === 'sending' ? 'Opening email…' : 'Send message →'}
                  </button>
                </form>
              )}
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
