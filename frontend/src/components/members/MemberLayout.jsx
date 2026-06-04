import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

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
  { to: '/membres/admin/articles',   label: 'Articles',         icon: '✍️' },
  { to: '/membres/admin/collectes',  label: 'Collectes',        icon: '💚' },
  { to: '/membres/admin/hebergeurs', label: 'Utilisateurs',     icon: '👥' },
  { to: '/membres/admin/activite',   label: 'Journal',          icon: '📋' },
  { to: '/membres/admin/messagerie', label: 'Messagerie',       icon: '✉️', unread: true },
];

const hostNav = [
  { to: '/membres/hebergeur/dossiers',     label: 'Mes dossiers', icon: '📁' },
  { to: '/membres/hebergeur/attestations', label: 'Attestations', icon: '📄' },
  { to: '/membres/hebergeur/alertes',      label: 'Alertes',      icon: '🔔' },
  { to: '/membres/hebergeur/profil',       label: 'Mon profil',   icon: '🏠' },
  { to: '/membres/messagerie',             label: 'Messagerie',   icon: '✉️', unread: true },
];

const studentNav = [
  { to: '/membres/etudiant/dossier', label: 'Mon dossier', icon: '📁' },
  { to: '/membres/etudiant/alertes', label: 'Alertes',     icon: '🔔' },
  { to: '/membres/messagerie',       label: 'Messagerie',  icon: '✉️', unread: true },
];

export default function MemberLayout({ children, title }) {
  const { user, logout, roleName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const endpoint = user.role === 'admin' ? '/messages/admin/unread-count' : '/messages/unread-count';
      const res = await api.get(endpoint);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Reset badge quand on arrive sur la page messagerie
  useEffect(() => {
    const isOnMsg = location.pathname.includes('messagerie');
    if (isOnMsg) setTimeout(fetchUnread, 2000);
  }, [location.pathname, fetchUnread]);

  const handleLogout = () => { logout(); navigate('/'); };
  const nav = user?.role === 'admin' ? bureauNav : user?.role === 'host' ? hostNav : studentNav;

  const roleColor = {
    admin:   'bg-gold-500/20 text-gold-500',
    host:    'bg-blue-500/20 text-blue-300',
    student: 'bg-green-500/20 text-green-300',
  }[user?.role] || 'bg-white/10 text-white';

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-50 w-64 bg-green-950 flex flex-col shadow-2xl
        transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:flex-shrink-0
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 border-b border-green-800/50 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <div className="flex-shrink-0 group-hover:scale-105 transition-transform">
              <Logo />
            </div>
            <div>
              <p className="text-white font-heading font-bold text-lg leading-none">AEGL</p>
              <p className="text-green-400 text-[10px] tracking-widest uppercase mt-0.5">Espace membres</p>
            </div>
          </Link>
        </div>

        <div className="p-5 border-b border-green-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${roleColor}`}>
                {roleName(user)}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-h-0">
          {nav.map(({ to, label, icon, unread }) => {
            const active = location.pathname === to;
            const showBadge = unread && unreadCount > 0;
            return (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  active
                    ? 'bg-gold-500 text-green-950 font-bold shadow-gold'
                    : 'text-green-200 hover:bg-green-800/60 hover:text-white'
                }`}>
                <span className="text-base flex-shrink-0">{icon}</span>
                <span className="truncate flex-1">{label}</span>
                {showBadge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 min-w-[18px] text-center ${
                    active ? 'bg-green-950 text-gold-500' : 'bg-red-500 text-white'
                  }`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-green-800/50 space-y-0.5 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-green-400 hover:bg-green-800/60 hover:text-white transition-all">
            <span className="text-base flex-shrink-0">🌐</span>
            <span>Site public</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all">
            <span className="text-base flex-shrink-0">🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2 rounded-xl text-green-800 hover:bg-green-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <div className="w-1 h-7 bg-gold-500 rounded-full hidden md:block"/>
            <h1 className="font-heading text-lg md:text-xl text-green-900 truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className={`text-xs px-3 py-1 rounded-full font-medium ${roleColor}`}>
              {roleName(user)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
