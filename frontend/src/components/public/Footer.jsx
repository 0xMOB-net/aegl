import { Link } from 'react-router-dom';

const Logo = () => (
  <svg width="36" height="40" viewBox="0 0 38 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="shieldFoot">
        <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z"/>
      </clipPath>
    </defs>
    <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z" fill="#FCD116"/>
    <rect x="1" y="30" width="12" height="14" fill="#CE1126" clipPath="url(#shieldFoot)"/>
    <rect x="13" y="30" width="12" height="14" fill="#FCD116" clipPath="url(#shieldFoot)"/>
    <rect x="25" y="30" width="13" height="14" fill="#258553" clipPath="url(#shieldFoot)"/>
    <text x="19" y="25" textAnchor="middle" fill="#0d3321" fontFamily="Georgia,serif" fontWeight="bold" fontSize="15">A</text>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-green-950 text-white">
      {/* Bande drapeau */}
      <div className="flag-stripe"/>

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid md:grid-cols-12 gap-10 mb-14">

          {/* Branding */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <Logo/>
              <div>
                <span className="font-heading font-bold text-2xl block text-white">AEGL</span>
                <span className="text-green-400 text-xs tracking-wide">Association des Étudiants Guinéens de Limoges</span>
              </div>
            </div>
            <p className="text-green-300/80 text-sm leading-relaxed max-w-sm mb-6">
              Depuis notre création, nous accompagnons les étudiants guinéens dans leur
              installation et leur réussite académique à Limoges. <span className="text-gold-500 font-medium">Solidarité, Entraide, Réussite.</span>
            </p>

            {/* Réseaux sociaux */}
            <div className="flex gap-3">
              <a href="mailto:contact@aegl87.fr"
                className="w-10 h-10 rounded-xl bg-green-800 hover:bg-green-700 flex items-center justify-center transition-colors group"
                title="Email">
                <svg className="w-4 h-4 text-green-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/share/p/1b3pzu8akb/" target="_blank" rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-green-800 hover:bg-blue-700 flex items-center justify-center transition-colors group"
                title="Facebook">
                <svg className="w-4 h-4 text-green-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-green-800 hover:bg-pink-700 flex items-center justify-center transition-colors group"
                title="Instagram">
                <svg className="w-4 h-4 text-green-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3">
            <h4 className="font-semibold text-gold-500 mb-5 text-xs uppercase tracking-widest">Navigation</h4>
            <ul className="space-y-3">
              {[
                { to: '/',           label: 'Accueil' },
                { to: '/a-propos',   label: 'À propos' },
                { to: '/services',   label: 'Nos services' },
                { to: '/actualites', label: 'Actualités' },
                { to: '/contact',    label: 'Contact' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-green-300/80 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-gold-500/40 rounded-full group-hover:bg-gold-500 transition-colors"/>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Accès rapide */}
          <div className="md:col-span-4">
            <h4 className="font-semibold text-gold-500 mb-5 text-xs uppercase tracking-widest">Contact & Accès</h4>
            <ul className="space-y-3 text-sm mb-7">
              <li className="flex items-center gap-2.5 text-green-300/80">
                <span className="text-base">📧</span>
                <a href="mailto:contact@aegl87.fr" className="hover:text-white transition-colors">contact@aegl87.fr</a>
              </li>
              <li className="flex items-start gap-2.5 text-green-300/80">
                <span className="text-base mt-0.5">📍</span>
                <span>185 avenue Albert Thomas,<br/>87000 Limoges, France</span>
              </li>
              <li className="flex items-center gap-2.5 text-green-300/80">
                <span className="text-base">🏛️</span>
                <span>Université de Limoges</span>
              </li>
            </ul>
            <Link to="/membres" className="btn-gold text-sm py-2.5 px-5 w-full justify-center">
              Espace membres →
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-green-800/60 pt-7 flex flex-col sm:flex-row justify-between items-center gap-4 text-green-500/70 text-xs">
          <p>© {new Date().getFullYear()} AEGL — Tous droits réservés</p>
          <p className="flex items-center gap-1">
            Fait avec <span className="text-red-500">♥</span> à Limoges, France 🇬🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
