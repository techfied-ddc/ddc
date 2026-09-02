import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@ddc/ui';

const LINKS = [
  { to: '/',         label: 'Home',     end: true  },
  { to: '/services', label: 'Services', end: false },
  { to: '/about',    label: 'About',    end: false },
  { to: '/contact',  label: 'Contact',  end: false },
] as const;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-[rgba(11,11,12,0.92)] backdrop-blur-2xl border-b border-[var(--border)]'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 px-4 py-2 bg-gold text-void rounded-lg text-sm font-semibold z-[100]"
      >
        Skip to content
      </a>

      <nav
        aria-label="Main navigation"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
      >
        {/* Logo */}
        <Link to="/" className="flex flex-col leading-none select-none group">
          <span className="font-display text-[22px] text-chalk tracking-tight group-hover:text-gold-bright transition-colors duration-200">
            Desire
          </span>
          <span className="text-[10px] text-silver tracking-[0.2em] uppercase">
            Premium Dry Cleaning
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-7" role="list">
          {LINKS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors duration-200',
                    isActive ? 'text-gold' : 'text-silver hover:text-chalk',
                  )
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3">
          <a
            href="https://user.desiredrycleaning.in"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-gold hover:bg-gold-bright text-void text-sm font-semibold transition-colors duration-200"
          >
            Book a Pickup
          </a>
          <button
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="md:hidden p-2 rounded-lg text-silver hover:text-chalk hover:bg-iron transition-colors"
          >
            {open ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 4l12 12M16 4L4 16"/>
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h14M3 12h14M3 18h14"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-[rgba(17,17,20,0.97)] backdrop-blur-2xl border-b border-[var(--border)]"
          >
            <ul className="px-4 py-3 flex flex-col gap-1">
              {LINKS.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'block px-3 py-3 rounded-lg text-[15px] font-medium transition-colors',
                        isActive
                          ? 'bg-iron text-gold'
                          : 'text-silver hover:bg-iron hover:text-chalk',
                      )
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
              <li className="pt-2 mt-1 border-t border-[var(--border-muted)]">
                <a
                  href="https://user.desiredrycleaning.in"
                  className="block px-3 py-3 rounded-lg bg-gold hover:bg-gold-bright text-void text-[15px] font-semibold text-center transition-colors"
                >
                  Book a Pickup
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
