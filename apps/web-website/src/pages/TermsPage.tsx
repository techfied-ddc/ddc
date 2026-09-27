import React from 'react';
import { GlassCard } from '@ddc/ui';
import { useSeo } from '../lib/seo.js';

const EFFECTIVE_DATE = '1 September 2026';
const BRAND = 'Desire Premium Dry Cleaning';
const EMAIL = 'techfied.desiredrycleaning@gmail.com';
const PHONE = '+91 93158 22910';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="space-y-2 text-sm text-[var(--text-muted)] leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  useSeo({ title: `Terms of Service — ${BRAND}`, description: 'Terms and conditions for using Desire Premium Dry Cleaning services.' });

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      <div className="space-y-2">
        <p className="font-mono text-xs text-[var(--gold)] uppercase tracking-widest">Legal</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">Terms of Service</h1>
        <p className="text-sm text-[var(--text-subtle)]">Effective date: {EFFECTIVE_DATE}</p>
      </div>

      <GlassCard className="p-6 space-y-8">
        <Section title="1. Acceptance of Terms">
          <p>By placing an order or using the {BRAND} platform (website, customer app, or any related service), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
        </Section>

        <Section title="2. Services">
          <p>We provide dry-cleaning, laundry, and garment-care services with home pickup and delivery across our service areas in Greater Noida West and surrounding pincodes.</p>
          <p>Services are available subject to pincode coverage. We reserve the right to modify, suspend, or discontinue any service at any time with reasonable notice.</p>
        </Section>

        <Section title="3. Orders & Pricing">
          <p><strong className="text-[var(--text-primary)]">Estimates vs. binding invoices.</strong> Prices shown at checkout are estimates based on the catalog. The binding invoice is issued by the store after physical inspection of your garments. You will be notified of the final price before payment is processed.</p>
          <p><strong className="text-[var(--text-primary)]">Payment modes.</strong> We accept Online payment (Razorpay) and Cash on Delivery (COD). For COD, payment is collected at delivery.</p>
          <p><strong className="text-[var(--text-primary)]">Coupons.</strong> Promotional coupons are subject to their individual terms and expiry dates. Only one coupon may be applied per order.</p>
        </Section>

        <Section title="4. Pickup & Delivery">
          <p>You must be available at the selected pickup address during the chosen time slot. A 4–6 digit handover OTP is required to hand garments to the rider at pickup and to receive them at delivery. This OTP is sent to your registered phone number.</p>
          <p>We are not responsible for missed pickups due to customer unavailability. Rescheduling may be subject to slot availability.</p>
        </Section>

        <Section title="5. Garment Care & Liability">
          <p>We handle all garments with professional care. However, we cannot be liable for pre-existing damage, fabric defects, colour bleeding inherent to the garment, or damage caused by care-label non-compliance.</p>
          <p>Claims for damaged or lost garments must be raised within 48 hours of delivery via a support ticket in the app or by contacting us at <a href={`mailto:${EMAIL}`} className="text-[var(--gold)] underline-offset-2 hover:underline">{EMAIL}</a>.</p>
          <p>Our maximum liability for any single garment is limited to ten times the cleaning charge for that garment, not exceeding ₹5,000.</p>
        </Section>

        <Section title="6. Cancellations & Refunds">
          <p>Orders may be cancelled before the rider reaches your location for pickup. Once garments are picked up, cancellation is at the store&apos;s discretion.</p>
          <p>Refunds for online payments are processed within 5–7 business days to the original payment method. COD orders are refunded via bank transfer after verification.</p>
        </Section>

        <Section title="7. User Accounts">
          <p>You are responsible for maintaining the confidentiality of your account. Notify us immediately of any unauthorised use at <a href={`tel:${PHONE.replace(/\s/g,'')}`} className="text-[var(--gold)] underline-offset-2 hover:underline">{PHONE}</a>.</p>
          <p>We reserve the right to suspend accounts that violate these terms or are involved in fraudulent activity.</p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>All content on this platform — including the {BRAND} brand, logo, design, text, and images — is the property of Desire Premium Dry Cleaning or its licensors. You may not reproduce, distribute, or create derivative works without written permission.</p>
        </Section>

        <Section title="9. Privacy">
          <p>Your use of our services is also governed by our <a href="/privacy" className="text-[var(--gold)] underline-offset-2 hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>
        </Section>

        <Section title="10. Governing Law">
          <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Greater Noida, Uttar Pradesh.</p>
        </Section>

        <Section title="11. Contact">
          <p>For questions about these Terms, contact us at:</p>
          <address className="not-italic space-y-1">
            <p>{BRAND}</p>
            <p>Greater Noida West, Uttar Pradesh 201009</p>
            <p><a href={`mailto:${EMAIL}`} className="text-[var(--gold)] underline-offset-2 hover:underline">{EMAIL}</a></p>
            <p><a href={`tel:${PHONE.replace(/\s/g,'')}`} className="text-[var(--gold)] underline-offset-2 hover:underline">{PHONE}</a></p>
          </address>
        </Section>
      </GlassCard>
    </div>
  );
}
