import { useState, useEffect, useRef, useCallback } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const fmt = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const ROLE_LBL = { student: 'Étudiant', host: 'Hébergeur', admin: 'Admin' };
const AUDIENCE_LBL   = { all: 'Tous les membres', students: 'Étudiants uniquement', hosts: 'Hébergeurs uniquement' };
const AUDIENCE_ICON  = { all: '👥', students: '🎓', hosts: '🏠' };
const AUDIENCE_COLOR = { all: 'bg-green-100 text-green-800', students: 'bg-blue-100 text-blue-800', hosts: 'bg-amber-100 text-amber-800' };

/* ─── Élément de fil dans la liste ─── */
function ThreadItem({ t, active, onClick, onDelete }) {
  return (
    <div
      onClick={onClick}
      className={`group w-full text-left px-4 py-3 transition-colors hover:bg-green-50 cursor-pointer ${active ? 'bg-green-50 border-r-2 border-green-700' : ''}`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-xs flex-shrink-0">
          {t.member?.firstName?.[0]}{t.member?.lastName?.[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{t.member?.firstName} {t.member?.lastName}</p>
          <p className="text-xs text-gray-400 truncate">{ROLE_LBL[t.member?.role]}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] text-gray-300">{t.lastMessage ? fmt(t.lastMessage.createdAt) : ''}</span>
          <button
            onClick={e => { e.stopPropagation(); onDelete(t.memberId, t.member); }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 ml-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-xs transition-all"
            title="Supprimer la conversation"
          >🗑</button>
        </div>
      </div>
      <p className="text-xs text-gray-500 truncate mt-1 pl-10">
        {t.lastMessage?.content || (t.lastMessage?.fileName ? `📎 ${t.lastMessage.fileName}` : '—')}
      </p>
    </div>
  );
}

/* ─── Conversation privée ─── */
function Conversation({ thread, adminId, onNewMessage, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text,    setText]    = useState('');
  const [file,    setFile]    = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef      = useRef(null);

  const fetch = useCallback(async (silent = false) => {
    try {
      const res = await api.get(`/messages/admin/thread/${thread.memberId}`);
      setMessages(res.data.messages || []);
      setError(null);
    } catch {
      if (!silent) setError('Impossible de charger les messages');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [thread.memberId]);

  useEffect(() => {
    setLoading(true); setMessages([]);
    fetch();
    pollRef.current = setInterval(() => fetch(true), 15000);
    return () => clearInterval(pollRef.current);
  }, [fetch]);

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
      onNewMessage(msg);
      setText(''); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
    finally { setSending(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const isAdm = (msg) => msg.senderId === adminId;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-gray-500 hover:text-green-700 text-xl mr-1 leading-none flex-shrink-0">←</button>
        )}
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-xs flex-shrink-0">
          {thread.member?.firstName?.[0]}{thread.member?.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{thread.member?.firstName} {thread.member?.lastName}</p>
          <p className="text-xs text-gray-400 truncate">{ROLE_LBL[thread.member?.role]} · {thread.member?.email}</p>
        </div>
        <button onClick={() => fetch()} className="ml-auto text-gray-400 hover:text-green-700 text-xs flex-shrink-0">🔄</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-sm py-8">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Aucun message.</div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`flex ${isAdm(msg) ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[82%]">
              {!isAdm(msg) && <p className="text-xs text-gray-400 mb-0.5 ml-1">{thread.member?.firstName}</p>}
              <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                isAdm(msg) ? 'bg-green-800 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                {msg.fileName && (
                  <a href={msg.viewUrl || '#'} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 mt-1 text-xs underline ${isAdm(msg) ? 'text-green-200 hover:text-white' : 'text-green-700'}`}>
                    📎 <span className="truncate max-w-[140px]">{msg.fileName}</span> ↗
                  </a>
                )}
              </div>
              <p className={`text-[10px] text-gray-400 mt-0.5 ${isAdm(msg) ? 'text-right mr-1' : 'ml-1'}`}>{fmt(msg.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {file && (
        <div className="mx-4 mb-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700 flex-shrink-0">
          📎 <span className="flex-1 truncate">{file.name}</span>
          <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      <div className="border-t border-gray-100 px-3 py-3 flex gap-2 items-end flex-shrink-0">
        <div>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id={`af-${thread.memberId}`} onChange={e => setFile(e.target.files?.[0] || null)} />
          <label htmlFor={`af-${thread.memberId}`} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-700 cursor-pointer transition-colors">📎</label>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
          placeholder="Répondre…" rows={1}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
          style={{ minHeight: '38px', maxHeight: '96px' }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'; }} />
        <button onClick={send} disabled={(!text.trim() && !file) || sending}
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-800 text-white flex items-center justify-center hover:bg-green-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="text-base leading-none">➤</span>}
        </button>
      </div>
    </div>
  );
}

/* ─── Panneau Diffusion ─── */
function BroadcastPanel() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [content,  setContent]  = useState('');
  const [audience, setAudience] = useState('all');
  const [file,     setFile]     = useState(null);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const fileInputRef = useRef(null);

  const loadBC = useCallback(async () => {
    try { const r = await api.get('/messages/admin/broadcasts'); setBroadcasts(r.data.broadcasts || []); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBC(); }, [loadBC]);

  const handleDeleteBroadcast = async (broadcastId) => {
    if (!window.confirm('Supprimer cette diffusion définitivement ?')) return;
    try {
      await api.delete(`/messages/admin/broadcast/${broadcastId}`);
      setBroadcasts(prev => prev.filter(b => b.id !== broadcastId));
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
      setSuccess(true); setTimeout(() => setSuccess(false), 3500);
    } catch (err) { setError(err.response?.data?.error || 'Erreur'); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Formulaire */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">📢 Nouveau message diffusé</h3>

        {/* Sélecteur audience */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {Object.entries(AUDIENCE_LBL).map(([v, lbl]) => (
            <button key={v} onClick={() => setAudience(v)}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left sm:text-center ${
                audience === v ? 'bg-green-800 text-white border-green-800' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
              }`}>
              {AUDIENCE_ICON[v]} {lbl}
            </button>
          ))}
        </div>

        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Votre message pour les membres sélectionnés…" rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none mb-2" />

        {file && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-2 text-xs text-green-700">
            📎 <span className="flex-1 truncate">{file.name}</span>
            <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-400 font-bold">✕</button>
          </div>
        )}
        {error   && <p className="text-red-500 text-xs mb-2">{error}</p>}
        {success && <p className="text-green-700 text-xs mb-2 font-medium">✅ Message diffusé avec succès !</p>}

        <div className="flex gap-2 items-center">
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="bc-file-adm" onChange={e => setFile(e.target.files?.[0] || null)} />
            <label htmlFor="bc-file-adm" className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-700 cursor-pointer transition-colors">📎</label>
          </div>
          <button onClick={send} disabled={(!content.trim() && !file) || sending}
            className="flex-1 py-2.5 rounded-xl bg-green-800 text-white text-sm font-medium hover:bg-green-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📢'}
            Diffuser
          </button>
        </div>
      </div>

      {/* Historique */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Historique des diffusions</h3>
        {loading ? (
          <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" /></div>
        ) : broadcasts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Aucune diffusion envoyée.</p>
        ) : (
          <ul className="space-y-3">
            {broadcasts.map(b => (
              <li key={b.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AUDIENCE_COLOR[b.audience]}`}>
                    {AUDIENCE_ICON[b.audience]} {AUDIENCE_LBL[b.audience]}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{fmt(b.createdAt)}</span>
                  <button
                    onClick={() => handleDeleteBroadcast(b.id)}
                    className="text-gray-300 hover:text-red-500 text-xs transition-colors"
                    title="Supprimer"
                  >🗑</button>
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

/* ─── Page principale admin ─── */
export default function AdminMessagerie() {
  const { user } = useAuth();
  const [tab,      setTab]      = useState('prive');
  const [threads,  setThreads]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const loadThreads = useCallback(async () => {
    try { const r = await api.get('/messages/admin/threads'); setThreads(r.data.threads || []); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadThreads();
    const poll = setInterval(loadThreads, 20000);
    return () => clearInterval(poll);
  }, [loadThreads]);

  const onNewMsg = (msg) => {
    setThreads(prev => prev.map(t =>
      t.memberId === selected?.memberId
        ? { ...t, lastMessage: { content: msg.content, fileName: msg.fileName, createdAt: msg.createdAt, senderId: msg.senderId } }
        : t
    ));
  };

  const handleDeleteThread = async (memberId, member) => {
    if (!window.confirm(`Supprimer toute la conversation avec ${member?.firstName} ${member?.lastName} ?`)) return;
    try {
      await api.delete(`/messages/admin/thread/${memberId}`);
      setThreads(prev => prev.filter(t => t.memberId !== memberId));
      if (selected?.memberId === memberId) setSelected(null);
    } catch {}
  };

  return (
    <MemberLayout title="Messagerie">

      {/* Onglets */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab('prive'); setSelected(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'prive' ? 'bg-green-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'}`}>
          ✉️ Messages privés
          {threads.length > 0 && (
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === 'prive' ? 'bg-white/20' : 'bg-green-100 text-green-800'}`}>
              {threads.length}
            </span>
          )}
        </button>
        <button onClick={() => { setTab('diffusion'); setSelected(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'diffusion' ? 'bg-green-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'}`}>
          📢 Diffusion
        </button>
      </div>

      {tab === 'diffusion' ? (
        <BroadcastPanel />
      ) : (
        /*
         * Messages privés — layout adaptatif :
         * Mobile  : liste seule OU conversation seule (avec bouton retour)
         * Desktop : panneau gauche liste + panneau droit conversation
         */
        <div className="flex gap-4 min-h-0" style={{ height: 'calc(100vh - 220px)' }}>

          {/* Liste des fils — masquée sur mobile si conversation ouverte */}
          <div className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100
            ${selected ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80'}`}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="font-semibold text-gray-800 text-sm">Conversations</h2>
              <button onClick={loadThreads} className="text-gray-400 hover:text-green-700 text-xs">🔄</button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">✉️</p>
                  <p className="text-sm">Aucun message reçu.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {threads.map(t => (
                    <li key={t.memberId}>
                      <ThreadItem t={t} active={selected?.memberId === t.memberId} onClick={() => setSelected(t)} onDelete={handleDeleteThread} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Conversation — plein écran sur mobile quand sélectionnée */}
          <div className={`flex-1 flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 min-h-0
            ${selected ? 'flex' : 'hidden md:flex'}`}>
            {selected ? (
              <Conversation
                key={selected.memberId}
                thread={selected}
                adminId={user?.id}
                onNewMessage={onNewMsg}
                onBack={() => setSelected(null)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <p className="text-5xl mb-4">✉️</p>
                <p className="text-sm font-medium">Sélectionnez une conversation</p>
                <p className="text-xs mt-1">Les messages des membres apparaissent à gauche.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
