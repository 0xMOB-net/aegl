import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Logo = ({ light = false }) => (
  <svg width="38" height="42" viewBox="0 0 38 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="shieldNav">
        <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z"/>
      </clipPath>
      <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1f7046"/>
        <stop offset="100%" stopColor="#0d3321"/>
      </linearGradient>
    </defs>
    <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z" fill="url(#shieldGrad)" stroke="#258553" strokeWidth="0.5"/>
    <rect x="1" y="30" width="12" height="14" fill="#CE1126" clipPath="url(#shieldNav)"/>
    <rect x="13" y="30" width="12" height="14" fill="#FCD116" clipPath="url(#shieldNav)"/>
    <rect x="25" y="30" width="13" height="14" fill="#258553" clipPath="url(#shieldNav)"/>
    <text x="19" y="25" textAnchor="middle" fill="white" fontFamily="Georgia,serif" fontWeight="bold" fontSize="15">A</text>
  </svg>
);

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const { user }                  = useAuth();
  const location                  = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const links = [
    { to: '/',          label: 'Accueil' },
    { to: '/a-propos',  label: 'À propos' },
    { to: '/services',  label: 'Nos services' },
    { to: '/actualites',label: 'Actualités' },
    { to: '/contact',   label: 'Contact' },
  ];

  const isActive = (to) => location.pathname === to;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg py-2'
        : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex-shrink-0 drop-shadow-lg group-hover:scale-105 transition-transform duration-200">
            <Logo />
          </div>
          <div>
            <span className={`font-heading font-bold text-xl leading-none block transition-colors ${scrolled ? 'text-green-900' : 'text-white'}`}>
              AEGL
            </span>
            <span className={`text-[10px] leading-none tracking-widest uppercase font-medium transition-colors ${scrolled ? 'text-green-600' : 'text-green-200'}`}>
              Limoges
            </span>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link key={to} to={to} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive(to)
                ? 'bg-green-800 text-white shadow-sm'
                : scrolled
                  ? 'text-gray-700 hover:bg-green-50 hover:text-green-800'
                  : 'text-white/90 hover:bg-white/15 hover:text-white'
            }`}>
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link to="/membres" className="btn-gold text-sm py-2.5 px-5">
              Mon espace →
            </Link>
          ) : (
            <>
              <Link to="/login" className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${
                scrolled
                  ? 'text-green-800 hover:bg-green-50'
                  : 'text-white hover:bg-white/15'
              }`}>
                Connexion
              </Link>
              <Link to="/inscription" className="btn-gold text-sm py-2.5 px-5">
                S'inscrire
              </Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden p-2 rounded-xl transition-colors ${
            scrolled ? 'text-green-800 hover:bg-green-50' : 'text-white hover:bg-white/15'
          }`}
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          )}
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-xl animate-slide-up">
          <div className="px-6 py-5 flex flex-col gap-1">
            {links.map(({ to, label }) => (
              <Link key={to} to={to} className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive(to) ? 'bg-green-800 text-white' : 'text-gray-700 hover:bg-green-50 hover:text-green-800'
              }`}>
                {label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-3 pt-4 flex flex-col gap-2">
              {user ? (
                <Link to="/membres" className="btn-gold justify-center text-sm">Mon espace →</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary justify-center text-sm">Connexion</Link>
                  <Link to="/inscription" className="btn-gold justify-center text-sm">S'inscrire</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
