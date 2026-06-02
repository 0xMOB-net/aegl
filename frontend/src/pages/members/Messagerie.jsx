import { useState, useEffect, useRef, useCallback } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const fmt = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const AUDIENCE_STYLE = {
  all:      'bg-green-50 border-green-200 text-green-800',
  students: 'bg-blue-50 border-blue-200 text-blue-800',
  hosts:    'bg-amber-50 border-amber-200 text-amber-800',
};
const AUDIENCE_ICON = { all: '👥', students: '🎓', hosts: '🏠' };
const AUDIENCE_LBL  = { all: 'Tous', students: 'Étudiants', hosts: 'Hébergeurs' };

export default function MemberMessagerie() {
  const { user } = useAuth();
  const [messages,   setMessages]   = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [text,    setText]   = useState('');
  const [file,    setFile]   = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef      = useRef(null);

  const fetchAll = useCallback(async (silent = false) => {
    try {
      const [msgRes, bcRes] = await Promise.all([
        api.get('/messages'),
        api.get('/messages/broadcasts'),
      ]);
      setMessages(msgRes.data.messages || []);
      setBroadcasts(bcRes.data.broadcasts || []);
      setError(null);
    } catch (err) {
      if (!silent) {
        const status = err.response?.status;
        const msg = err.response?.data?.error || err.message || 'Erreur inconnue';
        setError(`Erreur ${status || ''} : ${msg}`);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(() => fetchAll(true), 15000);
    return () => clearInterval(pollRef.current);
  }, [fetchAll]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if ((!text.trim() && !file) || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('content', text.trim());
      if (file) fd.append('file', file);
      const res = await api.post('/messages', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages(prev => [...prev, res.data.message]);
      setText('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isMe = (msg) => msg.senderId === user?.id;

  return (
    <MemberLayout title="Messagerie">
      {/* Page container — on mobile prend toute la hauteur */}
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">

        {/* ── En-tête ── */}
        <div className="card flex items-center gap-3">
          <div className="w-9 h-9 flex-shrink-0 bg-green-100 rounded-full flex items-center justify-center text-lg">✉️</div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-800 text-sm leading-tight">Messagerie — Bureau AEGL</h2>
            <p className="text-gray-400 text-xs mt-0.5">Écrivez-nous directement, nous répondons rapidement.</p>
          </div>
          <button
            onClick={() => fetchAll()}
            className="ml-auto flex-shrink-0 w-8 h-8 rounded-xl border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-700 flex items-center justify-center transition-colors text-sm"
            title="Actualiser"
          >🔄</button>
        </div>

        {loading ? (
          <div className="card flex justify-center items-center py-14">
            <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="card text-center text-red-500 text-sm py-10">{error}</div>
        ) : (
          <>
            {/* ── Diffusions du bureau ── */}
            {broadcasts.length > 0 && (
              <div className="card space-y-3">
                <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <span>📢</span> Messages du Bureau AEGL
                </h3>
                {broadcasts.map(b => (
                  <div key={b.id} className={`border rounded-xl p-3 text-sm ${AUDIENCE_STYLE[b.audience]}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold">{AUDIENCE_ICON[b.audience]} {AUDIENCE_LBL[b.audience]}</span>
                      <span className="text-xs opacity-50 ml-auto">{fmt(b.createdAt)}</span>
                    </div>
                    {b.content && <p className="whitespace-pre-wrap leading-relaxed">{b.content}</p>}
                    {b.fileName && (
                      <a href={b.viewUrl || '#'} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs underline opacity-75 hover:opacity-100">
                        📎 <span className="truncate max-w-[180px]">{b.fileName}</span> ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Conversation privée ── */}
            <div className="card flex flex-col gap-0 p-0 overflow-hidden">
              <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                  💬 Ma conversation avec le bureau
                </h3>
              </div>

              {/* Messages scrollables */}
              <div className="overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: '45vh' }}>
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-3xl mb-2">💬</p>
                    <p className="text-sm">Aucun message pour l'instant.</p>
                    <p className="text-xs mt-1">Envoyez votre première question ci-dessous.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[84%]">
                        {!isMe(msg) && (
                          <p className="text-xs text-gray-400 mb-1 ml-1">🛡️ Bureau AEGL</p>
                        )}
                        <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          isMe(msg)
                            ? 'bg-green-800 text-white rounded-tr-sm'
                            : 'bg-amber-50 border border-amber-200 text-gray-800 rounded-tl-sm'
                        }`}>
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                          {msg.fileName && (
                            <a href={msg.viewUrl || '#'} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-1.5 mt-1 text-xs underline ${
                                isMe(msg) ? 'text-green-200 hover:text-white' : 'text-green-700 hover:text-green-900'
                              }`}>
                              📎 <span className="truncate max-w-[140px]">{msg.fileName}</span> ↗
                            </a>
                          )}
                        </div>
                        <p className={`text-[10px] text-gray-400 mt-0.5 ${isMe(msg) ? 'text-right mr-1' : 'ml-1'}`}>
                          {fmt(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Fichier sélectionné */}
              {file && (
                <div className="mx-4 mb-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700">
                  📎 <span className="flex-1 truncate">{file.name}</span>
                  <button
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-red-400 hover:text-red-600 font-bold leading-none"
                  >✕</button>
                </div>
              )}

              {/* Zone de saisie */}
              <div className="border-t border-gray-100 px-3 py-3 flex gap-2 items-end">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="mbr-msg-file"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="mbr-msg-file"
                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-700 cursor-pointer transition-colors flex-shrink-0"
                    title="Joindre un fichier"
                  >📎</label>
                </div>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Votre message…"
                  rows={1}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                  style={{ minHeight: '38px', maxHeight: '96px' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={send}
                  disabled={(!text.trim() && !file) || sending}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-800 text-white flex items-center justify-center hover:bg-green-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <span className="text-base leading-none">➤</span>
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </MemberLayout>
  );
}
