import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const TYPE_ICONS = {
  course_invite:        '📨',
  class_invite:         '📨',
  enrollment_request:   '📋',
  join_request:         '📋',
  enrollment_approved:  '✅',
  enrollment_rejected:  '❌',
  class_approved:       '✅',
  class_rejected:       '❌',
  new_dossier:          '📁',
  host_assigned:        '🏠',
  docs_verified:        '✅',
  docs_rejected:        '❌',
  dossier_attestation:  '📄',
  dossier_ready:        '🎉',
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return 'à l\'instant';
  if (mins < 60)   return `il y a ${mins} min`;
  if (hours < 24)  return `il y a ${hours}h`;
  if (days < 7)    return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function NotificationBell() {
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef   = useRef(null);
  const navigate  = useNavigate();

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifs(res.data.notifications || []);
      setUnread(res.data.unreadCount   || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifs(n => n.map(x => ({ ...x, read: true })));
      setUnread(0);
    } catch {} finally { setLoading(false); }
  };

  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs(n => n.filter(x => x.id !== id));
      setUnread(u => {
        const wasUnread = notifs.find(x => x.id === id)?.read === false;
        return wasUnread ? Math.max(0, u - 1) : u;
      });
    } catch {}
  };

  const handleClick = async (notif) => {
    if (!notif.read) await markRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{unread} non lue{unread > 1 ? 's' : ''}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} disabled={loading}
                className="text-xs text-green-700 hover:text-green-900 font-medium disabled:opacity-40">
                Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-2xl mb-1">🔕</p>
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors group ${!n.read ? 'bg-blue-50/50' : ''}`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug truncate ${!n.read ? 'font-semibold text-gray-800' : 'font-medium text-gray-700'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" title="Non lue" />
                  )}
                  <button
                    onClick={(e) => deleteNotif(e, n.id)}
                    className="text-gray-300 hover:text-red-400 text-base leading-none px-1"
                    title="Supprimer"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
