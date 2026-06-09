import { useState, useEffect, useRef, useCallback } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const fmtShort = (d) => {
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

const AUDIENCE_STYLE = {
  all:      'bg-green-50 border-green-200 text-green-800',
  students: 'bg-blue-50 border-blue-200 text-blue-800',
  hosts:    'bg-amber-50 border-amber-200 text-amber-800',
};
const AUDIENCE_ICON = { all: '👥', students: '🎓', hosts: '🏠' };
const AUDIENCE_LBL  = { all: 'Tous', students: 'Étudiants', hosts: 'Hébergeurs' };
const EMOJIS = ['👍', '❤️', '💪'];

function ReadTick({ readAt }) {
  return readAt
    ? <span className="text-[10px] text-[#4fc3f7] font-bold ml-1">✓✓</span>
    : <span className="text-[10px] text-gray-400 ml-1">✓</span>;
}

function BureauAvatar({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-[#075e54] flex items-center justify-center text-white font-bold flex-shrink-0`}>
      AE
    </div>
  );
}

/* ── Bulle avec menu contextuel ── */
function MessageBubble({ msg, isMe, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [editText, setEditText] = useState(msg.content || '');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  if (msg.deletedAt) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[72%] rounded-lg px-3 py-1.5 bg-gray-100 border border-gray-200/80">
          <p className="text-xs text-gray-400 italic flex items-center gap-1.5">
            <span>🚫</span>Message supprimé
          </p>
        </div>
      </div>
    );
  }

  const canEdit   = isMe && !!msg.content;
  const canDelete = isMe;

  const saveEdit = async () => {
    const t = editText.trim();
    if (!t || t === msg.content) { setEditing(false); return; }
    await onEdit(msg.id, t);
    setEditing(false);
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[72%]">
        <div className={`rounded-lg px-3 py-1.5 shadow-sm ${isMe ? 'bg-[#dcf8c6] rounded-tr-sm' : 'bg-white rounded-tl-sm'}`}>
          {editing ? (
            <div className="min-w-[180px]">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                  if (e.key === 'Escape') setEditing(false);
                }}
                className="w-full text-sm bg-transparent border-b-2 border-[#075e54] focus:outline-none resize-none py-0.5"
                rows={Math.max(1, (editText.match(/\n/g) || []).length + 1)}
              />
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">Annuler</button>
                <button onClick={saveEdit} className="text-xs text-[#075e54] font-semibold hover:text-green-800">Sauvegarder</button>
              </div>
            </div>
          ) : (
            <>
              {!isMe && <p className="text-[10px] text-[#075e54] font-semibold mb-0.5">Bureau AEGL</p>}
              {msg.content && <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
              {msg.fileName && (
                <a href={msg.viewUrl || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-1 text-xs text-green-700 underline">
                  📎 <span className="truncate max-w-[140px]">{msg.fileName}</span> ↗
                </a>
              )}
              {/* Pied de bulle : heure + coches + bouton ⋮ */}
              <div className="flex items-center gap-1 mt-0.5">
                {msg.editedAt && <span className="text-[9px] text-gray-400 italic">modifié</span>}
                <p className="text-[10px] text-gray-400 flex-1 text-right">{fmtFull(msg.createdAt)}</p>
                {isMe && <ReadTick readAt={msg.readAt} />}
                {(canEdit || canDelete) && (
                  <div ref={menuRef} className="relative ml-1 flex-shrink-0">
                    <button
                      onClick={() => setShowMenu(p => !p)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-black/10 text-xs leading-none"
                      title="Options"
                    >
                      ⋮
                    </button>
                    {showMenu && (
                      <div className={`absolute bottom-6 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[130px] overflow-hidden ${isMe ? 'right-0' : 'left-0'}`}>
                        {canEdit && (
                          <button
                            onClick={() => { setEditing(true); setEditText(msg.content || ''); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            ✏️ Modifier
                          </button>
                        )}
                        <button
                          onClick={() => { setShowMenu(false); onDelete(msg.id); }}
                          className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          🗑 Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Conversation privée ── */
function PrivateConversation({ messages, setMessages, loading, userId, onSend, onBack }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if ((!text.trim() && !file) || sending) return;
    setSending(true);
    try {
      await onSend(text.trim(), file);
      setText(''); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally { setSending(false); }
  };

  const handleEdit = async (messageId, newContent) => {
    try {
      const res = await api.patch(`/messages/${messageId}`, { content: newContent });
      setMessages(prev => prev.map(m => m.id === messageId ? res.data.message : m));
    } catch {}
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: null, filePath: null, fileName: null } : m
      ));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2]">
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-white/80 hover:text-white text-xl mr-1 leading-none">←</button>
        )}
        <BureauAvatar size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white text-sm">Bureau AEGL</p>
          <p className="text-xs text-white/60">Association des Étudiants Guinéens à Limoges</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-1.5">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="bg-white/80 rounded-xl px-4 py-2 text-xs text-gray-500 text-center">
              Démarrez votre conversation avec le bureau AEGL
            </div>
          </div>
        ) : messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={msg.senderId === userId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {file && (
        <div className="mx-3 mb-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 flex-shrink-0">
          📎 <span className="flex-1 truncate">{file.name}</span>
          <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            className="text-red-400 font-bold">✕</button>
        </div>
      )}

      <div className="bg-[#f0f0f0] px-3 py-2 flex gap-2 items-end flex-shrink-0">
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="mbr-msg-file"
          onChange={e => setFile(e.target.files?.[0] || null)} />
        <label htmlFor="mbr-msg-file"
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
          {sending
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <span className="text-sm leading-none">➤</span>}
        </button>
      </div>
    </div>
  );
}

/* ── Panneau Annonces ── */
function BroadcastsPanel({ broadcasts, loading, onReact, onBack }) {
  return (
    <div className="flex flex-col h-full bg-[#efeae2]">
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-white/80 hover:text-white text-xl mr-1 leading-none">←</button>
        )}
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg flex-shrink-0">📢</div>
        <div>
          <p className="font-semibold text-white text-sm">Annonces du bureau</p>
          <p className="text-xs text-white/60">{broadcasts.length} message{broadcasts.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="bg-white/80 rounded-xl px-4 py-2 text-xs text-gray-500 text-center">Aucune annonce pour l'instant</div>
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map(b => (
              <div key={b.id} className={`rounded-xl p-3 text-sm border shadow-sm ${AUDIENCE_STYLE[b.audience]}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold">{AUDIENCE_ICON[b.audience]} {AUDIENCE_LBL[b.audience]}</span>
                  <span className="text-xs opacity-50 ml-auto">{fmtFull(b.createdAt)}</span>
                </div>
                {b.content && <p className="whitespace-pre-wrap leading-relaxed">{b.content}</p>}
                {b.fileName && (
                  <a href={b.viewUrl || '#'} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs underline opacity-75 hover:opacity-100">
                    📎 <span className="truncate max-w-[180px]">{b.fileName}</span> ↗
                  </a>
                )}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {EMOJIS.map(emoji => {
                    const count = (b.reactionCounts || {})[emoji] || 0;
                    const mine  = (b.myReactions || []).includes(emoji);
                    return (
                      <button key={emoji} onClick={() => onReact(b.id, emoji)}
                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all ${
                          mine ? 'bg-white/70 border-current font-semibold shadow-sm' : 'bg-white/40 border-transparent hover:border-current hover:bg-white/60'
                        }`}>
                        <span>{emoji}</span>
                        {count > 0 && <span className="font-medium ml-0.5">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function MemberMessagerie() {
  const { user } = useAuth();
  const [messages,    setMessages]    = useState([]);
  const [broadcasts,  setBroadcasts]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  const fetchAll = useCallback(async (silent = false) => {
    try {
      const [msgRes, bcRes] = await Promise.all([
        api.get('/messages'),
        api.get('/messages/broadcasts'),
      ]);
      setMessages(msgRes.data.messages || []);
      setBroadcasts(bcRes.data.broadcasts || []);
      setUnreadCount(0);
    } catch {}
    finally { if (!silent) setLoading(false); }
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/messages/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
    const unreadPoll = setInterval(fetchUnread, 15000);
    pollRef.current  = setInterval(() => fetchAll(true), 60000);
    return () => { clearInterval(unreadPoll); clearInterval(pollRef.current); };
  }, [fetchAll, fetchUnread]);

  const handleSelectPrivate = () => {
    setSelected('private');
    setUnreadCount(0);
    fetchAll(true);
  };

  const handleSend = async (content, file) => {
    const fd = new FormData();
    if (content) fd.append('content', content);
    if (file)    fd.append('file', file);
    const res = await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setMessages(prev => [...prev, res.data.message]);
  };

  const handleReact = async (broadcastId, emoji) => {
    setBroadcasts(prev => prev.map(b => {
      if (b.id !== broadcastId) return b;
      const current = (b.myReactions || [])[0];
      const isSame  = current === emoji;
      const reactionCounts = { ...(b.reactionCounts || {}) };
      if (current) {
        reactionCounts[current] = Math.max(0, (reactionCounts[current] || 1) - 1);
        if (!reactionCounts[current]) delete reactionCounts[current];
      }
      if (!isSame) reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
      return { ...b, myReactions: isSame ? [] : [emoji], reactionCounts };
    }));
    try {
      const res = await api.post(`/messages/broadcasts/${broadcastId}/react`, { emoji });
      setBroadcasts(prev => prev.map(b => b.id === broadcastId ? { ...b, reactionCounts: res.data.reactionCounts } : b));
    } catch { fetchAll(true); }
  };

  const lastPrivate   = messages[messages.length - 1];
  const lastBroadcast = broadcasts[0];

  return (
    <MemberLayout title="Messagerie">
      <div className="flex gap-0 overflow-hidden rounded-2xl shadow-sm border border-gray-200" style={{ height: 'calc(100dvh - 220px)' }}>

        {/* Sidebar */}
        <div className={`flex flex-col bg-white border-r border-gray-200 ${selected ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80'}`}>
          <div className="bg-[#075e54] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white text-sm">Messagerie</h2>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <button onClick={() => fetchAll()} className="text-white/60 hover:text-white text-sm">🔄</button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Thread Bureau AEGL */}
            <div onClick={handleSelectPrivate}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${selected === 'private' ? 'bg-green-50' : ''}`}>
              <div className="relative">
                <BureauAvatar size="sm" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                    Bureau AEGL
                  </p>
                  {lastPrivate && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{fmtShort(lastPrivate.createdAt)}</span>
                  )}
                </div>
                <p className={`text-xs truncate ${unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                  {lastPrivate?.deletedAt
                    ? <span className="italic text-gray-400">Message supprimé</span>
                    : lastPrivate?.content || (lastPrivate?.fileName ? `📎 ${lastPrivate.fileName}` : <span className="italic text-gray-400">Démarrer une conversation</span>)
                  }
                </p>
              </div>
            </div>

            {/* Thread Annonces */}
            {broadcasts.length > 0 && (
              <div onClick={() => setSelected('broadcasts')}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${selected === 'broadcasts' ? 'bg-green-50' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-base flex-shrink-0">📢</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Annonces</p>
                    {lastBroadcast && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{fmtShort(lastBroadcast.createdAt)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {lastBroadcast?.content || (lastBroadcast?.fileName ? `📎 ${lastBroadcast.fileName}` : '')}
                  </p>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  {broadcasts.length}
                </span>
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Panneau droit */}
        <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${selected ? 'flex' : 'hidden md:flex'}`}>
          {selected === 'private' ? (
            <PrivateConversation
              messages={messages}
              setMessages={setMessages}
              loading={loading}
              userId={user?.id}
              onSend={handleSend}
              onBack={() => setSelected(null)}
            />
          ) : selected === 'broadcasts' ? (
            <BroadcastsPanel
              broadcasts={broadcasts}
              loading={loading}
              onReact={handleReact}
              onBack={() => setSelected(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] text-gray-400">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-4xl mb-4">💬</div>
              <p className="text-lg font-medium text-gray-500">Messagerie AEGL</p>
              <p className="text-sm mt-1">Sélectionnez une conversation</p>
              <button onClick={handleSelectPrivate}
                className="mt-4 px-4 py-2 bg-[#075e54] text-white text-sm rounded-xl hover:bg-[#054d44] transition-colors">
                Écrire au bureau
              </button>
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  );
}
