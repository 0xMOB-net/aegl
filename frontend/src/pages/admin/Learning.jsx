import { useState, useEffect, useCallback } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import api from '../../api/client';

const CATEGORIES = [
  { value: 'francais',      label: 'Français',           emoji: '🇫🇷' },
  { value: 'anglais',       label: 'Anglais',            emoji: '🇬🇧' },
  { value: 'universitaire', label: 'Vie universitaire',  emoji: '🎓' },
  { value: 'pratique',      label: 'Vie pratique',       emoji: '🏙️' },
  { value: 'culture',       label: 'Culture & Société',  emoji: '🌍' },
  { value: 'general',       label: 'Général',            emoji: '📚' },
];
const LEVELS = [
  { value: 'tous',          label: 'Tous niveaux' },
  { value: 'debutant',      label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance',        label: 'Avancé' },
];
const RES_TYPES = [
  { value: 'link',  label: 'Lien web',  icon: '🔗' },
  { value: 'pdf',   label: 'PDF',       icon: '📄' },
  { value: 'video', label: 'Vidéo',     icon: '🎬' },
];

/* ── Helpers ── */
const catLabel   = v => CATEGORIES.find(c => c.value === v)?.label || v;
const catEmoji   = v => CATEGORIES.find(c => c.value === v)?.emoji || '📚';
const levelLabel = v => LEVELS.find(l => l.value === v)?.label || v;

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Course Form ── */
function CourseForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    title:       initial?.title       || '',
    description: initial?.description || '',
    category:    initial?.category    || 'general',
    level:       initial?.level       || 'tous',
    emoji:       initial?.emoji       || '📚',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="w-20">
          <label className="text-xs text-gray-500 block mb-1">Emoji</label>
          <input value={form.emoji} onChange={set('emoji')} maxLength={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-green-600" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">Titre *</label>
          <input value={form.title} onChange={set('title')} placeholder="Ex : Les bases du français..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Description</label>
        <textarea value={form.description} onChange={set('description')} rows={3}
          placeholder="Décrivez ce cours en quelques lignes..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Catégorie</label>
          <select value={form.category} onChange={set('category')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Niveau</label>
          <select value={form.level} onChange={set('level')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
            {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 btn-secondary text-sm">Annuler</button>
        <button onClick={() => onSave(form)} disabled={loading || !form.title.trim()}
          className="flex-1 btn-primary text-sm disabled:opacity-40">
          {loading ? '...' : initial ? 'Mettre à jour' : 'Créer le cours'}
        </button>
      </div>
    </div>
  );
}

/* ── Lesson Form ── */
function LessonForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    title:    initial?.title    || '',
    body:     initial?.body     || '',
    videoUrl: initial?.videoUrl || '',
    order:    initial?.order    ?? 0,
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-3">
          <label className="text-xs text-gray-500 block mb-1">Titre de la leçon *</label>
          <input value={form.title} onChange={set('title')} placeholder="Ex : Présentation en français..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Ordre</label>
          <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: +e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Contenu (texte)</label>
        <textarea value={form.body} onChange={set('body')} rows={6}
          placeholder="Écrivez le contenu de la leçon ici..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600 font-mono" />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Lien vidéo YouTube (optionnel)</label>
        <input value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://www.youtube.com/watch?v=..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 btn-secondary text-sm">Annuler</button>
        <button onClick={() => onSave(form)} disabled={loading || !form.title.trim()}
          className="flex-1 btn-primary text-sm disabled:opacity-40">
          {loading ? '...' : initial ? 'Mettre à jour' : 'Ajouter la leçon'}
        </button>
      </div>
    </div>
  );
}

/* ── Quiz Builder ── */
function QuizBuilder({ initial, courseId, onSave, onCancel, loading }) {
  const [title, setTitle]       = useState(initial?.title       || '');
  const [desc,  setDesc]        = useState(initial?.description || '');
  const [questions, setQuestions] = useState(
    initial?.questions?.map(q => ({
      question:    q.question,
      options:     JSON.parse(q.options),
      correct:     q.correct,
      explanation: q.explanation || '',
    })) || []
  );

  const addQuestion = () => setQuestions(qs => [
    ...qs,
    { question: '', options: ['', '', '', ''], correct: 0, explanation: '' },
  ]);

  const updateQ = (i, field, val) =>
    setQuestions(qs => qs.map((q, j) => j === i ? { ...q, [field]: val } : q));

  const updateOpt = (qi, oi, val) =>
    setQuestions(qs => qs.map((q, j) => j === qi
      ? { ...q, options: q.options.map((o, k) => k === oi ? val : o) }
      : q));

  const removeQ = i => setQuestions(qs => qs.filter((_, j) => j !== i));

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Titre du quiz *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex : QCM - Vocabulaire de base"
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Description (optionnel)</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex : Testez vos connaissances..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
          <button onClick={addQuestion}
            className="text-xs text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors">
            + Ajouter une question
          </button>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-green-800 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
              <input value={q.question} onChange={e => updateQ(i, 'question', e.target.value)}
                placeholder="Question..."
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              <button onClick={() => removeQ(i)} className="text-red-400 hover:text-red-600 text-lg leading-none ml-1">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2 ml-8">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  q.correct === oi ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                }`}>
                  <input type="radio" name={`q${i}`} checked={q.correct === oi}
                    onChange={() => updateQ(i, 'correct', oi)} className="accent-green-600" />
                  <input value={opt} onChange={e => updateOpt(i, oi, e.target.value)}
                    placeholder={`Choix ${String.fromCharCode(65 + oi)}`}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 bg-transparent outline-none text-sm" />
                </label>
              ))}
            </div>
            <div className="ml-8">
              <input value={q.explanation} onChange={e => updateQ(i, 'explanation', e.target.value)}
                placeholder="Explication de la bonne réponse (optionnel)"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 btn-secondary text-sm">Annuler</button>
        <button onClick={() => onSave({ title, description: desc, courseId, questions })}
          disabled={loading || !title.trim() || questions.length === 0}
          className="flex-1 btn-primary text-sm disabled:opacity-40">
          {loading ? '...' : initial ? 'Mettre à jour le quiz' : 'Créer le quiz'}
        </button>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function AdminLearning() {
  const [tab, setTab]             = useState('courses');
  const [courses, setCourses]     = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving,  setSaving]      = useState(false);

  // Modals
  const [modal, setModal] = useState(null);
  // { type: 'course'|'lesson'|'quiz'|'resource', data: {...} }

  // Selected course for content management
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseTab, setCourseTab]           = useState('lessons');
  const [courseDetail, setCourseDetail]     = useState(null);

  const toast = msg => { /* simple — handled via alert for now */ };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        api.get('/learning/courses'),
        api.get('/learning/resources'),
      ]);
      setCourses(cRes.data.courses || []);
      setResources(rRes.data.resources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourse = useCallback(async (id) => {
    try {
      const res = await api.get(`/learning/courses/${id}`);
      setCourseDetail(res.data.course);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (selectedCourse) fetchCourse(selectedCourse.id);
    else setCourseDetail(null);
  }, [selectedCourse, fetchCourse]);

  /* ── Course actions ── */
  const saveCourse = async (form) => {
    setSaving(true);
    try {
      if (modal?.data?.id) {
        await api.put(`/learning/courses/${modal.data.id}`, form);
      } else {
        await api.post('/learning/courses', form);
      }
      setModal(null);
      fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (course) => {
    try {
      await api.put(`/learning/courses/${course.id}`, { ...course, published: !course.published });
      fetchAll();
      if (selectedCourse?.id === course.id) setSelectedCourse(c => ({ ...c, published: !c.published }));
    } catch (err) { console.error(err); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Supprimer ce cours et tout son contenu ?')) return;
    try {
      await api.delete(`/learning/courses/${id}`);
      if (selectedCourse?.id === id) setSelectedCourse(null);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  /* ── Lesson actions ── */
  const saveLesson = async (form) => {
    setSaving(true);
    try {
      if (modal?.data?.id) {
        await api.put(`/learning/courses/${selectedCourse.id}/lessons/${modal.data.id}`, form);
      } else {
        await api.post(`/learning/courses/${selectedCourse.id}/lessons`, form);
      }
      setModal(null);
      fetchCourse(selectedCourse.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!confirm('Supprimer cette leçon ?')) return;
    try {
      await api.delete(`/learning/courses/${selectedCourse.id}/lessons/${lessonId}`);
      fetchCourse(selectedCourse.id);
    } catch (err) { console.error(err); }
  };

  /* ── Resource actions ── */
  const saveResource = async (form) => {
    setSaving(true);
    try {
      await api.post('/learning/resources', { ...form, courseId: modal?.data?.courseId || null });
      setModal(null);
      fetchAll();
      if (selectedCourse) fetchCourse(selectedCourse.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteResource = async (id) => {
    if (!confirm('Supprimer cette ressource ?')) return;
    try {
      await api.delete(`/learning/resources/${id}`);
      fetchAll();
      if (selectedCourse) fetchCourse(selectedCourse.id);
    } catch (err) { console.error(err); }
  };

  /* ── Quiz actions ── */
  const saveQuiz = async (form) => {
    setSaving(true);
    try {
      if (modal?.data?.id) {
        await api.put(`/learning/quizzes/${modal.data.id}`, form);
      } else {
        await api.post('/learning/quizzes', form);
      }
      setModal(null);
      if (selectedCourse) fetchCourse(selectedCourse.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async (id) => {
    if (!confirm('Supprimer ce quiz ?')) return;
    try {
      await api.delete(`/learning/quizzes/${id}`);
      if (selectedCourse) fetchCourse(selectedCourse.id);
    } catch (err) { console.error(err); }
  };

  /* ── Resource inline form ── */
  const [resForm, setResForm] = useState({ title: '', description: '', type: 'link', url: '', courseId: null });
  const [showResForm, setShowResForm] = useState(false);
  const setRes = k => e => setResForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <MemberLayout title="Apprentissage">
      {/* ── Modal overlay ── */}
      {modal?.type === 'course' && (
        <Modal title={modal.data?.id ? 'Modifier le cours' : 'Nouveau cours'} onClose={() => setModal(null)}>
          <CourseForm initial={modal.data} onSave={saveCourse} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}
      {modal?.type === 'lesson' && (
        <Modal title={modal.data?.id ? 'Modifier la leçon' : 'Nouvelle leçon'} onClose={() => setModal(null)}>
          <LessonForm initial={modal.data} onSave={saveLesson} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}
      {modal?.type === 'quiz' && (
        <Modal title={modal.data?.id ? 'Modifier le quiz' : 'Créer un quiz'} onClose={() => setModal(null)}>
          <QuizBuilder initial={modal.data} courseId={selectedCourse?.id} onSave={saveQuiz} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      <div className="space-y-6">
        {/* ── Tabs ── */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ v: 'courses', l: '📚 Cours' }, { v: 'resources', l: '🗂️ Ressources' }].map(t => (
              <button key={t.v} onClick={() => setTab(t.v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.v ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>{t.l}</button>
            ))}
          </div>
          {tab === 'courses' && (
            <button onClick={() => setModal({ type: 'course', data: null })}
              className="btn-primary text-sm">+ Nouveau cours</button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : tab === 'courses' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Course list (left) ── */}
            <div className="lg:col-span-1 space-y-3">
              {courses.length === 0 ? (
                <div className="card text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">📚</p>
                  <p className="text-sm">Aucun cours pour le moment</p>
                </div>
              ) : courses.map(c => (
                <div key={c.id}
                  onClick={() => setSelectedCourse(selectedCourse?.id === c.id ? null : c)}
                  className={`card cursor-pointer transition-all hover:shadow-md ${
                    selectedCourse?.id === c.id ? 'ring-2 ring-green-600 bg-green-50' : ''
                  }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{c.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate text-sm">{c.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{catLabel(c.category)} · {levelLabel(c.level)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{c._count.lessons} leçon{c._count.lessons !== 1 ? 's' : ''}</span>
                        {c._count.quizzes > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{c._count.quizzes} quiz</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); togglePublish(c); }}
                        className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${
                          c.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {c.published ? '● Publié' : '○ Brouillon'}
                      </button>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); setModal({ type: 'course', data: c }); }}
                          className="text-xs text-gray-400 hover:text-green-700 p-1">✏️</button>
                        <button onClick={e => { e.stopPropagation(); deleteCourse(c.id); }}
                          className="text-xs text-gray-400 hover:text-red-500 p-1">🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Course content manager (right) ── */}
            <div className="lg:col-span-2">
              {!selectedCourse ? (
                <div className="card text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">👈</p>
                  <p className="text-sm">Sélectionnez un cours pour gérer son contenu</p>
                </div>
              ) : !courseDetail ? (
                <div className="card flex justify-center py-16">
                  <div className="w-6 h-6 border-2 border-green-800 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="card">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <span className="text-3xl">{courseDetail.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{courseDetail.title}</h3>
                      <p className="text-xs text-gray-400">{catLabel(courseDetail.category)} · {levelLabel(courseDetail.level)}</p>
                    </div>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex gap-1 bg-gray-50 rounded-xl p-1 mb-5">
                    {[
                      { v: 'lessons',   l: `Leçons (${courseDetail.lessons?.length || 0})` },
                      { v: 'quiz',      l: `Quiz (${courseDetail.quizzes?.length || 0})` },
                      { v: 'resources', l: `Ressources (${courseDetail.resources?.length || 0})` },
                    ].map(t => (
                      <button key={t.v} onClick={() => setCourseTab(t.v)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          courseTab === t.v ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500'
                        }`}>{t.l}</button>
                    ))}
                  </div>

                  {/* ── Leçons ── */}
                  {courseTab === 'lessons' && (
                    <div className="space-y-3">
                      <button onClick={() => setModal({ type: 'lesson', data: null })}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-green-400 hover:text-green-700 transition-colors">
                        + Ajouter une leçon
                      </button>
                      {courseDetail.lessons?.map((lesson, i) => (
                        <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <span className="w-6 h-6 rounded-full bg-green-800 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lesson.body && <span className="text-[10px] text-gray-400">📝 Texte</span>}
                              {lesson.videoUrl && <span className="text-[10px] text-gray-400">🎬 Vidéo</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => setModal({ type: 'lesson', data: lesson })}
                              className="text-xs text-gray-400 hover:text-green-700 p-1.5 hover:bg-white rounded-lg">✏️</button>
                            <button onClick={() => deleteLesson(lesson.id)}
                              className="text-xs text-gray-400 hover:text-red-500 p-1.5 hover:bg-white rounded-lg">🗑️</button>
                          </div>
                        </div>
                      ))}
                      {courseDetail.lessons?.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">Aucune leçon pour le moment</p>
                      )}
                    </div>
                  )}

                  {/* ── Quiz ── */}
                  {courseTab === 'quiz' && (
                    <div className="space-y-3">
                      {courseDetail.quizzes?.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-gray-400 text-sm mb-3">Aucun quiz pour ce cours</p>
                          <button onClick={() => setModal({ type: 'quiz', data: null })}
                            className="btn-primary text-sm">Créer un quiz</button>
                        </div>
                      ) : courseDetail.quizzes.map(quiz => (
                        <div key={quiz.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-800 text-sm">🧩 {quiz.title}</p>
                              {quiz.description && <p className="text-xs text-gray-500 mt-0.5">{quiz.description}</p>}
                              <p className="text-xs text-blue-600 mt-1">{quiz.questions?.length || 0} question{quiz.questions?.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setModal({ type: 'quiz', data: { ...quiz, questions: quiz.questions } })}
                                className="text-xs text-gray-400 hover:text-green-700 p-1.5 hover:bg-white rounded-lg">✏️</button>
                              <button onClick={() => deleteQuiz(quiz.id)}
                                className="text-xs text-gray-400 hover:text-red-500 p-1.5 hover:bg-white rounded-lg">🗑️</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {courseDetail.quizzes?.length > 0 && (
                        <button onClick={() => setModal({ type: 'quiz', data: null })}
                          className="w-full border-2 border-dashed border-blue-200 rounded-xl py-2 text-sm text-blue-400 hover:border-blue-400 hover:text-blue-600 transition-colors">
                          + Ajouter un autre quiz
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── Ressources ── */}
                  {courseTab === 'resources' && (
                    <div className="space-y-3">
                      {/* Quick add form */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                        <p className="text-xs font-medium text-gray-600">Ajouter une ressource à ce cours</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={resForm.title} onChange={setRes('title')} placeholder="Titre *"
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                          <select value={resForm.type} onChange={setRes('type')}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                            {RES_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                          </select>
                        </div>
                        <input value={resForm.url} onChange={setRes('url')} placeholder="URL *"
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                        <button onClick={async () => {
                          if (!resForm.title || !resForm.url) return;
                          setSaving(true);
                          try {
                            await api.post('/learning/resources', { ...resForm, courseId: selectedCourse.id });
                            setResForm({ title: '', description: '', type: 'link', url: '', courseId: null });
                            fetchCourse(selectedCourse.id);
                          } catch (err) { console.error(err); } finally { setSaving(false); }
                        }} disabled={saving || !resForm.title || !resForm.url}
                          className="btn-primary text-xs py-1.5 disabled:opacity-40">
                          {saving ? '...' : 'Ajouter'}
                        </button>
                      </div>
                      {courseDetail.resources?.map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <span className="text-lg">{RES_TYPES.find(t => t.value === r.type)?.icon || '🔗'}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                            <p className="text-xs text-gray-400 truncate">{r.url}</p>
                          </div>
                          <button onClick={() => deleteResource(r.id)}
                            className="text-gray-400 hover:text-red-500 text-lg flex-shrink-0">×</button>
                        </div>
                      ))}
                      {courseDetail.resources?.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-2">Aucune ressource pour ce cours</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Ressources standalone ── */
          <div className="space-y-4">
            <div className="card space-y-3">
              <p className="text-sm font-medium text-gray-700">Ajouter une ressource générale</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={resForm.title} onChange={setRes('title')} placeholder="Titre *"
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                <input value={resForm.url} onChange={setRes('url')} placeholder="URL *"
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                <select value={resForm.type} onChange={setRes('type')}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                  {RES_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <input value={resForm.description} onChange={setRes('description')} placeholder="Description (optionnel)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              <button onClick={async () => {
                if (!resForm.title || !resForm.url) return;
                setSaving(true);
                try {
                  await api.post('/learning/resources', { ...resForm, courseId: null });
                  setResForm({ title: '', description: '', type: 'link', url: '' });
                  fetchAll();
                } catch (err) { console.error(err); } finally { setSaving(false); }
              }} disabled={saving || !resForm.title || !resForm.url} className="btn-primary text-sm disabled:opacity-40">
                {saving ? '...' : 'Ajouter la ressource'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">🗂️</p>
                  <p className="text-sm">Aucune ressource générale</p>
                </div>
              ) : resources.map(r => (
                <div key={r.id} className="card flex items-start gap-3">
                  <span className="text-2xl">{RES_TYPES.find(t => t.value === r.type)?.icon || '🔗'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-800">{r.title}</p>
                    {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                    <a href={r.url} target="_blank" rel="noreferrer"
                      className="text-xs text-green-700 hover:underline mt-1 inline-block truncate max-w-full">
                      {r.url}
                    </a>
                  </div>
                  <button onClick={() => deleteResource(r.id)}
                    className="text-gray-400 hover:text-red-500 text-lg flex-shrink-0">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
