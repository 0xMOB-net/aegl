import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Logo = () => (
  <svg width="32" height="36" viewBox="0 0 38 42" fill="none">
    <defs>
      <clipPath id="shieldSidebar">
        <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z"/>
      </clipPath>
    </defs>
    <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z" fill="#FCD116"/>
    <rect x="1" y="30" width="12" height="14" fill="#CE1126" clipPath="url(#shieldSidebar)"/>
    <rect x="13" y="30" width="12" height="14" fill="#FCD116" clipPath="url(#shieldSidebar)"/>
    <rect x="25" y="30" width="13" height="14" fill="#258553" clipPath="url(#shieldSidebar)"/>
    <text x="19" y="25" textAnchor="middle" fill="#0d3321" fontFamily="Georgia,serif" fontWeight="bold" fontSize="15">A</text>
  </svg>
);

const bureauNav = [
  { to: '/membres/admin/dashboard',  label: 'Tableau de bord', icon: '📊' },
  { to: '/membres/admin/dossiers',   label: 'Dossiers',         icon: '📁' },
  { to: '/membres/admin/alertes',    label: 'Alertes',          icon: '🔔' },
  { to: '/membres/admin/annonces',   label: 'Annonces',         icon: '📢' },
  { to: '/membres/admin/articles',   label: 'Articles',         icon: '✍️' },
  { to: '/membres/admin/hebergeurs', label: 'Hébergeurs',       icon: '🏠' },
  { to: '/membres/admin/activite',   label: 'Journal',          icon: '📋' },
  { to: '/membres/annonces',         label: 'Communauté',       icon: '💬' },
];

const hostNav = [
  { to: '/membres/hebergeur/dossiers',    label: 'Mes dossiers',  icon: '📁' },
  { to: '/membres/hebergeur/attestations',label: 'Attestations',  icon: '📄' },
  { to: '/membres/hebergeur/alertes',     label: 'Alertes',       icon: '🔔' },
  { to: '/membres/annonces',              label: 'Annonces',      icon: '💬' },
];

const studentNav = [
  { to: '/membres/etudiant/dossier', label: 'Mon dossier', icon: '📁' },
  { to: '/membres/etudiant/alertes', label: 'Alertes',     icon: '🔔' },
  { to: '/membres/annonces',         label: 'Annonces',    icon: '💬' },
];

export default function MemberLayout({ children, title }) {
  const { user, logout, roleName } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };
  const nav = user?.role === 'admin' ? bureauNav : user?.role === 'host' ? hostNav : studentNav;

  const roleColor = {
    admin:   'bg-gold-500/20 text-gold-500',
    host:    'bg-blue-500/20 text-blue-300',
    student: 'bg-green-500/20 text-green-300',
  }[user?.role] || 'bg-white/10 text-white';

  return (
    /* Verrouille la hauteur à 100vh — chaque colonne scroll indépendamment */
    <div className="h-screen bg-gray-50 flex overflow-hidden">

      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-green-950 flex-shrink-0 flex flex-col h-full shadow-2xl">

        {/* Logo — toujours visible */}
        <div className="p-5 border-b border-green-800/50 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex-shrink-0 group-hover:scale-105 transition-transform">
              <Logo/>
            </div>
            <div>
              <p className="text-white font-heading font-bold text-lg leading-none">AEGL</p>
              <p className="text-green-400 text-[10px] tracking-widest uppercase mt-0.5">Espace membres</p>
            </div>
          </Link>
        </div>

        {/* User info — toujours visible */}
        <div className="p-5 border-b border-green-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${roleColor}`}>
                {roleName(user)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation — zone scrollable indépendante */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-h-0">
          {nav.map(({ to, label, icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                active
                  ? 'bg-gold-500 text-green-950 font-bold shadow-gold'
                  : 'text-green-200 hover:bg-green-800/60 hover:text-white'
              }`}>
                <span className="text-base flex-shrink-0">{icon}</span>
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bas de sidebar — TOUJOURS VISIBLE, jamais scrollé */}
        <div className="p-3 border-t border-green-800/50 space-y-0.5 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-green-400 hover:bg-green-800/60 hover:text-white transition-all"
          >
            <span className="text-base flex-shrink-0">🌐</span>
            <span>Site public</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all"
          >
            <span className="text-base flex-shrink-0">🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar — toujours visible */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-gold-500 rounded-full"/>
            <h1 className="font-heading text-xl text-green-900">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className={`text-xs px-3 py-1 rounded-full font-medium ${roleColor} bg-opacity-100`}>
              {roleName(user)}
            </div>
          </div>
        </header>

        {/* Zone de contenu — scroll indépendant */}
        <main className="flex-1 overflow-y-auto min-h-0 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
