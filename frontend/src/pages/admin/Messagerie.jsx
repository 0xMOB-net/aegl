import { useState, useEffect, useRef, useCallback } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const formatTime = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const roleLabel = { student: 'Étudiant', host: 'Hébergeur', admin: 'Admin' };

function ThreadList({ threads, selectedId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!threads.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-3xl mb-2">✉️</p>
        <p className="text-sm">Aucun message reçu.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-gray-100">
      {threads.map(t => (
        <li key={t.memberId}>
          <button
            onClick={() => onSelect(t)}
            className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors ${selectedId === t.memberId ? 'bg-green-50 border-r-2 border-green-700' : ''}`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-xs flex-shrink-0">
                {t.member?.firstName?.[0]}{t.member?.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {t.member?.firstName} {t.member?.lastName}
                </p>
                <p className="text-xs text-gray-400">{roleLabel[t.member?.role] || ''}</p>
              </div>
              <span className="ml-auto text-xs text-gray-300 flex-shrink-0">
                {t.lastMessage ? formatTime(t.lastMessage.createdAt) : ''}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate pl-10">
              {t.lastMessage?.content || (t.lastMessage?.fileName ? `📎 ${t.lastMessage.fileName}` : '')}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Conversation({ thread, adminId, onNewMessage }) {
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
    setLoading(true);
    setMessages([]);
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
      const res = await api.post(`/messages/admin/reply/${thread.memberId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newMsg = res.data.message;
      setMessages(prev => [...prev, newMsg]);
      onNewMessage(newMsg);
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

  const isAdmin = (msg) => msg.senderId === adminId;

  return (
    <div className="flex flex-col h-full">
      {/* Header conversation */}
      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm">
          {thread.member?.firstName?.[0]}{thread.member?.lastName?.[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{thread.member?.firstName} {thread.member?.lastName}</p>
          <p className="text-xs text-gray-400">{roleLabel[thread.member?.role]} · {thread.member?.email}</p>
        </div>
        <button
          onClick={() => fetchMessages()}
          className="ml-auto text-gray-400 hover:text-green-700 text-xs"
          title="Actualiser"
        >
          🔄
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pb-2">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-sm py-8">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Aucun message.</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${isAdmin(msg) ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[78%]">
                {!isAdmin(msg) && (
                  <p className="text-xs text-gray-400 mb-1 ml-1">
                    {thread.member?.firstName} {thread.member?.lastName}
                  </p>
                )}
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isAdmin(msg)
                    ? 'bg-green-800 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  {msg.fileName && (
                    <a
                      href={msg.viewUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 mt-1 text-xs underline ${isAdmin(msg) ? 'text-green-200 hover:text-white' : 'text-green-700 hover:text-green-900'}`}
                    >
                      <span>📎</span>
                      <span className="truncate max-w-[200px]">{msg.fileName}</span>
                      <span className="flex-shrink-0">↗</span>
                    </a>
                  )}
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${isAdmin(msg) ? 'text-right mr-1' : 'ml-1'}`}>
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
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-2 text-xs text-green-700 flex-shrink-0">
          <span>📎</span>
          <span className="flex-1 truncate">{file.name}</span>
          <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* Zone saisie */}
      <div className="border-t border-gray-100 pt-3 flex gap-2 items-end flex-shrink-0">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            id={`admin-file-${thread.memberId}`}
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <label
            htmlFor={`admin-file-${thread.memberId}`}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-700 cursor-pointer transition-colors flex-shrink-0"
            title="Joindre un fichier"
          >
            📎
          </label>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Répondre… (Entrée pour envoyer)"
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
  );
}

export default function AdminMessagerie() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await api.get('/messages/admin/threads');
      setThreads(res.data.threads || []);
    } catch {
      // silencieux
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
    const poll = setInterval(fetchThreads, 20000);
    return () => clearInterval(poll);
  }, [fetchThreads]);

  const handleNewMessage = (msg) => {
    setThreads(prev =>
      prev.map(t =>
        t.memberId === selected?.memberId
          ? { ...t, lastMessage: { content: msg.content, fileName: msg.fileName, createdAt: msg.createdAt, senderId: msg.senderId } }
          : t
      )
    );
  };

  return (
    <MemberLayout title="Messagerie">
      <div className="flex gap-4 h-full" style={{ minHeight: '600px' }}>
        {/* Panneau gauche — liste des fils */}
        <div className="w-80 flex-shrink-0 card p-0 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Conversations</h2>
            <button onClick={fetchThreads} className="text-gray-400 hover:text-green-700 text-xs" title="Actualiser">
              🔄
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <ThreadList
              threads={threads}
              selectedId={selected?.memberId}
              onSelect={setSelected}
              loading={loadingThreads}
            />
          </div>
        </div>

        {/* Panneau droit — conversation */}
        <div className="flex-1 card flex flex-col overflow-hidden min-h-0">
          {selected ? (
            <Conversation
              key={selected.memberId}
              thread={selected}
              adminId={user?.id}
              onNewMessage={handleNewMessage}
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
    </MemberLayout>
  );
}
