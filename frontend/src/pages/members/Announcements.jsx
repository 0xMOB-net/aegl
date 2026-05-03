import { useState, useEffect } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function MemberAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [comments, setComments] = useState({});
  const [sending, setSending] = useState({});

  useEffect(() => {
    api.get('/announcements').then(r => setAnnouncements(r.data.announcements || [])).finally(() => setLoading(false));
  }, []);

  const handleReact = async (id) => {
    try {
      const res = await api.post(`/announcements/${id}/react`);
      setAnnouncements(prev => prev.map(a => {
        if (a.id !== id) return a;
        const count = a._count?.reactions || 0;
        return { ...a, _count: { ...a._count, reactions: res.data.reacted ? count + 1 : Math.max(0, count - 1) } };
      }));
    } catch (err) { console.error(err); }
  };

  const loadComments = async (id) => {
    if (comments[id]) {
      setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
      return;
    }
    try {
      const res = await api.get(`/announcements/${id}/comments`);
      setComments(prev => ({ ...prev, [id]: res.data.comments || [] }));
      setOpenComments(prev => ({ ...prev, [id]: true }));
    } catch (err) { console.error(err); }
  };

  const handleComment = async (id) => {
    const text = commentTexts[id]?.trim();
    if (!text) return;
    setSending(prev => ({ ...prev, [id]: true }));
    try {
      const res = await api.post(`/announcements/${id}/comments`, { content: text });
      setComments(prev => ({ ...prev, [id]: [...(prev[id] || []), res.data.comment] }));
      setCommentTexts(prev => ({ ...prev, [id]: '' }));
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, _count: { ...a._count, comments: (a._count?.comments || 0) + 1 } } : a));
    } catch (err) { console.error(err); }
    finally { setSending(prev => ({ ...prev, [id]: false })); }
  };

  const audienceLabel = (a) => ({ all: '👥 Tous', students: '🎓 Étudiants', hosts: '🏠 Hébergeurs' }[a] || a);
  const roleLabel = (role) => ({ admin: 'Bureau AEGL', host: 'Hébergeur', student: 'Étudiant' }[role] || role);

  return (
    <MemberLayout title="Annonces internes">
      <div className="space-y-6 animate-fade-in max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : announcements.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">📢</p>
            <p className="text-gray-500 font-medium">Aucune annonce</p>
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className={`card ${a.pinned ? 'border-l-4 border-gold-500' : ''}`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {a.pinned && <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-medium">📌 Épinglé</span>}
                    <span className="text-xs text-gray-400">{audienceLabel(a.audience)}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(a.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg text-green-900">{a.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Par {a.author?.firstName} {a.author?.lastName} — {roleLabel('admin')}</p>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{a.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleReact(a.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 transition-colors group"
                >
                  <span className="group-hover:scale-125 transition-transform">👍</span>
                  <span className="font-medium">{a._count?.reactions || 0}</span>
                </button>
                <button
                  onClick={() => loadComments(a.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 transition-colors"
                >
                  <span>💬</span>
                  <span className="font-medium">{a._count?.comments || 0} commentaire{(a._count?.comments || 0) > 1 ? 's' : ''}</span>
                  <span className="text-xs text-gray-400">{openComments[a.id] ? '▲' : '▼'}</span>
                </button>
              </div>

              {/* Comments section */}
              {openComments[a.id] && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fade-in">
                  {/* Existing comments */}
                  {(comments[a.id] || []).length === 0 ? (
                    <p className="text-gray-400 text-sm italic">Aucun commentaire. Soyez le premier !</p>
                  ) : (
                    (comments[a.id] || []).map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                          {c.author?.firstName?.[0]}{c.author?.lastName?.[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{c.author?.firstName} {c.author?.lastName}</span>
                            <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* New comment input */}
                  <div className="flex gap-3 mt-3">
                    <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center text-xs font-bold text-gold-400 flex-shrink-0">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={commentTexts[a.id] || ''}
                        onChange={e => setCommentTexts(prev => ({ ...prev, [a.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleComment(a.id)}
                        placeholder="Écrire un commentaire..."
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                      <button
                        onClick={() => handleComment(a.id)}
                        disabled={sending[a.id] || !commentTexts[a.id]?.trim()}
                        className="btn-primary text-xs px-4 py-2"
                      >
                        {sending[a.id] ? '...' : 'Envoyer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </MemberLayout>
  );
}
