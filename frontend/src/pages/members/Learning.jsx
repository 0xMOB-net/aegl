import { useState, useEffect, useCallback, useRef } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const CATEGORIES = [
  { value: 'francais',      label: 'Français',          emoji: '🇫🇷' },
  { value: 'anglais',       label: 'Anglais',           emoji: '🇬🇧' },
  { value: 'universitaire', label: 'Vie universitaire', emoji: '🎓' },
  { value: 'pratique',      label: 'Vie pratique',      emoji: '🏙️' },
  { value: 'culture',       label: 'Culture & Société', emoji: '🌍' },
  { value: 'general',       label: 'Général',           emoji: '📚' },
];

const catEmoji = v => CATEGORIES.find(c => c.value === v)?.emoji || '📚';
const catLabel = v => CATEGORIES.find(c => c.value === v)?.label || v;

const RoleChip = ({ role }) => {
  const map = {
    instructor: { label: 'Formateur', bg: 'bg-purple-100', text: 'text-purple-700', icon: '⭐' },
    alumni:     { label: 'Ancien',    bg: 'bg-amber-100',  text: 'text-amber-700',  icon: '🎓' },
    student:    { label: 'Étudiant',  bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '📚' },
  };
  const r = map[role] || map.student;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${r.bg} ${r.text}`}>
      {r.icon} {r.label}
    </span>
  );
};

/* ── Invitations Banner ── */
function InvitationsBanner({ onDone }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState({});

  const fetchInvites = useCallback(async () => {
    try {
      const res = await api.get('/learning/my-invitations');
      setData(res.data);
    } catch { setData(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const respondCourse = async (enrollmentId, accept) => {
    setBusy(b => ({ ...b, [enrollmentId]: true }));
    try { await api.post(`/learning/enrollments/${enrollmentId}/respond`, { accept }); fetchInvites(); onDone(); }
    catch {} finally { setBusy(b => ({ ...b, [enrollmentId]: false })); }
  };
  const respondClass = async (memberId, accept) => {
    setBusy(b => ({ ...b, [memberId]: true }));
    try { await api.post(`/learning/class-members/${memberId}/respond`, { accept }); fetchInvites(); onDone(); }
    catch {} finally { setBusy(b => ({ ...b, [memberId]: false })); }
  };

  if (loading || !data) return null;
  const total = (data.courseInvites?.length || 0) + (data.classInvites?.length || 0);
  if (total === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 mb-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">📨</span>
        <p className="text-sm font-semibold text-amber-900">{total} invitation{total > 1 ? 's' : ''} en attente</p>
      </div>
      {data.courseInvites?.map(inv => (
        <div key={inv.id} className="flex items-center gap-3 p-3 bg-white border border-amber-100 rounded-xl">
          <span className="text-xl flex-shrink-0">{inv.course.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">Cours : {inv.course.title}</p>
            <p className="text-xs text-gray-400">{catLabel(inv.course.category)}</p>
          </div>
          <button onClick={() => respondCourse(inv.id, false)} disabled={busy[inv.id]}
            className="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 flex-shrink-0">Refuser</button>
          <button onClick={() => respondCourse(inv.id, true)} disabled={busy[inv.id]}
            className="text-xs px-3 py-1 bg-green-700 text-white rounded-lg hover:bg-green-800 flex-shrink-0">Accepter</button>
        </div>
      ))}
      {data.classInvites?.map(inv => (
        <div key={inv.id} className="flex items-center gap-3 p-3 bg-white border border-amber-100 rounded-xl">
          <span className="text-xl flex-shrink-0">{inv.class.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">Classe : {inv.class.name}</p>
            {inv.class.year && <p className="text-xs text-gray-400">{inv.class.year}</p>}
            <RoleChip role={inv.role} />
          </div>
          <button onClick={() => respondClass(inv.id, false)} disabled={busy[inv.id]}
            className="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 flex-shrink-0">Refuser</button>
          <button onClick={() => respondClass(inv.id, true)} disabled={busy[inv.id]}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0">Accepter</button>
        </div>
      ))}
    </div>
  );
}

/* ── Quiz Player ── */
function QuizPlayer({ quiz, onClose }) {
  const [step, setStep]   = useState(0);
  const [picks, setPicks] = useState({});
  const [score, setScore] = useState(null);
  const [sub, setSub]     = useState(false);

  const questions = quiz.questions || [];

  const submit = async () => {
    setSub(true);
    const answers = questions.map(q => picks[q.id] ?? -1);
    try {
      const res = await api.post(`/learning/quizzes/${quiz.id}/submit`, { answers });
      setScore(res.data);
    } catch {} finally { setSub(false); }
  };

  if (score) return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl mb-4">{score.score / score.total >= 0.8 ? '🏆' : score.score / score.total >= 0.5 ? '👍' : '💪'}</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-1">{score.score} / {score.total}</h3>
        <p className="text-gray-500 mb-6">{Math.round((score.score / score.total) * 100)}% de bonnes réponses</p>
        <button onClick={onClose} className="btn-primary w-full">Fermer</button>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <p className="text-gray-500 mb-4">Aucune question dans ce quiz.</p>
        <button onClick={onClose} className="btn-secondary">Fermer</button>
      </div>
    </div>
  );

  const q    = questions[step];
  const opts = JSON.parse(q.options);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400">Question {step + 1}/{questions.length}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full mb-6">
          <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="text-base font-medium text-gray-800 mb-5">{q.question}</p>
        <div className="space-y-2 mb-6">
          {opts.map((o, i) => (
            <button key={i} onClick={() => setPicks(p => ({ ...p, [q.id]: i }))}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${picks[q.id] === i ? 'border-green-500 bg-green-50 text-green-800 font-medium' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{o}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          {step > 0 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 text-sm">Précédent</button>}
          {step < questions.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={picks[q.id] === undefined}
              className="btn-primary flex-1 text-sm disabled:opacity-40">Suivant</button>
          ) : (
            <button onClick={submit} disabled={sub}
              className="btn-primary flex-1 text-sm disabled:opacity-40">{sub ? '...' : 'Terminer le quiz'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Chat Panel (course + class) ── */
function ChatPanel({ messagesUrl, sendUrl, deleteUrl, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [file, setFile]         = useState(null);
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  const fetchMessages = useCallback(async () => {
    try { const r = await api.get(messagesUrl); setMessages(r.data.messages || []); } catch {}
  }, [messagesUrl]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim() && !file) return;
    setSending(true);
    try {
      if (file) {
        const fd = new FormData(); fd.append('file', file);
        if (text.trim()) fd.append('content', text.trim());
        await api.post(sendUrl, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post(sendUrl, { content: text.trim() });
      }
      setText(''); setFile(null); if (fileRef.current) fileRef.current.value = ''; fetchMessages();
    } catch {} finally { setSending(false); }
  };

  const del = async (id) => {
    try { await api.delete(`${deleteUrl}/${id}`); fetchMessages(); } catch {}
  };

  return (
    <div className="flex flex-col h-[480px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-2xl mb-1">💬</p><p className="text-sm">Aucun message. Soyez le premier !</p>
          </div>
        ) : messages.map(m => {
          const isMe = m.user?.id === currentUserId || m.userId === currentUserId;
          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-green-100 text-xs font-bold text-green-800 flex items-center justify-center flex-shrink-0 self-end">
                {m.user?.firstName?.[0]}{m.user?.lastName?.[0]}
              </div>
              <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <p className="text-[10px] text-gray-400 px-1">{m.user?.firstName} {m.user?.lastName}</p>}
                {m.content && (
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-green-700 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                    {m.content}
                  </div>
                )}
                {m.filePath && (
                  <a href={m.filePath} target="_blank" rel="noreferrer"
                    className="text-xs underline text-blue-600 px-1">📎 {m.fileName || 'Pièce jointe'}</a>
                )}
                <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <p className="text-[10px] text-gray-300 px-1">
                    {new Date(m.createdAt).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isMe && <button onClick={() => del(m.id)} className="text-[10px] text-gray-300 hover:text-red-400 px-1">✕</button>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {file && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg mb-2 text-xs text-blue-700">
          <span>📎 {file.name}</span>
          <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="ml-auto text-gray-400 hover:text-red-400">✕</button>
        </div>
      )}
      <div className="flex items-center gap-2 border border-gray-200 rounded-2xl px-3 py-2 bg-gray-50">
        <input ref={fileRef} type="file" accept=".pdf,video/*,audio/*,image/*"
          onChange={e => setFile(e.target.files[0] || null)} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="text-gray-400 hover:text-green-700 flex-shrink-0">📎</button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Écrire un message..." className="flex-1 bg-transparent text-sm outline-none" />
        <button onClick={send} disabled={sending || (!text.trim() && !file)}
          className="w-8 h-8 bg-green-700 text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-green-800 transition-colors">
          {sending ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '↑'}
        </button>
      </div>
    </div>
  );
}

/* ── Enroll Modal ── */
function EnrollModal({ course, onClose, onRequested }) {
  const [loading, setLoading] = useState(false);
  const requestAccess = async () => {
    setLoading(true);
    try { await api.post(`/learning/courses/${course.id}/enroll`); onRequested(); onClose(); }
    catch (err) { alert(err.response?.data?.error || 'Erreur'); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-5">
          <span className="text-5xl">{course.emoji}</span>
          <h3 className="font-semibold text-gray-800 mt-3 text-lg">{course.title}</h3>
          <p className="text-sm text-gray-500 mt-1">Ce cours est restreint. Vous pouvez envoyer une demande d'accès.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary text-sm">Annuler</button>
          <button onClick={requestAccess} disabled={loading} className="flex-1 btn-primary text-sm disabled:opacity-40">
            {loading ? '...' : "Demander l'accès"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Instructor Lesson Manager ── */
function InstructorLessonManager({ course, onBack }) {
  const [lessons, setLessons] = useState([]);
  const [form, setForm]       = useState({ title: '', body: '', videoUrl: '', order: 0 });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  const fetchL = useCallback(async () => {
    const r = await api.get(`/learning/courses/${course.id}`);
    setLessons(r.data.course.lessons || []);
  }, [course.id]);
  useEffect(() => { fetchL(); }, [fetchL]);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await api.put(`/learning/courses/${course.id}/lessons/${editing}`, form);
      else await api.post(`/learning/courses/${course.id}/lessons`, form);
      setForm({ title: '', body: '', videoUrl: '', order: 0 }); setEditing(null); fetchL();
    } catch {} finally { setSaving(false); }
  };
  const del = async (id) => {
    if (!confirm('Supprimer cette leçon ?')) return;
    try { await api.delete(`/learning/courses/${course.id}/lessons/${id}`); fetchL(); } catch {}
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-green-700 flex items-center gap-1">← Retour au cours</button>
      <h3 className="font-semibold text-gray-800">Gérer les leçons — {course.title}</h3>
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de la leçon *"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
        <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Contenu..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600 font-mono" />
        <div className="flex gap-2">
          <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="Lien vidéo (optionnel)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
          <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: +e.target.value }))}
            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ title: '', body: '', videoUrl: '', order: 0 }); }}
              className="btn-secondary text-sm flex-1">Annuler</button>
          )}
          <button onClick={save} disabled={saving || !form.title.trim()} className="btn-primary text-sm flex-1 disabled:opacity-40">
            {saving ? '...' : editing ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {lessons.map((l, i) => (
          <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="w-6 h-6 bg-green-800 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <span className="text-sm font-medium text-gray-800 flex-1 truncate">{l.title}</span>
            <button onClick={() => { setEditing(l.id); setForm({ title: l.title, body: l.body || '', videoUrl: l.videoUrl || '', order: l.order }); }}
              className="text-xs text-gray-400 hover:text-green-700 p-1">✏️</button>
            <button onClick={() => del(l.id)} className="text-xs text-gray-400 hover:text-red-500 p-1">🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Class View ── */
function ClassView({ classId, currentUserId, onBack, onOpenCourse }) {
  const [classData, setClassData] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [classTab,  setClassTab]  = useState('chat');

  const fetchClass = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get(`/learning/classes/${classId}`); setClassData(r.data.class); }
    catch {} finally { setLoading(false); }
  }, [classId]);
  useEffect(() => { fetchClass(); }, [fetchClass]);

  if (loading) return (
    <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
  );
  if (!classData) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-sm">Classe introuvable.</p>
      <button onClick={onBack} className="mt-4 text-green-700 text-sm hover:underline">← Retour</button>
    </div>
  );

  const myMembership = classData.myMembership;
  const members      = classData.members || [];
  const courses      = classData.courses || [];
  const instructors  = members.filter(m => m.role === 'instructor');
  const alumni       = members.filter(m => m.role === 'alumni');
  const students     = members.filter(m => m.role === 'student');

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-green-700 flex items-center gap-1 mb-3">← Mes classes</button>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{classData.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-bold text-gray-800 text-xl">{classData.name}</h2>
              {classData.year && <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">{classData.year}</span>}
              {myMembership && <RoleChip role={myMembership.role} />}
            </div>
            {classData.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{classData.description}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { v: 'chat',    l: '💬 Chat' },
          { v: 'courses', l: `📚 Cours (${courses.length})` },
          { v: 'members', l: `👥 Membres (${members.length})` },
        ].map(t => (
          <button key={t.v} onClick={() => setClassTab(t.v)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${classTab === t.v ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
        ))}
      </div>

      {classTab === 'chat' && (
        <div className="card">
          <p className="text-sm font-semibold text-gray-700 mb-4">💬 Chat de la classe</p>
          <ChatPanel
            messagesUrl={`/learning/classes/${classId}/messages`}
            sendUrl={`/learning/classes/${classId}/messages`}
            deleteUrl="/learning/class-messages"
            currentUserId={currentUserId}
          />
        </div>
      )}

      {classTab === 'courses' && (
        <div>
          {courses.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><p className="text-3xl mb-2">📚</p><p className="text-sm">Aucun cours associé</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(c => {
                const course = c.course || c;
                return (
                  <button key={course.id} onClick={() => onOpenCourse(course)}
                    className="card text-left hover:shadow-md transition-all hover:ring-2 hover:ring-green-200 active:scale-[0.99]">
                    <span className="text-3xl">{course.emoji}</span>
                    <p className="font-medium text-gray-800 mt-2 text-sm">{course.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{catLabel(course.category)}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {course._count?.lessons || 0} leçon{(course._count?.lessons || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {classTab === 'members' && (
        <div className="space-y-5">
          {instructors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">⭐ Formateurs</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {instructors.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-sm font-bold text-purple-800 flex items-center justify-center flex-shrink-0">
                      {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                    </div>
                    <div><p className="text-sm font-medium text-gray-800">{m.user.firstName} {m.user.lastName}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {alumni.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">🎓 Anciens</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {alumni.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-sm font-bold text-amber-800 flex items-center justify-center flex-shrink-0">
                      {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.user.firstName} {m.user.lastName}</p>
                      <RoleChip role="alumni" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {students.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">📚 Étudiants actuels</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {students.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-sm font-bold text-blue-800 flex items-center justify-center flex-shrink-0">
                      {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.user.firstName} {m.user.lastName}</p>
                      <RoleChip role="student" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {members.length === 0 && <div className="text-center py-8 text-gray-400"><p className="text-sm">Aucun membre</p></div>}
        </div>
      )}
    </div>
  );
}

/* ── Classes Section ── */
function ClassesSection({ currentUserId, onOpenClass }) {
  const [myClasses,     setMyClasses]     = useState([]);
  const [publicClasses, setPublicClasses] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [joining,       setJoining]       = useState({});

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, pubRes] = await Promise.all([
        api.get('/learning/classes'),
        api.get('/learning/classes/public'),
      ]);
      setMyClasses(myRes.data.classes || []);
      setPublicClasses(pubRes.data.classes || []);
    } catch { setMyClasses([]); setPublicClasses([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const requestJoin = async (classId) => {
    setJoining(j => ({ ...j, [classId]: true }));
    try { await api.post(`/learning/classes/${classId}/join`); fetchClasses(); }
    catch (err) { alert(err.response?.data?.error || 'Erreur'); } finally { setJoining(j => ({ ...j, [classId]: false })); }
  };

  const notJoined     = publicClasses.filter(cls => !myClasses.find(m => m.id === cls.id) && cls.myMembership?.status !== 'pending' && cls.myMembership?.status !== 'invited');
  const pendingJoined = publicClasses.filter(cls => cls.myMembership?.status === 'pending');

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-8">
      {myClasses.length === 0 && notJoined.length === 0 && pendingJoined.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🏫</p>
          <p className="font-medium text-gray-600">Aucune classe disponible</p>
          <p className="text-sm mt-1">Des classes seront créées par les administrateurs</p>
        </div>
      ) : (
        <>
          {myClasses.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Mes classes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myClasses.map(cls => (
                  <button key={cls.id} onClick={() => onOpenClass(cls.id)}
                    className="card text-left hover:shadow-md transition-all hover:ring-2 hover:ring-blue-200 active:scale-[0.99]">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{cls.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm">{cls.name}</p>
                        {cls.year && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cls.year}</span>}
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cls._count?.members || 0} membre{(cls._count?.members || 0) !== 1 ? 's' : ''}</span>
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{cls._count?.courses || 0} cours</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {pendingJoined.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                Demandes en attente
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pendingJoined.length}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingJoined.map(cls => (
                  <div key={cls.id} className="card flex items-center gap-3 opacity-70">
                    <span className="text-2xl">{cls.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{cls.name}</p>
                      {cls.year && <p className="text-xs text-gray-400">{cls.year}</p>}
                    </div>
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex-shrink-0">⏳ En attente</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notJoined.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Découvrir des classes</h3>
              <p className="text-xs text-gray-400 mb-3">Rejoignez une classe pour accéder à ses cours et échanger avec ses membres</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notJoined.map(cls => (
                  <div key={cls.id} className="card flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{cls.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">{cls.name}</p>
                      {cls.year && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cls.year}</span>}
                      {cls.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cls.description}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{cls._count?.members || 0} membre{(cls._count?.members || 0) !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => requestJoin(cls.id)} disabled={joining[cls.id]}
                      className="flex-shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
                      {joining[cls.id] ? '...' : 'Rejoindre'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Main ── */
export default function MemberLearning() {
  const { user } = useAuth();

  const [mainTab,         setMainTab]         = useState('courses');
  const [view,            setView]            = useState('list');
  const [selectedCourse,  setSelectedCourse]  = useState(null);
  const [courseDetail,    setCourseDetail]    = useState(null);
  const [loadingCourse,   setLoadingCourse]   = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const [courses,   setCourses]   = useState([]);
  const [resources, setResources] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);

  const [filterCat,   setFilterCat]   = useState('all');
  const [enrollModal, setEnrollModal] = useState(null);
  const [quizModal,   setQuizModal]   = useState(null);
  const [courseTab,   setCourseTab]   = useState('lessons');
  const [instMode,    setInstMode]    = useState(false);
  const [invRefresh,  setInvRefresh]  = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, rRes, sRes] = await Promise.all([
        api.get('/learning/courses'),
        api.get('/learning/resources'),
        api.get('/learning/my-stats'),
      ]);
      setCourses(cRes.data.courses || []);
      setResources(rRes.data.resources || []);
      setStats(sRes.data);
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCourseClick = async (course) => {
    if (course.restricted) {
      const enrollment = course.myEnrollment;
      if (!enrollment) { setEnrollModal(course); return; }
      if (enrollment.status === 'pending' || enrollment.status === 'invited') { setEnrollModal(course); return; }
      if (enrollment.status === 'rejected') return;
    }
    setSelectedCourse(course);
    setCourseDetail(null);
    setView('course');
    setCourseTab('lessons');
    setInstMode(false);
    setLoadingCourse(true);
    try {
      const res = await api.get(`/learning/courses/${course.id}`);
      setCourseDetail(res.data.course);
    } catch {} finally { setLoadingCourse(false); }
  };

  const openClass = (classId) => {
    setSelectedClassId(classId);
    setView('class');
  };

  const backToList = () => {
    setView('list');
    setSelectedCourse(null);
    setCourseDetail(null);
    setSelectedClassId(null);
    setInstMode(false);
  };

  const completeLesson = async (lessonId) => {
    try { await api.post(`/learning/lessons/${lessonId}/complete`); } catch {}
  };

  const getYtEmbed = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  };

  const filtered = courses.filter(c => filterCat === 'all' || c.category === filterCat);

  const enrollStatus = (c) => {
    if (!c.restricted) return null;
    const e = c.myEnrollment;
    if (!e) return { label: '🔒 Restreint', cls: 'bg-gray-100 text-gray-500' };
    if (e.status === 'pending')  return { label: '⏳ En attente', cls: 'bg-amber-100 text-amber-700' };
    if (e.status === 'invited')  return { label: '📨 Invité',     cls: 'bg-blue-100 text-blue-700' };
    if (e.status === 'rejected') return { label: '✕ Refusé',      cls: 'bg-red-100 text-red-600' };
    if (e.status === 'approved') return { label: '✓ Inscrit',     cls: 'bg-green-100 text-green-700' };
    return null;
  };

  return (
    <MemberLayout title="Espace Apprentissage">
      {enrollModal && (
        <EnrollModal course={enrollModal} onClose={() => setEnrollModal(null)} onRequested={fetchData} />
      )}
      {quizModal && (
        <QuizPlayer quiz={quizModal} onClose={() => setQuizModal(null)} />
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <div className="space-y-5">
          <InvitationsBanner key={invRefresh} onDone={() => { setInvRefresh(r => r + 1); fetchData(); }} />

          {stats && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Leçons\ncomplétées', value: stats.lessonsCompleted, color: 'green' },
                { label: 'Quiz\nréussis',      value: stats.quizzesPassed,    color: 'blue' },
                { label: 'Cours\nsuivis',      value: stats.coursesStarted,   color: 'purple' },
              ].map(s => (
                <div key={s.label} className="card text-center py-3">
                  <p className={`text-2xl font-bold text-${s.color}-700`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 whitespace-pre-line">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Main tabs: Cours | Classes */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ v: 'courses', l: '📚 Cours' }, { v: 'classes', l: '🏫 Classes' }].map(t => (
              <button key={t.v} onClick={() => setMainTab(t.v)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mainTab === t.v ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
            ))}
          </div>

          {/* ── Courses ── */}
          {mainTab === 'courses' && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterCat('all')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Tous
                </button>
                {CATEGORIES.map(c => (
                  <button key={c.value} onClick={() => setFilterCat(c.value)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === c.value ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-3">📚</p>
                  <p className="font-medium text-gray-600">Aucun cours disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(course => {
                    const st       = enrollStatus(course);
                    const isLocked = course.restricted && course.myEnrollment?.status !== 'approved';
                    return (
                      <button key={course.id} onClick={() => handleCourseClick(course)}
                        className={`card text-left transition-all hover:shadow-md active:scale-[0.99] ${isLocked ? 'opacity-75 hover:ring-2 hover:ring-amber-200' : 'hover:ring-2 hover:ring-green-200'}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-3xl">{course.emoji}</span>
                          {st && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${st.cls}`}>{st.label}</span>}
                        </div>
                        <p className="font-semibold text-gray-800 text-sm">{course.title}</p>
                        {course.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{catEmoji(course.category)} {catLabel(course.category)}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{course._count.lessons} leçon{course._count.lessons !== 1 ? 's' : ''}</span>
                          {course._count.quizzes > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">🧩 {course._count.quizzes}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {resources.filter(r => !r.courseId).length > 0 && (
                <div className="card">
                  <p className="text-sm font-semibold text-gray-700 mb-3">🗂️ Ressources générales</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {resources.filter(r => !r.courseId).map(r => (
                      <a key={r.id} href={r.url || r.filePath} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 transition-colors">
                        <span className="text-base">{r.type === 'pdf' ? '📄' : r.type === 'video' ? '🎬' : r.type === 'audio' ? '🎵' : '🔗'}</span>
                        <span className="text-sm text-gray-700 truncate">{r.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Classes ── */}
          {mainTab === 'classes' && (
            <ClassesSection currentUserId={user?.id} onOpenClass={openClass} />
          )}
        </div>
      )}

      {/* ── Course view ── */}
      {view === 'course' && selectedCourse && (
        <div className="space-y-5">
          {instMode ? (
            <InstructorLessonManager course={selectedCourse} onBack={() => setInstMode(false)} />
          ) : (
            <>
              <div>
                <button onClick={backToList} className="text-sm text-gray-500 hover:text-green-700 flex items-center gap-1 mb-3">← Tous les cours</button>
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{selectedCourse.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-800 text-xl">{selectedCourse.title}</h2>
                    {selectedCourse.description && <p className="text-sm text-gray-500 mt-0.5">{selectedCourse.description}</p>}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{catEmoji(selectedCourse.category)} {catLabel(selectedCourse.category)}</span>
                    </div>
                  </div>
                  {(courseDetail?.myEnrollment?.role === 'instructor' || selectedCourse.myEnrollment?.role === 'instructor') && (
                    <button onClick={() => setInstMode(true)}
                      className="text-xs text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 flex-shrink-0">✏️ Gérer</button>
                  )}
                </div>
              </div>

              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                {[
                  { v: 'lessons',   l: '📖 Leçons' },
                  { v: 'quiz',      l: '🧩 Quiz' },
                  { v: 'resources', l: '🗂️ Ressources' },
                  { v: 'chat',      l: '💬 Chat' },
                ].map(t => (
                  <button key={t.v} onClick={() => setCourseTab(t.v)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${courseTab === t.v ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500'}`}>{t.l}</button>
                ))}
              </div>

              {courseTab === 'lessons' && (
                <div className="space-y-4">
                  {loadingCourse ? (
                    <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (!courseDetail?.lessons || courseDetail.lessons.length === 0) ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-3xl mb-2">📖</p><p className="text-sm">Aucune leçon pour l'instant</p>
                    </div>
                  ) : courseDetail.lessons.map((lesson, i) => (
                    <div key={lesson.id} className="card">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-green-800 text-white rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                        <h3 className="font-semibold text-gray-800 flex-1">{lesson.title}</h3>
                        <button onClick={() => completeLesson(lesson.id)}
                          className="text-xs text-green-700 border border-green-200 rounded-lg px-2.5 py-1 hover:bg-green-50 flex-shrink-0">✓ Lu</button>
                      </div>
                      {lesson.videoUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden aspect-video bg-black">
                          {getYtEmbed(lesson.videoUrl) ? (
                            <iframe src={getYtEmbed(lesson.videoUrl)} className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                          ) : (
                            <video src={lesson.videoUrl} controls className="w-full h-full" />
                          )}
                        </div>
                      )}
                      {lesson.body && (
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{lesson.body}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {courseTab === 'quiz' && (
                <div className="space-y-4">
                  {loadingCourse ? (
                    <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (!courseDetail?.quizzes || courseDetail.quizzes.length === 0) ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-3xl mb-2">🧩</p><p className="text-sm">Aucun quiz pour l'instant</p>
                    </div>
                  ) : courseDetail.quizzes.map(quiz => (
                    <div key={quiz.id} className="card hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">🧩 {quiz.title}</p>
                          {quiz.description && <p className="text-xs text-gray-400 mt-0.5">{quiz.description}</p>}
                          <p className="text-xs text-blue-600 mt-1">{quiz.questions?.length || 0} question{quiz.questions?.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => setQuizModal(quiz)} className="btn-primary text-sm">Commencer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {courseTab === 'resources' && (
                <div className="space-y-3">
                  {loadingCourse ? (
                    <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (!courseDetail?.resources || courseDetail.resources.length === 0) ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-3xl mb-2">🗂️</p><p className="text-sm">Aucune ressource</p>
                    </div>
                  ) : courseDetail.resources.map(r => (
                    <a key={r.id} href={r.url || r.filePath} target="_blank" rel="noreferrer"
                      className="card flex items-center gap-3 hover:shadow-md transition-shadow">
                      <span className="text-2xl">{r.type === 'pdf' ? '📄' : r.type === 'video' ? '🎬' : r.type === 'audio' ? '🎵' : '🔗'}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-800">{r.title}</p>
                        {r.description && <p className="text-xs text-gray-400">{r.description}</p>}
                      </div>
                      <span className="ml-auto text-green-700">→</span>
                    </a>
                  ))}
                </div>
              )}

              {courseTab === 'chat' && (
                <div className="card">
                  <p className="text-sm font-semibold text-gray-700 mb-4">💬 Chat du cours</p>
                  <ChatPanel
                    messagesUrl={`/learning/courses/${selectedCourse.id}/messages`}
                    sendUrl={`/learning/courses/${selectedCourse.id}/messages`}
                    deleteUrl="/learning/messages"
                    currentUserId={user?.id}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Class view ── */}
      {view === 'class' && selectedClassId && (
        <ClassView
          classId={selectedClassId}
          currentUserId={user?.id}
          onBack={backToList}
          onOpenCourse={(course) => {
            handleCourseClick(course);
          }}
        />
      )}
    </MemberLayout>
  );
}
