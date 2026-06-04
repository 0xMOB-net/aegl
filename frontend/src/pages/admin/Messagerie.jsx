import { useState, useEffect, useRef, useCallback } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const fmt = (d) => {
  const now = new Date();
  const date = new Date(d);
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const fmtFull = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const ROLE_LBL  = { student: 'Étudiant', host: 'Hébergeur', admin: 'Admin' };
const ROLE_COLOR = { student: 'text-blue-500', host: 'text-amber-500', admin: 'text-green-600' };

const AUDIENCE_LBL   = { all: 'Tous les membres', students: 'Étudiants', hosts: 'Hébergeurs' };
const AUDIENCE_ICON  = { all: '👥', students: '🎓', hosts: '🏠' };
const AUDIENCE_COLOR = { all: 'bg-green-100 text-green-800', students: 'bg-blue-100 text-blue-800', hosts: 'bg-amber-100 text-amber-800' };

/* ── Coches de lecture ── */
function ReadTick({ readAt }) {
  if (readAt) {
    return <span className="text-[10px] text-[#4fc3f7] font-bold ml-1">✓✓</span>;
  }
  return <span className="text-[10px] text-gray-400 ml-1">✓</span>;
}

function Avatar({ user, size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-green-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {user?.firstName?.[0]}{user?.lastName?.[0]}
    </div>
  );
}

/* ── Conversation ── */
function Conversation({ thread, adminId, onNewMessage, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMsgs = useCallback(async (silent = false) => {
    try {
      const res = await api.get(`/messages/admin/thread/${thread.memberId}`);
      setMessages(res.data.messages || []);
    } catch {}
    finally { if (!silent) setLoading(false); }
  }, [thread.memberId]);

  useEffect(() => {
    setLoading(true); setMessages([]);
    fetchMsgs();
    pollRef.current = setInterval(() => fetchMsgs(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchMsgs]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if ((!text.trim() && !file) || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('content', text.trim());
      if (file) fd.append('file', file);
      const res = await api.post(`/messages/admin/reply/${thread.memberId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const msg = res.data.message;
      setMessages(p => [...p, msg]);
      onNewMessage(msg, thread.memberId, thread.member);
      setText(''); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {}
    finally { setSending(false); }
  };

  const isMe = (msg) => msg.senderId === adminId;

  return (
    <div className="flex flex-col h-full bg-[#efeae2]">
      {/* Header */}
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-white/80 hover:text-white text-xl mr-1 leading-none">←</button>
        )}
        <Avatar user={thread.member} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white text-sm truncate">{thread.member?.firstName} {thread.member?.lastName}</p>
          <p className="text-xs text-white/60 truncate">{ROLE_LBL[thread.member?.role]}</p>
        </div>
        <button onClick={() => fetchMsgs()} className="text-white/60 hover:text-white text-sm">🔄</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-1.5">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="bg-white/80 rounded-xl px-4 py-2 text-xs text-gray-500 text-center">
              Démarrez la conversation avec {thread.member?.firstName}
            </div>
          </div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[72%] rounded-lg px-3 py-1.5 shadow-sm ${
              isMe(msg) ? 'bg-[#dcf8c6] rounded-tr-sm' : 'bg-white rounded-tl-sm'
            }`}>
              {msg.content && <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
              {msg.fileName && (
                <a href={msg.viewUrl || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-1 text-xs text-green-700 underline">
                  📎 <span className="truncate max-w-[140px]">{msg.fileName}</span> ↗
                </a>
              )}
              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                <p className="text-[10px] text-gray-400">{fmtFull(msg.createdAt)}</p>
                {isMe(msg) && <ReadTick readAt={msg.readAt} />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {file && (
        <div className="mx-3 mb-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 flex-shrink-0">
          📎 <span className="flex-1 truncate">{file.name}</span>
          <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-400 font-bold">✕</button>
        </div>
      )}

      {/* Input */}
      <div className="bg-[#f0f0f0] px-3 py-2 flex gap-2 items-end flex-shrink-0">
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id={`af-${thread.memberId}`}
          onChange={e => setFile(e.target.files?.[0] || null)} />
        <label htmlFor={`af-${thread.memberId}`}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-500 hover:text-green-700 cursor-pointer shadow-sm flex-shrink-0">
          📎
        </label>
        <textarea value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Écrire un message…" rows={1}
          className="flex-1 rounded-2xl border-0 px-4 py-2 text-sm focus:outline-none resize-none shadow-sm"
          style={{ minHeight: '38px', maxHeight: '96px' }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'; }} />
        <button onClick={send} disabled={(!text.trim() && !file) || sending}
          className="w-9 h-9 rounded-full bg-[#075e54] text-white flex items-center justify-center hover:bg-[#054d44] transition-colors disabled:opacity-40 flex-shrink-0 shadow-sm">
          {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <span className="text-sm leading-none">➤</span>}
        </button>
      </div>
    </div>
  );
}

/* ── Modal nouvelle conversation ── */
function NewChatModal({ onClose, onSelect, existingIds }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, hRes] = await Promise.all([
          api.get('/admin/students'),
          api.get('/admin/hosts'),
        ]);
        const all = [...(sRes.data.students || []), ...(hRes.data.hosts || [])];
        setMembers(all.sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)));
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl">✕</button>
          <h3 className="text-white font-semibold text-sm">Nouvelle conversation</h3>
        </div>
        <div className="px-3 py-2 border-b border-gray-100">
          <input autoFocus type="text" placeholder="Rechercher un membre…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Aucun membre trouvé</p>
          ) : filtered.map(m => (
            <button key={m.id} onClick={() => onSelect(m)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
              <Avatar user={m} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{m.firstName} {m.lastName}</p>
                <p className={`text-xs truncate ${ROLE_COLOR[m.role]}`}>{ROLE_LBL[m.role]}</p>
              </div>
              {existingIds.has(m.id) && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Actif</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Panneau Diffusion ── */
function BroadcastPanel() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('all');
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const loadBC = useCallback(async () => {
    try { const r = await api.get('/messages/admin/broadcasts'); setBroadcasts(r.data.broadcasts || []); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBC(); }, [loadBC]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette diffusion ?')) return;
    try {
      await api.delete(`/messages/admin/broadcast/${id}`);
      setBroadcasts(p => p.filter(b => b.id !== id));
    } catch {}
  };

  const send = async () => {
    if ((!content.trim() && !file) || sending) return;
    setSending(true); setError(null);
    try {
      const fd = new FormData();
      if (content.trim()) fd.append('content', content.trim());
      fd.append('audience', audience);
      if (file) fd.append('file', file);
      const res = await api.post('/messages/admin/broadcast', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBroadcasts(p => [res.data.broadcast, ...p]);
      setContent(''); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">📢 Nouveau message diffusé</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {Object.entries(AUDIENCE_LBL).map(([v, lbl]) => (
            <button key={v} onClick={() => setAudience(v)}
              className={`px-2 py-2.5 rounded-xl text-xs font-medium border transition-all text-center ${
                audience === v ? 'bg-[#075e54] text-white border-[#075e54]' : 'bg-white text-gray-600 border-gray-200 hover:border-green-500'
              }`}>
              {AUDIENCE_ICON[v]} {lbl}
            </button>
          ))}
        </div>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Message pour les membres…" rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none mb-2" />
        {file && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-2 text-xs text-green-700">
            📎 <span className="flex-1 truncate">{file.name}</span>
            <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-400 font-bold">✕</button>
          </div>
        )}
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        {success && <p className="text-green-700 text-xs mb-2 font-medium">✅ Diffusé !</p>}
        <div className="flex gap-2">
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="bc-file-adm"
              onChange={e => setFile(e.target.files?.[0] || null)} />
            <label htmlFor="bc-file-adm"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-700 cursor-pointer transition-colors">📎</label>
          </div>
          <button onClick={send} disabled={(!content.trim() && !file) || sending}
            className="flex-1 py-2.5 rounded-xl bg-[#075e54] text-white text-sm font-medium hover:bg-[#054d44] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📢'}
            Diffuser
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Historique</h3>
        {loading ? (
          <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" /></div>
        ) : broadcasts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Aucune diffusion.</p>
        ) : (
          <ul className="space-y-3">
            {broadcasts.map(b => (
              <li key={b.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AUDIENCE_COLOR[b.audience]}`}>
                    {AUDIENCE_ICON[b.audience]} {AUDIENCE_LBL[b.audience]}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{fmtFull(b.createdAt)}</span>
                  <button onClick={() => handleDelete(b.id)}
                    className="w-6 h-6 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-xs transition-colors">🗑</button>
                </div>
                {b.content && <p className="text-sm text-gray-700 whitespace-pre-wrap">{b.content}</p>}
                {b.fileName && (
                  <a href={b.viewUrl || '#'} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-green-700 underline">
                    📎 <span className="truncate max-w-[180px]">{b.fileName}</span> ↗
                  </a>
                )}
                {Object.keys(b.reactionCounts || {}).length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {Object.entries(b.reactionCounts).map(([emoji, count]) => (
                      <span key={emoji} className="flex items-center gap-0.5 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600">
                        {emoji} <span className="font-medium">{count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function AdminMessagerie() {
  const { user } = useAuth();
  const [tab, setTab] = useState('prive');
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const loadThreads = useCallback(async () => {
    try { const r = await api.get('/messages/admin/threads'); setThreads(r.data.threads || []); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadThreads();
    const poll = setInterval(loadThreads, 15000);
    return () => clearInterval(poll);
  }, [loadThreads]);

  const onNewMessage = (msg, memberId, member) => {
    setThreads(prev => {
      const exists = prev.find(t => t.memberId === memberId);
      const lastMessage = { content: msg.content, fileName: msg.fileName, createdAt: msg.createdAt, senderId: msg.senderId };
      if (exists) {
        return [{ ...exists, lastMessage }, ...prev.filter(t => t.memberId !== memberId)];
      }
      return [{ memberId, member, lastMessage, messageCount: 1, unreadCount: 0 }, ...prev];
    });
  };

  const handleDeleteThread = async (memberId, member) => {
    if (!window.confirm(`Supprimer la conversation avec ${member?.firstName} ${member?.lastName} ?`)) return;
    try {
      await api.delete(`/messages/admin/thread/${memberId}`);
      setThreads(p => p.filter(t => t.memberId !== memberId));
      if (selected?.memberId === memberId) setSelected(null);
    } catch {}
  };

  const handleSelectThread = (t) => {
    setSelected(t);
    // Marquer comme lu localement immédiatement
    setThreads(prev => prev.map(th => th.memberId === t.memberId ? { ...th, unreadCount: 0 } : th));
  };

  const handleSelectMember = (member) => {
    const existing = threads.find(t => t.memberId === member.id);
    const thread = existing || { memberId: member.id, member, lastMessage: null, messageCount: 0, unreadCount: 0 };
    setSelected(thread);
    if (existing) setThreads(prev => prev.map(t => t.memberId === member.id ? { ...t, unreadCount: 0 } : t));
    setShowNewChat(false);
  };

  const filteredThreads = threads.filter(t => {
    const q = search.toLowerCase();
    return `${t.member?.firstName} ${t.member?.lastName} ${t.member?.email}`.toLowerCase().includes(q);
  });

  const existingIds = new Set(threads.map(t => t.memberId));
  const totalUnread = threads.reduce((s, t) => s + (t.unreadCount || 0), 0);

  return (
    <MemberLayout title="Messagerie">
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={handleSelectMember}
          existingIds={existingIds}
        />
      )}

      {/* Onglets */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab('prive'); setSelected(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${tab === 'prive' ? 'bg-[#075e54] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-500'}`}>
          💬 Messages privés
          {threads.length > 0 && (
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === 'prive' ? 'bg-white/20' : 'bg-green-100 text-green-800'}`}>
              {threads.length}
            </span>
          )}
          {totalUnread > 0 && tab !== 'prive' && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
        <button onClick={() => { setTab('diffusion'); setSelected(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'diffusion' ? 'bg-[#075e54] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-500'}`}>
          📢 Diffusion
        </button>
      </div>

      {tab === 'diffusion' ? (
        <BroadcastPanel />
      ) : (
        <div className="flex gap-0 overflow-hidden rounded-2xl shadow-sm border border-gray-200" style={{ height: 'calc(100vh - 220px)' }}>

          {/* Liste */}
          <div className={`flex flex-col bg-white border-r border-gray-200
            ${selected ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80'}`}>

            <div className="bg-[#075e54] px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-white text-sm">Conversations</h2>
                {totalUnread > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </div>
              <button onClick={() => setShowNewChat(true)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                title="Nouvelle conversation">
                ✏️
              </button>
            </div>

            <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
              <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-sm">{search ? 'Aucun résultat' : 'Aucune conversation'}</p>
                  <button onClick={() => setShowNewChat(true)}
                    className="mt-3 text-xs text-green-700 font-medium hover:underline">
                    + Démarrer une conversation
                  </button>
                </div>
              ) : filteredThreads.map(t => (
                <div key={t.memberId} onClick={() => handleSelectThread(t)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                    selected?.memberId === t.memberId ? 'bg-green-50' : ''
                  }`}>
                  <div className="relative">
                    <Avatar user={t.member} size="sm" />
                    {(t.unreadCount || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {t.unreadCount > 9 ? '9+' : t.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${(t.unreadCount || 0) > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                        {t.member?.firstName} {t.member?.lastName}
                      </p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                        {t.lastMessage ? fmt(t.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${(t.unreadCount || 0) > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {t.lastMessage?.content || (t.lastMessage?.fileName ? `📎 ${t.lastMessage.fileName}` : (
                          <span className="italic text-gray-400">Aucun message</span>
                        ))}
                      </p>
                      <button onClick={e => { e.stopPropagation(); handleDeleteThread(t.memberId, t.member); }}
                        className="flex-shrink-0 w-5 h-5 rounded text-gray-300 hover:text-red-500 flex items-center justify-center text-xs transition-colors">
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${selected ? 'flex' : 'hidden md:flex'}`}>
            {selected ? (
              <Conversation
                key={selected.memberId}
                thread={selected}
                adminId={user?.id}
                onNewMessage={onNewMessage}
                onBack={() => setSelected(null)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] text-gray-400">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-4xl mb-4">💬</div>
                <p className="text-lg font-medium text-gray-500">Messagerie AEGL</p>
                <p className="text-sm mt-1">Sélectionnez une conversation ou cliquez sur ✏️</p>
                <button onClick={() => setShowNewChat(true)}
                  className="mt-4 px-4 py-2 bg-[#075e54] text-white text-sm rounded-xl hover:bg-[#054d44] transition-colors">
                  + Nouvelle conversation
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
