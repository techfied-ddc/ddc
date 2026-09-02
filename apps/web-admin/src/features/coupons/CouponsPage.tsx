import React from 'react';
import { GlassCard, Reveal } from '@ddc/ui';

export default function CouponsPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Reveal><h1 className="font-display text-2xl text-[var(--text-primary)]">Coupons</h1></Reveal>
      <Reveal delay={0.06}>
        <GlassCard className="p-5">
          <p className="text-sm text-[var(--text-muted)]">Coupon creation, usage limits & discount management — Phase 2.</p>
        </GlassCard>
      </Reveal>
    </div>
  );
}
