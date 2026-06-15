import { useState, useEffect, useCallback, useRef } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const CATEGORIES = [
  { value: 'all',           label: 'Tout',              emoji: '📚' },
  { value: 'francais',      label: 'Français',          emoji: '🇫🇷' },
  { value: 'anglais',       label: 'Anglais',           emoji: '🇬🇧' },
  { value: 'universitaire', label: 'Vie universitaire', emoji: '🎓' },
  { value: 'pratique',      label: 'Vie pratique',      emoji: '🏙️' },
  { value: 'culture',       label: 'Culture & Société', emoji: '🌍' },
  { value: 'general',       label: 'Général',           emoji: '📖' },
];

const LEVEL_COLOR = {
  debutant:      'bg-green-100 text-green-700',
  intermediaire: 'bg-blue-100 text-blue-700',
  avance:        'bg-purple-100 text-purple-700',
  tous:          'bg-gray-100 text-gray-600',
};

const RES_ICON = { pdf: '📄', video: '🎬', audio: '🎵', link: '🔗' };

const getYouTubeEmbed = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/* ── Quiz Player ── */
function QuizPlayer({ quiz, onFinish }) {
  const [answers, setAnswers] = useState({});
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const allAnswered = quiz.questions.every(q => answers[q.id] !== undefined);

  const submit = async () => {
    if (!allAnswered) return;
    setLoading(true);
    try {
      const res = await api.post(`/learning/quizzes/${quiz.id}/submit`, {
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
      });
      setResult(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    const passed = pct >= 50;
    return (
      <div className="space-y-5">
        <div className={`rounded-2xl p-6 text-center border-2 ${passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200'}`}>
          <p className="text-5xl font-bold mb-1" style={{ color: passed ? '#16a34a' : '#dc2626' }}>{result.score}/{result.total}</p>
          <p className="text-lg font-semibold text-gray-700">{pct}%</p>
          <p className="text-sm text-gray-500 mt-1">
            {passed ? '🎉 Bien joué ! Vous avez réussi ce quiz.' : '💪 Continuez vos efforts, vous pouvez refaire le quiz.'}
          </p>
        </div>
        <div className="space-y-4">
          {result.results.map(r => (
            <div key={r.questionId} className={`rounded-xl p-4 border ${r.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-2 mb-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${r.isCorrect ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
                  {r.isCorrect ? '✓' : '✗'}
                </span>
                <p className="text-sm font-medium text-gray-800">{r.question}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 ml-7">
                {r.options.map((opt, oi) => (
                  <div key={oi} className={`text-xs px-3 py-2 rounded-lg border ${
                    oi === r.correct ? 'bg-green-100 border-green-400 text-green-800 font-semibold' :
                    oi === r.userAnswer && !r.isCorrect ? 'bg-red-100 border-red-300 text-red-700' :
                    'bg-white border-gray-200 text-gray-600'
                  }`}>{String.fromCharCode(65 + oi)}. {opt}</div>
                ))}
              </div>
              {r.explanation && <p className="text-xs text-gray-500 mt-2 ml-7 italic">💡 {r.explanation}</p>}
            </div>
          ))}
        </div>
        <button onClick={() => { setResult(null); setAnswers({}); onFinish?.(); }}
          className="w-full btn-secondary text-sm">Refaire le quiz</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">{quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}</p>
      {quiz.questions.map((q, i) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm font-medium text-gray-800">
            <span className="inline-flex w-6 h-6 bg-green-800 text-white rounded-full items-center justify-center text-xs font-bold mr-2">{i + 1}</span>
            {q.question}
          </p>
          <div className="grid grid-cols-2 gap-2 ml-8">
            {JSON.parse(q.options || '[]').map((opt, oi) => (
              <button key={oi} onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                className={`text-sm text-left px-4 py-3 rounded-xl border transition-all ${
                  answers[q.id] === oi
                    ? 'bg-green-800 text-white border-green-800 font-medium'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-green-400 hover:bg-green-50'
                }`}>
                <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={submit} disabled={!allAnswered || loading}
        className="w-full btn-primary text-sm disabled:opacity-40">
        {loading ? 'Correction...' : allAnswered ? 'Soumettre mes réponses' : `${Object.keys(answers).length}/${quiz.questions.length} réponse${Object.keys(answers).length !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}

/* ── Course Chat ── */
function CourseChat({ courseId, currentUser }) {
  const [messages, setMessages]   = useState([]);
  const [text,     setText]       = useState('');
  const [file,     setFile]       = useState(null);
  const [sending,  setSending]    = useState(false);
  const [loading,  setLoading]    = useState(true);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/learning/courses/${courseId}/messages`);
      setMessages(res.data.messages || []);
    } catch { setMessages([]); } finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() && !file) return;
    setSending(true);
    try {
      if (file) {
        const fd = new FormData();
        if (text.trim()) fd.append('content', text.trim());
        fd.append('file', file);
        await api.post(`/learning/courses/${courseId}/messages`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post(`/learning/courses/${courseId}/messages`, { content: text.trim() });
      }
      setText(''); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchMessages();
    } catch (err) { console.error(err); } finally { setSending(false); }
  };

  const del = async (id) => {
    if (!confirm('Supprimer ce message ?')) return;
    try { await api.delete(`/learning/messages/${id}`); fetchMessages(); } catch {}
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-green-800 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Group messages by date
  let lastDate = '';

  return (
    <div className="flex flex-col h-full min-h-[400px] max-h-[600px]">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-1 px-1 py-2">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm">Aucun message pour le moment</p>
            <p className="text-xs mt-1">Soyez le premier à écrire !</p>
          </div>
        ) : messages.map((msg) => {
          const isMe = msg.userId === currentUser?.id;
          const date = fmtDate(msg.createdAt);
          const showDate = date !== lastDate;
          lastDate = date;
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{date}</span>
                </div>
              )}
              <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} group`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1 ${
                  msg.user.role === 'admin' ? 'bg-green-800 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {msg.user.firstName?.[0]}{msg.user.lastName?.[0]}
                </div>
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <p className={`text-[10px] text-gray-400 mb-0.5 ${isMe ? 'text-right' : ''}`}>
                    {isMe ? 'Moi' : `${msg.user.firstName} ${msg.user.lastName}`}
                    {msg.user.role === 'admin' && <span className="ml-1 text-green-700">· Admin</span>}
                  </p>
                  <div className={`rounded-2xl px-3 py-2 text-sm max-w-full ${
                    isMe ? 'bg-green-800 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                    {msg.filePath && (
                      <a href={msg.filePath} target="_blank" rel="noreferrer"
                        className={`flex items-center gap-2 mt-1 text-xs underline ${isMe ? 'text-green-200' : 'text-green-700'}`}>
                        <span>📎</span> {msg.fileName || 'Fichier joint'}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-300">{fmtTime(msg.createdAt)}</span>
                    {(isMe || currentUser?.role === 'admin') && (
                      <button onClick={() => del(msg.id)}
                        className="text-[10px] text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 pt-3 mt-2">
        {file && (
          <div className="flex items-center gap-2 mb-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <span>📎 {file.name}</span>
            <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
              className="ml-auto text-red-400 hover:text-red-600">×</button>
          </div>
        )}
        <div className="flex gap-2">
          <label className="flex-shrink-0 cursor-pointer text-gray-400 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,video/*,audio/*,image/*"
              onChange={e => setFile(e.target.files[0] || null)} />
          </label>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Écrire un message..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
          <button onClick={send} disabled={sending || (!text.trim() && !file)}
            className="flex-shrink-0 w-10 h-10 bg-green-800 text-white rounded-xl flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-40">
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Enrollment Modal ── */
function EnrollModal({ course, myEnrollment, onClose, onRequested }) {
  const [loading, setLoading] = useState(false);

  const request = async () => {
    setLoading(true);
    try {
      await api.post(`/learning/courses/${course.id}/enroll`);
      onRequested();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la demande');
    } finally { setLoading(false); }
  };

  const statusMsg = () => {
    if (!myEnrollment) return null;
    if (myEnrollment.status === 'pending')  return { icon: '⏳', text: 'Votre demande est en cours d\'examen. L\'administrateur vous approuvera bientôt.', color: 'amber' };
    if (myEnrollment.status === 'rejected') return { icon: '❌', text: 'Votre demande a été refusée. Contactez l\'administrateur pour plus d\'informations.', color: 'red' };
    return null;
  };
  const status = statusMsg();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className="text-5xl mb-3">{course.emoji}</div>
          <h3 className="font-bold text-gray-800 text-lg mb-1">{course.title}</h3>
          <p className="text-sm text-gray-500 mb-5">{course.description}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
            <div className="flex items-start gap-2">
              <span className="text-lg">🔒</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Cours restreint</p>
                <p className="text-xs text-amber-700 mt-1">Ce cours est accessible uniquement sur invitation ou après approbation de votre demande.</p>
              </div>
            </div>
          </div>

          {status ? (
            <div className={`rounded-xl p-4 mb-4 ${status.color === 'amber' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm font-medium ${status.color === 'amber' ? 'text-amber-800' : 'text-red-800'}`}>
                {status.icon} {status.text}
              </p>
            </div>
          ) : (
            <button onClick={request} disabled={loading}
              className="w-full btn-primary mb-3 disabled:opacity-40">
              {loading ? '...' : 'Demander l\'accès'}
            </button>
          )}

          <button onClick={onClose} className="w-full btn-secondary text-sm">Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ── Instructor Controls ── */
function InstructorLessonManager({ courseId, courseData, onRefresh }) {
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', videoUrl: '', order: 0 });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (modal?.id) {
        await api.put(`/learning/courses/${courseId}/lessons/${modal.id}`, form);
      } else {
        await api.post(`/learning/courses/${courseId}/lessons`, form);
      }
      setModal(null); setForm({ title: '', body: '', videoUrl: '', order: 0 }); onRefresh();
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Supprimer cette leçon ?')) return;
    try { await api.delete(`/learning/courses/${courseId}/lessons/${id}`); onRefresh(); } catch {}
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">⭐ Gestion des leçons</p>
        <button onClick={() => { setModal({}); setForm({ title: '', body: '', videoUrl: '', order: 0 }); }}
          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
          + Leçon
        </button>
      </div>

      {modal !== null && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-purple-800">{modal?.id ? 'Modifier' : 'Nouvelle leçon'}</p>
          <input value={form.title} onChange={set('title')} placeholder="Titre *"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          <textarea value={form.body} onChange={set('body')} rows={4} placeholder="Contenu..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono" />
          <input value={form.videoUrl} onChange={set('videoUrl')} placeholder="URL YouTube (optionnel)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          <div className="flex gap-2">
            <button onClick={() => setModal(null)} className="flex-1 btn-secondary text-xs">Annuler</button>
            <button onClick={save} disabled={saving || !form.title.trim()}
              className="flex-1 bg-purple-600 text-white text-xs py-2 rounded-xl hover:bg-purple-700 disabled:opacity-40">
              {saving ? '...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {courseData.lessons?.map((l, i) => (
        <div key={l.id} className="flex items-center gap-2 p-2.5 bg-purple-50 border border-purple-100 rounded-xl">
          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
          <p className="text-sm text-gray-700 truncate flex-1">{l.title}</p>
          <button onClick={() => { setModal(l); setForm({ title: l.title, body: l.body || '', videoUrl: l.videoUrl || '', order: l.order }); }}
            className="text-xs text-purple-500 hover:text-purple-700 p-1">✏️</button>
          <button onClick={() => del(l.id)} className="text-xs text-gray-300 hover:text-red-500 p-1">🗑️</button>
        </div>
      ))}
    </div>
  );
}

/* ── Main ── */
export default function MemberLearning() {
  const { user } = useAuth();
  const [view,        setView]        = useState('list');
  const [catFilter,   setCatFilter]   = useState('all');
  const [courses,     setCourses]     = useState([]);
  const [resources,   setResources]   = useState([]);
  const [stats,       setStats]       = useState({ lessonsCompleted: 0, quizzesPassed: 0 });
  const [courseData,  setCourseData]  = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeQuiz,   setActiveQuiz]   = useState(null);
  const [showChat,     setShowChat]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [lessonLoading, setLessonLoading] = useState('');
  const [enrollModal, setEnrollModal] = useState(null);

  const fetchList = useCallback(async () => {
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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const openCourse = useCallback(async (courseId) => {
    try {
      const res = await api.get(`/learning/courses/${courseId}`);
      setCourseData(res.data.course);
      setActiveLesson(res.data.course.lessons?.[0] || null);
      setActiveQuiz(null);
      setShowChat(false);
      setView('course');
    } catch (err) {
      if (err.response?.data?.restricted) {
        const course = courses.find(c => c.id === courseId);
        setEnrollModal({ course: course || { id: courseId }, myEnrollment: err.response.data.myEnrollment });
      } else {
        console.error(err);
      }
    }
  }, [courses]);

  const handleCourseClick = (course) => {
    if (course.restricted && (!course.myEnrollment || course.myEnrollment.status !== 'approved')) {
      setEnrollModal({ course, myEnrollment: course.myEnrollment });
    } else {
      openCourse(course.id);
    }
  };

  useEffect(() => { fetchList(); }, [fetchList]);

  const markComplete = async (lessonId) => {
    setLessonLoading(lessonId);
    try {
      await api.post(`/learning/lessons/${lessonId}/complete`);
      setCourseData(c => ({
        ...c,
        completedLessonIds: [...new Set([...(c.completedLessonIds || []), lessonId])],
      }));
      fetchList();
    } catch (err) { console.error(err); } finally { setLessonLoading(''); }
  };

  const refreshCourse = useCallback(async () => {
    if (!courseData?.id) return;
    try {
      const res = await api.get(`/learning/courses/${courseData.id}`);
      setCourseData(res.data.course);
    } catch {}
  }, [courseData?.id]);

  const filtered = catFilter === 'all' ? courses : courses.filter(c => c.category === catFilter);
  const embedUrl = activeLesson ? getYouTubeEmbed(activeLesson.videoUrl) : null;

  const completedIds  = new Set(courseData?.completedLessonIds || []);
  const totalLessons  = courseData?.lessons?.length || 0;
  const completedCount = courseData?.lessons?.filter(l => completedIds.has(l.id)).length || 0;
  const progress      = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isInstructor  = courseData?.myEnrollment?.role === 'instructor';

  const enrollStatusBadge = (e) => {
    if (!e) return null;
    if (e.status === 'pending')  return <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⏳ En attente</span>;
    if (e.status === 'rejected') return <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">✗ Refusé</span>;
    if (e.status === 'approved' && e.role === 'instructor') return <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">⭐ Formateur</span>;
    return null;
  };

  return (
    <MemberLayout title="Apprentissage">
      {/* ── Enrollment Modal ── */}
      {enrollModal && (
        <EnrollModal
          course={enrollModal.course}
          myEnrollment={enrollModal.myEnrollment}
          onClose={() => setEnrollModal(null)}
          onRequested={() => { fetchList(); setEnrollModal(null); }}
        />
      )}

      {/* ── COURSE VIEW ── */}
      {view === 'course' && courseData ? (
        <div className="space-y-4">
          {/* Back + header */}
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('list'); setCourseData(null); }}
              className="text-green-700 hover:text-green-800 text-sm flex items-center gap-1 font-medium">
              ← Retour
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="min-w-0 flex-1">
              <h2 className="text-gray-800 font-semibold text-base truncate">
                {courseData.emoji} {courseData.title}
              </h2>
            </div>
            {isInstructor && (
              <span className="flex-shrink-0 text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">⭐ Formateur</span>
            )}
          </div>

          {/* Progress bar */}
          {totalLessons > 0 && (
            <div className="card py-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{completedCount}/{totalLessons} leçon{totalLessons !== 1 ? 's' : ''} terminée{completedCount !== 1 ? 's' : ''}</span>
                <span className="font-semibold text-green-700">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Sidebar ── */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Leçons</h3>
              {courseData.lessons?.map((lesson, i) => {
                const done   = completedIds.has(lesson.id);
                const active = activeLesson?.id === lesson.id && !activeQuiz && !showChat;
                return (
                  <button key={lesson.id} onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); setShowChat(false); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      active ? 'bg-green-800 border-green-800 text-white'
                      : done  ? 'bg-green-50 border-green-200 text-gray-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
                    }`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      active ? 'bg-white/20 text-white' : done ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>{done && !active ? '✓' : i + 1}</span>
                    <span className="text-sm font-medium truncate">{lesson.title}</span>
                    {lesson.videoUrl && <span className="text-xs flex-shrink-0 opacity-60">🎬</span>}
                  </button>
                );
              })}

              {/* Quizzes */}
              {courseData.quizzes?.map(quiz => (
                <button key={quiz.id} onClick={() => { setActiveQuiz(quiz); setActiveLesson(null); setShowChat(false); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 mt-2 ${
                    activeQuiz?.id === quiz.id && !showChat ? 'bg-blue-800 border-blue-800 text-white' : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                  }`}>
                  <span className="text-lg">🧩</span>
                  <span className="text-sm font-medium">{quiz.title}</span>
                  {courseData.myAttempts?.some(a => a.quizId === quiz.id) && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Déjà tenté</span>
                  )}
                </button>
              ))}

              {/* Resources */}
              {courseData.resources?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Ressources</h3>
                  {courseData.resources.map(r => (
                    <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                      className="w-full flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl hover:border-green-300 transition-colors text-left">
                      <span className="text-base">{RES_ICON[r.type] || '🔗'}</span>
                      <span className="text-xs text-gray-700 font-medium truncate flex-1">{r.title}</span>
                      {r.fileName && <span className="text-[10px] text-gray-400 flex-shrink-0">↓</span>}
                    </a>
                  ))}
                </div>
              )}

              {/* Chat button */}
              <div className="mt-4">
                <button onClick={() => { setShowChat(!showChat); setActiveLesson(null); setActiveQuiz(null); }}
                  className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    showChat ? 'bg-green-800 border-green-800 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                  }`}>
                  <span className="text-lg">💬</span>
                  <span className="text-sm font-medium">Chat du cours</span>
                </button>
              </div>

              {/* Instructor lesson manager */}
              {isInstructor && (
                <InstructorLessonManager
                  courseId={courseData.id}
                  courseData={courseData}
                  onRefresh={refreshCourse}
                />
              )}
            </div>

            {/* ── Main content area ── */}
            <div className="lg:col-span-2">
              {/* Chat view */}
              {showChat && (
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    💬 <span>Chat du cours</span>
                  </h3>
                  <CourseChat courseId={courseData.id} currentUser={user} />
                </div>
              )}

              {/* Lesson view */}
              {activeLesson && !activeQuiz && !showChat && (
                <div className="card space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-gray-800 text-lg leading-snug">{activeLesson.title}</h3>
                    {!completedIds.has(activeLesson.id) ? (
                      <button onClick={() => markComplete(activeLesson.id)}
                        disabled={lessonLoading === activeLesson.id}
                        className="flex-shrink-0 text-xs border border-green-600 text-green-700 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors disabled:opacity-40">
                        {lessonLoading === activeLesson.id ? '...' : '✓ Marquer comme terminé'}
                      </button>
                    ) : (
                      <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 rounded-lg px-3 py-1.5 font-medium">✓ Terminée</span>
                    )}
                  </div>

                  {embedUrl && (
                    <div className="rounded-xl overflow-hidden aspect-video bg-black">
                      <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                        title={activeLesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    </div>
                  )}

                  {activeLesson.body && (
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {activeLesson.body}
                    </div>
                  )}

                  {!activeLesson.body && !embedUrl && (
                    <p className="text-gray-400 text-sm text-center py-8">Contenu à venir…</p>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    {(() => {
                      const idx  = courseData.lessons.findIndex(l => l.id === activeLesson.id);
                      const prev = idx > 0 ? courseData.lessons[idx - 1] : null;
                      const next = idx < courseData.lessons.length - 1 ? courseData.lessons[idx + 1] : null;
                      return (
                        <>
                          <button onClick={() => prev && setActiveLesson(prev)} disabled={!prev}
                            className="text-sm text-gray-500 hover:text-green-700 disabled:opacity-30 flex items-center gap-1">
                            ← Précédent
                          </button>
                          {!completedIds.has(activeLesson.id) ? (
                            <button onClick={() => markComplete(activeLesson.id)}
                              disabled={lessonLoading === activeLesson.id}
                              className="btn-primary text-sm disabled:opacity-40">
                              {lessonLoading === activeLesson.id ? '...' : next ? 'Terminé → Suivant' : 'Terminer la leçon'}
                            </button>
                          ) : next ? (
                            <button onClick={() => setActiveLesson(next)} className="btn-primary text-sm">
                              Leçon suivante →
                            </button>
                          ) : (
                            <span className="text-sm text-green-700 font-medium">🎉 Cours terminé !</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Quiz view */}
              {activeQuiz && !showChat && (
                <div className="card space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">🧩 {activeQuiz.title}</h3>
                    {activeQuiz.description && <p className="text-sm text-gray-500 mt-1">{activeQuiz.description}</p>}
                  </div>
                  <QuizPlayer quiz={activeQuiz} onFinish={() => { fetchList(); refreshCourse(); }} />
                </div>
              )}

              {/* Empty state */}
              {!activeLesson && !activeQuiz && !showChat && (
                <div className="card text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">👈</p>
                  <p className="text-sm">Sélectionnez une leçon pour commencer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="space-y-6">
          {/* Stats banner */}
          {!loading && (stats.lessonsCompleted > 0 || stats.quizzesPassed > 0) && (
            <div className="card bg-gradient-to-r from-green-800 to-green-700 text-white py-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.lessonsCompleted}</p>
                  <p className="text-xs text-green-200 mt-0.5">leçon{stats.lessonsCompleted !== 1 ? 's' : ''} terminée{stats.lessonsCompleted !== 1 ? 's' : ''}</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.quizzesPassed}</p>
                  <p className="text-xs text-green-200 mt-0.5">quiz réussi{stats.quizzesPassed !== 1 ? 's' : ''}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium">Continuez ainsi !</p>
                  <p className="text-xs text-green-200">Votre progression est sauvegardée</p>
                </div>
              </div>
            </div>
          )}

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setCatFilter(c.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  catFilter === c.value ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-sm">Aucun cours disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => {
                const locked  = c.restricted && (!c.myEnrollment || c.myEnrollment.status !== 'approved');
                const pending = c.myEnrollment?.status === 'pending';
                return (
                  <button key={c.id} onClick={() => handleCourseClick(c)}
                    className={`card text-left transition-all group border ${
                      locked ? 'hover:border-amber-300 border-gray-200 opacity-90' : 'hover:shadow-md hover:border-green-200 border-gray-200'
                    }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-4xl">{c.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-1.5">
                          <h3 className={`font-semibold leading-snug transition-colors ${locked ? 'text-gray-600' : 'text-gray-800 group-hover:text-green-800'}`}>
                            {c.title}
                          </h3>
                          {c.restricted && <span className="text-base flex-shrink-0">🔒</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${LEVEL_COLOR[c.level] || LEVEL_COLOR.tous}`}>
                            {c.level === 'tous' ? 'Tous niveaux' : c.level.charAt(0).toUpperCase() + c.level.slice(1)}
                          </span>
                          {enrollStatusBadge(c.myEnrollment)}
                        </div>
                      </div>
                    </div>
                    {c.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{c.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                      <span>{c._count.lessons} leçon{c._count.lessons !== 1 ? 's' : ''}</span>
                      {c._count.quizzes > 0 && <span>🧩 {c._count.quizzes} quiz</span>}
                      <span className={`font-medium ${locked ? (pending ? 'text-amber-600' : 'text-amber-700') : 'text-green-700 group-hover:underline'}`}>
                        {locked ? (pending ? 'En attente →' : 'Demander accès →') : 'Commencer →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Standalone resources */}
          {resources.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ressources & Documents utiles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resources.map(r => (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                    className="card flex items-start gap-3 hover:shadow-md hover:border-green-200 border border-gray-200 transition-all group">
                    <span className="text-2xl flex-shrink-0">{RES_ICON[r.type] || '🔗'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-green-800 transition-colors">{r.title}</p>
                      {r.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>}
                      <p className="text-xs text-green-700 mt-1 font-medium group-hover:underline">
                        {r.fileName ? '↓ Télécharger' : 'Ouvrir →'}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </MemberLayout>
  );
}
