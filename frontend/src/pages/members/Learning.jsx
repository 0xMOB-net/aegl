import { useState, useEffect, useCallback } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import api from '../../api/client';

const CATEGORIES = [
  { value: 'all',           label: 'Tout',               emoji: '📚' },
  { value: 'francais',      label: 'Français',           emoji: '🇫🇷' },
  { value: 'anglais',       label: 'Anglais',            emoji: '🇬🇧' },
  { value: 'universitaire', label: 'Vie universitaire',  emoji: '🎓' },
  { value: 'pratique',      label: 'Vie pratique',       emoji: '🏙️' },
  { value: 'culture',       label: 'Culture & Société',  emoji: '🌍' },
  { value: 'general',       label: 'Général',            emoji: '📖' },
];

const LEVEL_COLOR = {
  debutant:      'bg-green-100 text-green-700',
  intermediaire: 'bg-blue-100 text-blue-700',
  avance:        'bg-purple-100 text-purple-700',
  tous:          'bg-gray-100 text-gray-600',
};

const getYouTubeEmbed = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

/* ── Quiz component ── */
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    const passed = pct >= 50;
    return (
      <div className="space-y-5">
        {/* Score */}
        <div className={`rounded-2xl p-6 text-center border-2 ${passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200'}`}>
          <p className="text-5xl font-bold mb-1" style={{ color: passed ? '#16a34a' : '#dc2626' }}>
            {result.score}/{result.total}
          </p>
          <p className="text-lg font-semibold text-gray-700">{pct}%</p>
          <p className="text-sm text-gray-500 mt-1">
            {passed ? '🎉 Bien joué ! Vous avez réussi ce quiz.' : '💪 Continuez vos efforts, vous pouvez refaire le quiz.'}
          </p>
        </div>

        {/* Correction */}
        <div className="space-y-4">
          {result.results.map((r, i) => (
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
                  }`}>
                    {String.fromCharCode(65 + oi)}. {opt}
                  </div>
                ))}
              </div>
              {r.explanation && (
                <p className="text-xs text-gray-500 mt-2 ml-7 italic">💡 {r.explanation}</p>
              )}
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
      <p className="text-sm text-gray-500">{quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''} · Sélectionnez une réponse par question</p>
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

/* ── Main ── */
export default function MemberLearning() {
  const [view,       setView]       = useState('list'); // list | course | quiz
  const [catFilter,  setCatFilter]  = useState('all');
  const [courses,    setCourses]    = useState([]);
  const [resources,  setResources]  = useState([]);
  const [stats,      setStats]      = useState({ lessonsCompleted: 0, quizzesPassed: 0 });
  const [courseData, setCourseData] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeQuiz,   setActiveQuiz]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lessonLoading, setLessonLoading] = useState('');

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const openCourse = useCallback(async (courseId) => {
    try {
      const res = await api.get(`/learning/courses/${courseId}`);
      setCourseData(res.data.course);
      setActiveLesson(res.data.course.lessons?.[0] || null);
      setActiveQuiz(null);
      setView('course');
    } catch (err) {
      console.error(err);
    }
  }, []);

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
    } catch (err) { console.error(err); }
    finally { setLessonLoading(''); }
  };

  const filtered = catFilter === 'all' ? courses : courses.filter(c => c.category === catFilter);
  const embedUrl = activeLesson ? getYouTubeEmbed(activeLesson.videoUrl) : null;

  const completedIds = new Set(courseData?.completedLessonIds || []);
  const totalLessons = courseData?.lessons?.length || 0;
  const completedCount = courseData?.lessons?.filter(l => completedIds.has(l.id)).length || 0;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <MemberLayout title="Apprentissage">
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
            <div className="min-w-0">
              <h2 className="text-gray-800 font-semibold text-base truncate">
                {courseData.emoji} {courseData.title}
              </h2>
            </div>
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
            {/* ── Lessons sidebar ── */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Leçons</h3>
              {courseData.lessons?.map((lesson, i) => {
                const done = completedIds.has(lesson.id);
                const active = activeLesson?.id === lesson.id && !activeQuiz;
                return (
                  <button key={lesson.id} onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      active ? 'bg-green-800 border-green-800 text-white'
                      : done  ? 'bg-green-50 border-green-200 text-gray-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
                    }`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      active ? 'bg-white/20 text-white' :
                      done   ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {done && !active ? '✓' : i + 1}
                    </span>
                    <span className="text-sm font-medium truncate">{lesson.title}</span>
                    {lesson.videoUrl && <span className="text-xs flex-shrink-0 opacity-60">🎬</span>}
                  </button>
                );
              })}

              {/* Quiz button */}
              {courseData.quizzes?.map(quiz => (
                <button key={quiz.id} onClick={() => { setActiveQuiz(quiz); setActiveLesson(null); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 mt-2 ${
                    activeQuiz?.id === quiz.id ? 'bg-blue-800 border-blue-800 text-white' : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
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
                      <span className="text-base">{r.type === 'pdf' ? '📄' : r.type === 'video' ? '🎬' : '🔗'}</span>
                      <span className="text-xs text-gray-700 font-medium truncate">{r.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ── Lesson / Quiz content ── */}
            <div className="lg:col-span-2">
              {activeLesson && !activeQuiz && (
                <div className="card space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-gray-800 text-lg leading-snug">{activeLesson.title}</h3>
                    {!completedIds.has(activeLesson.id) && (
                      <button onClick={() => markComplete(activeLesson.id)}
                        disabled={lessonLoading === activeLesson.id}
                        className="flex-shrink-0 text-xs border border-green-600 text-green-700 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors disabled:opacity-40">
                        {lessonLoading === activeLesson.id ? '...' : '✓ Marquer comme terminé'}
                      </button>
                    )}
                    {completedIds.has(activeLesson.id) && (
                      <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 rounded-lg px-3 py-1.5 font-medium">✓ Terminée</span>
                    )}
                  </div>

                  {/* Embedded video */}
                  {embedUrl && (
                    <div className="rounded-xl overflow-hidden aspect-video bg-black">
                      <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                        title={activeLesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    </div>
                  )}

                  {/* Lesson body */}
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
                      const idx = courseData.lessons.findIndex(l => l.id === activeLesson.id);
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

              {activeQuiz && (
                <div className="card space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">🧩 {activeQuiz.title}</h3>
                    {activeQuiz.description && <p className="text-sm text-gray-500 mt-1">{activeQuiz.description}</p>}
                  </div>
                  <QuizPlayer quiz={activeQuiz} onFinish={() => {
                    fetchList();
                    openCourse(courseData.id);
                  }} />
                </div>
              )}

              {!activeLesson && !activeQuiz && (
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
                  catFilter === c.value
                    ? 'bg-green-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <p className="text-xs mt-1">Revenez bientôt, du contenu arrive !</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(c => {
                  const total     = c._count.lessons;
                  return (
                    <button key={c.id} onClick={() => openCourse(c.id)}
                      className="card text-left hover:shadow-md transition-all hover:border-green-200 border border-gray-200 group">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-4xl">{c.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-green-800 transition-colors leading-snug">{c.title}</h3>
                          <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${LEVEL_COLOR[c.level] || LEVEL_COLOR.tous}`}>
                            {c.level === 'tous' ? 'Tous niveaux' : c.level.charAt(0).toUpperCase() + c.level.slice(1)}
                          </span>
                        </div>
                      </div>
                      {c.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{c.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                        <span>{total} leçon{total !== 1 ? 's' : ''}</span>
                        {c._count.quizzes > 0 && <span>🧩 {c._count.quizzes} quiz</span>}
                        <span className="text-green-700 font-medium group-hover:underline">Commencer →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Standalone resources */}
          {resources.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ressources & Documents utiles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resources.map(r => (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                    className="card flex items-start gap-3 hover:shadow-md hover:border-green-200 border border-gray-200 transition-all group">
                    <span className="text-2xl flex-shrink-0">{r.type === 'pdf' ? '📄' : r.type === 'video' ? '🎬' : '🔗'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-green-800 transition-colors">{r.title}</p>
                      {r.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>}
                      <p className="text-xs text-green-700 mt-1 font-medium group-hover:underline">Ouvrir →</p>
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
