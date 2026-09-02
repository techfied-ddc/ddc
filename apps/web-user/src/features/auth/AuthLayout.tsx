import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/auth.store.js';
import { useLiquidGlass } from '@ddc/ui';

export default function AuthLayout() {
  const user     = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const canvasRef = useLiquidGlass({ intensity: 0.05 });

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-void)] relative overflow-hidden px-5 py-10">
      {/* Liquid-glass ambient canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand wordmark */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        >
          <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--gold)] uppercase mb-2">
            Desire Premium
          </p>
          <h1 className="font-display text-3xl font-light text-[var(--text-primary)] leading-tight">
            Dry Cleaning
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Your finest pieces, returned immaculate.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.2, 0, 0, 1] }}
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
