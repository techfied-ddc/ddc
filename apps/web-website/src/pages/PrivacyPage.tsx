import React from 'react';
import { GlassCard } from '@ddc/ui';
import { useSeo } from '../lib/seo.js';

const EFFECTIVE_DATE = '1 September 2026';
const BRAND = 'Desire Premium Dry Cleaning';
const EMAIL = 'techfied.desiredrycleaning@gmail.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="space-y-2 text-sm text-[var(--text-muted)] leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  useSeo({ title: `Privacy Policy — ${BRAND}`, description: 'How Desire Premium Dry Cleaning collects, uses, and protects your personal data.' });

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      <div className="space-y-2">
        <p className="font-mono text-xs text-[var(--gold)] uppercase tracking-widest">Legal</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-subtle)]">Effective date: {EFFECTIVE_DATE}</p>
      </div>

      <GlassCard className="p-6 space-y-8">
        <Section title="1. Who We Are">
          <p>{BRAND} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the dry-cleaning platform available at desiredrycleaning.in and the associated customer and store apps. We are responsible for the personal data you share with us.</p>
          <p>Contact: <a href={`mailto:${EMAIL}`} className="text-[var(--gold)] underline-offset-2 hover:underline">{EMAIL}</a></p>
        </Section>

        <Section title="2. Data We Collect">
          <ul className="list-disc pl-4 space-y-1">
            <li><strong className="text-[var(--text-primary)]">Account data</strong> — mobile number, name, email address (optional), and authentication method.</li>
            <li><strong className="text-[var(--text-primary)]">Order data</strong> — pickup address, garment details, service selections, order history, and payment mode.</li>
            <li><strong className="text-[var(--text-primary)]">Location data</strong> — pincode used for store routing. We do not track continuous GPS location.</li>
            <li><strong className="text-[var(--text-primary)]">Device data</strong> — browser type, OS, and push notification token (if you enable notifications).</li>
            <li><strong className="text-[var(--text-primary)]">Communications</strong> — support ticket messages, ratings, and feedback you submit.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="list-disc pl-4 space-y-1">
            <li>To fulfil and manage your dry-cleaning orders.</li>
            <li>To send order status updates via SMS, push notifications, and in-app messages.</li>
            <li>To verify identity via OTP during login and garment handover.</li>
            <li>To process payments and issue invoices.</li>
            <li>To improve service quality through aggregated analytics.</li>
            <li>To respond to support tickets and resolve disputes.</li>
          </ul>
        </Section>

        <Section title="4. Legal Basis (DPDP Act 2023)">
          <p>We process your personal data on the basis of:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong className="text-[var(--text-primary)]">Contract performance</strong> — to deliver the services you have ordered.</li>
            <li><strong className="text-[var(--text-primary)]">Consent</strong> — for push notifications and marketing communications.</li>
            <li><strong className="text-[var(--text-primary)]">Legitimate interest</strong> — for fraud prevention and platform security.</li>
          </ul>
        </Section>

        <Section title="5. Data Sharing">
          <p>We share your data with:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong className="text-[var(--text-primary)]">Store partners</strong> — the dry-cleaning store assigned to your order receives your name, address, and order details to fulfil the service.</li>
            <li><strong className="text-[var(--text-primary)]">Riders</strong> — receive your pickup/delivery address and contact number to complete the handover.</li>
            <li><strong className="text-[var(--text-primary)]">Payment processors</strong> — Razorpay receives the minimum data required to process your payment. We never store full card details.</li>
            <li><strong className="text-[var(--text-primary)]">SMS provider</strong> (MSG91) — to send OTP and notification messages to your phone.</li>
            <li><strong className="text-[var(--text-primary)]">Cloud infrastructure</strong> — MongoDB Atlas (database), Cloudinary (images), Upstash (queues) — all process data on our behalf under data processing agreements.</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>Order data is retained for 7 years for accounting and legal compliance. Account data is retained while your account is active and for 2 years after deactivation. You may request earlier deletion (see Section 8).</p>
        </Section>

        <Section title="7. Security">
          <p>We use industry-standard security measures including TLS encryption in transit, bcrypt/Argon2 hashing for credentials, and access-controlled cloud infrastructure. No method of transmission over the internet is 100% secure; we cannot guarantee absolute security.</p>
        </Section>

        <Section title="8. Your Rights">
          <p>Under the Digital Personal Data Protection Act 2023, you have the right to:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate personal data.</li>
            <li>Request erasure of your data (subject to legal retention requirements).</li>
            <li>Withdraw consent for marketing communications at any time.</li>
            <li>Nominate a representative to exercise these rights on your behalf.</li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href={`mailto:${EMAIL}`} className="text-[var(--gold)] underline-offset-2 hover:underline">{EMAIL}</a>. We will respond within 30 days.</p>
        </Section>

        <Section title="9. Cookies">
          <p>Our website uses only essential cookies required for authentication (HTTP-only secure session cookie). We do not use advertising or tracking cookies.</p>
        </Section>

        <Section title="10. Children's Privacy">
          <p>Our services are not directed to children under 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with data, contact us and we will delete it promptly.</p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via app notification or email. The effective date at the top of this page will always show when the policy was last revised.</p>
        </Section>

        <Section title="12. Contact Us">
          <p>For privacy questions or to exercise your rights:</p>
          <address className="not-italic space-y-1">
            <p>{BRAND}</p>
            <p>Greater Noida West, Uttar Pradesh 201009, India</p>
            <p><a href={`mailto:${EMAIL}`} className="text-[var(--gold)] underline-offset-2 hover:underline">{EMAIL}</a></p>
          </address>
        </Section>
      </GlassCard>

      <p className="text-center text-xs text-[var(--text-subtle)]">
        Also see our <a href="/terms" className="text-[var(--gold)] underline-offset-2 hover:underline">Terms of Service</a>.
      </p>
    </div>
  );
}
