import { Link } from 'react-router-dom';

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 9a19.79 19.79 0 01-3.07-8.67A2 2 0 012.88 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
      <path d="M12 21s-7-6.5-7-11a7 7 0 1114 0c0 4.5-7 11-7 11z"/>
      <circle cx="12" cy="10" r="2"/>
    </svg>
  );
}

const PAGES: [string, string][] = [
  ['/', 'Home'],
  ['/services', 'Services'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

export default function Footer() {
  return (
    <footer className="bg-onyx border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="sm:col-span-2">
          <p className="font-display text-2xl text-chalk mb-0.5">Desire</p>
          <p className="text-[10px] text-slate tracking-[0.2em] uppercase mb-4">Premium Dry Cleaning</p>
          <p className="text-sm text-silver max-w-xs mb-5 leading-relaxed">
            Professional dry cleaning delivered to your door. Pickup &amp; delivery across Greater Noida West.
          </p>
          <address className="not-italic flex flex-col gap-2.5 text-sm text-silver">
            <a href="tel:+919315822910" className="flex items-center gap-2 hover:text-gold transition-colors duration-200">
              <PhoneIcon /> +91 93158 22910
            </a>
            <a href="mailto:techfied.desiredrycleaning@gmail.com" className="flex items-center gap-2 hover:text-gold transition-colors duration-200 break-all">
              <MailIcon /> techfied.desiredrycleaning@gmail.com
            </a>
            <span className="flex items-start gap-2">
              <MapIcon /> Greater Noida West, UP&nbsp;201009
            </span>
          </address>
        </div>

        {/* Pages */}
        <div>
          <h2 className="text-xs text-slate tracking-widest uppercase mb-4">Pages</h2>
          <ul className="flex flex-col gap-2.5 text-sm text-silver">
            {PAGES.map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-gold transition-colors duration-200">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick access */}
        <div>
          <h2 className="text-xs text-slate tracking-widest uppercase mb-4">Quick Access</h2>
          <ul className="flex flex-col gap-2.5 text-sm text-silver">
            <li>
              <a href="https://user.desiredrycleaning.in" className="hover:text-gold transition-colors duration-200">
                Book a Pickup ↗
              </a>
            </li>
            <li>
              <a href="https://user.desiredrycleaning.in/orders" className="hover:text-gold transition-colors duration-200">
                Track Your Order ↗
              </a>
            </li>
            <li>
              <a href="https://store.desiredrycleaning.in" className="hover:text-gold transition-colors duration-200">
                Store Login ↗
              </a>
            </li>
            <li>
              <a href="https://admin.desiredrycleaning.in" className="hover:text-gold transition-colors duration-200">
                Admin Panel ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border-muted)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate">
          <span>© {new Date().getFullYear()} Desire Premium Dry Cleaning. All rights reserved.</span>
          <span className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-gold transition-colors duration-200">Terms</Link>
            <Link to="/privacy" className="hover:text-gold transition-colors duration-200">Privacy</Link>
            <span>Greater Noida West, Uttar Pradesh, India</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
