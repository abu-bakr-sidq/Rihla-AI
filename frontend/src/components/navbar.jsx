import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ThemeToggle';

const NAVBAR_HEIGHT = 72;

function scrollToSection(id) {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
  window.scrollTo({ top, behavior: 'smooth' });
}

const NAV_LINKS = [
  { name: 'Home',         sectionId: 'home' },
  { name: 'AI Features',  sectionId: 'features' },
  { name: 'Packages',     sectionId: '/packages', isPage: true },
  { name: 'Benefits',     sectionId: 'benefits' },
  { name: 'Destinations', sectionId: 'destinations' },
  { name: 'AI Analysis',  sectionId: 'analysis' },
  { name: 'About',        sectionId: 'about' },
];

const Navbar = () => {
  const [location]       = useLocation();
  const [scrolled, setScrolled]         = useState(false);
  const [activeId, setActiveId]         = useState('home');
  const [mobileMenuOpen, setMobileOpen] = useState(false);

  /* Scroll tracking */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      if (location !== '/' && location !== '') return;
      const ids = NAV_LINKS.map(l => l.sectionId);
      let best = 'home', bestTop = Infinity;
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - NAVBAR_HEIGHT);
        if (rect.top <= NAVBAR_HEIGHT + 10 && dist < bestTop) { bestTop = dist; best = id; }
      });
      setActiveId(best);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location]);

  const isHomePage  = location === '/' || location === '' || location === '/about';
  const isAuthPage   = location.startsWith('/auth');

  const handleNavClick = useCallback((e, link) => {
    e.preventDefault();
    setMobileOpen(false);
    if (!isHomePage) { window.location.href = link.sectionId !== 'home' ? `/about#${link.sectionId}` : '/about'; return; }
    scrollToSection(link.sectionId);
  }, [isHomePage]);


  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 ${
        scrolled
          ? 'py-3 bg-background/85 backdrop-blur-xl shadow-[0_1px_0_hsl(var(--border)/0.5)]'
          : 'py-4 bg-transparent'
      }`}
    >
      <div className="w-full px-8 md:px-14 xl:px-20 flex items-center gap-8">

        {/* Logo with entrance animation */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/">
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              <BrandLogo size={36} titleClassName="text-shimmer-prismatic font-black tracking-tight" />
            </div>
          </Link>
        </motion.div>

        {/* Center nav links */}
        <div className="nav-links hidden lg:flex items-center justify-center gap-8 relative flex-shrink-0">

          {NAV_LINKS.map((link, i) => {
            if (link.isPage) {
              return (
                <Link key={link.name} href={link.sectionId}>
                  <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="relative px-1 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer"
                  >
                    {link.name}
                  </motion.div>
                </Link>
              );
            }
            const isActive = isHomePage && activeId === link.sectionId && link.sectionId !== 'home';
            return (
              <motion.a
                key={link.name}
                href={isHomePage ? `#${link.sectionId}` : `/#${link.sectionId}`}
                onClick={(e) => handleNavClick(e, link)}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`relative px-1 py-2 text-sm font-medium whitespace-nowrap group transition-all duration-300 ${isActive ? "text-shimmer-prismatic drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : "text-muted-foreground hover:text-foreground"}`}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
              >
                {link.name}

                {/* Active: gold underline with spring layoutId transition */}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-line"
                    className="absolute bottom-0 left-0 right-0 h-px bg-white/20"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {/* Active: gold glow bloom */}
                {isActive && (
                  <span
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full pointer-events-none"
                    style={{ background: 'hsl(var(--foreground))', filter: 'blur(6px)', opacity: 0.3 }}
                  />
                )}

                {/* Hover: faint gold underline (only when not active) */}
                {!isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ background: 'hsl(var(--foreground) / 0.3)' }}
                  />
                )}
                {/* Hover: soft glow bloom */}
                {!isActive && (
                  <span
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'hsl(var(--foreground) / 0.15)', filter: 'blur(5px)' }}
                  />
                )}
              </motion.a>
            );
          })}
        </div>

        {/* Right: ThemeToggle + CTA */}
        <motion.div
          className="flex-1 flex items-center gap-4 justify-end"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ThemeToggle />
          {!isAuthPage && (
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-foreground text-background font-semibold text-sm rounded-full relative overflow-hidden group"
              >
                {/* Shimmer effect on button */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <User className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Initiate Rihla</span>
              </motion.button>
            </Link>
          )}

          {/* Mobile toggle */}
          <motion.button
            className="lg:hidden text-foreground p-2"
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(!mobileMenuOpen)}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="p-8 flex flex-col gap-4">
              {NAV_LINKS.map((link, i) => {
                if (link.isPage) {
                  return (
                    <Link key={link.name} href={link.sectionId}>
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        onClick={() => setMobileOpen(false)}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {link.name}
                      </motion.div>
                    </Link>
                  );
                }
                return (
                 <motion.a
                   key={link.name}
                   href={`#${link.sectionId}`}
                   onClick={(e) => handleNavClick(e, link)}
                   initial={{ opacity: 0, x: -16 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.05, duration: 0.3 }}
                   className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                 >
                   {link.name}
                 </motion.a>
                );
              })}
              {!isAuthPage && (
                <Link href="/auth">
                  <button className="w-full py-3 bg-foreground text-background rounded-full font-semibold text-sm flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    Initiate Rihla
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
