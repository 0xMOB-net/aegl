import { useState, useEffect, useRef, useCallback } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const formatTime = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function MemberMessagerie() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await api.get('/messages');
      setMessages(res.data.messages || []);
      setError(null);
    } catch {
      if (!silent) setError('Impossible de charger les messages');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(() => fetchMessages(true), 15000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

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
      const res = await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isMe = (msg) => msg.senderId === user?.id;

  return (
    <MemberLayout title="Messagerie">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* En-tête */}
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">✉️</div>
          <div>
            <h2 className="font-semibold text-gray-800">Messagerie — Bureau AEGL</h2>
            <p className="text-gray-400 text-sm">Écrivez-nous directement. Nous vous répondrons dans les meilleurs délais.</p>
          </div>
          <button
            onClick={() => fetchMessages()}
            className="ml-auto text-gray-400 hover:text-green-700 text-xs flex items-center gap-1"
            title="Actualiser"
          >
            🔄 Actualiser
          </button>
        </div>

        {/* Zone de conversation */}
        <div className="card flex flex-col" style={{ minHeight: '420px' }}>
          <div className="flex-1 overflow-y-auto space-y-3 pb-2" style={{ maxHeight: '440px' }}>
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 text-sm py-10">{error}</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">✉️</p>
                <p className="text-sm font-medium">Aucun message pour l'instant.</p>
                <p className="text-xs mt-1">Envoyez votre première question au Bureau AEGL ci-dessous.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[78%]">
                    {!isMe(msg) && (
                      <p className="text-xs text-gray-400 mb-1 ml-1">🛡️ Bureau AEGL</p>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isMe(msg)
                        ? 'bg-green-800 text-white rounded-tr-sm'
                        : 'bg-amber-50 border border-amber-200 text-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                      {msg.fileName && (
                        <a
                          href={msg.viewUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 mt-1 text-xs underline ${isMe(msg) ? 'text-green-200 hover:text-white' : 'text-green-700 hover:text-green-900'}`}
                        >
                          <span>📎</span>
                          <span className="truncate max-w-[200px]">{msg.fileName}</span>
                          <span className="flex-shrink-0">↗</span>
                        </a>
                      )}
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${isMe(msg) ? 'text-right mr-1' : 'ml-1'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Fichier sélectionné */}
          {file && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mt-2 text-xs text-green-700">
              <span>📎</span>
              <span className="flex-1 truncate">{file.name}</span>
              <button
                onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="text-red-400 hover:text-red-600 font-bold"
              >✕</button>
            </div>
          )}

          {/* Zone de saisie */}
          <div className="border-t border-gray-100 pt-3 mt-2 flex gap-2 items-end">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="msg-file"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="msg-file"
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-700 cursor-pointer transition-colors flex-shrink-0"
                title="Joindre un fichier (PDF, JPG, PNG)"
              >
                📎
              </label>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message… (Entrée pour envoyer)"
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
              style={{ minHeight: '36px', maxHeight: '96px' }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
            />
            <button
              onClick={send}
              disabled={(!text.trim() && !file) || sending}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-800 text-white flex items-center justify-center hover:bg-green-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Envoyer"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <span className="text-base leading-none">➤</span>
              }
            </button>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
