import { useState, useEffect, useCallback, useRef } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import api from '../../api/client';

const CATEGORIES = [
  { value: 'francais',      label: 'Français',          emoji: '🇫🇷' },
  { value: 'anglais',       label: 'Anglais',           emoji: '🇬🇧' },
  { value: 'universitaire', label: 'Vie universitaire', emoji: '🎓' },
  { value: 'pratique',      label: 'Vie pratique',      emoji: '🏙️' },
  { value: 'culture',       label: 'Culture & Société', emoji: '🌍' },
  { value: 'general',       label: 'Général',           emoji: '📚' },
];
const LEVELS = [
  { value: 'tous',          label: 'Tous niveaux' },
  { value: 'debutant',      label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance',        label: 'Avancé' },
];
const RES_TYPES = [
  { value: 'link',  label: 'Lien web', icon: '🔗' },
  { value: 'pdf',   label: 'PDF',      icon: '📄' },
  { value: 'video', label: 'Vidéo',    icon: '🎬' },
  { value: 'audio', label: 'Audio',    icon: '🎵' },
];
const CLASS_ROLES = [
  { value: 'student',    label: 'Étudiant actuel', icon: '📚' },
  { value: 'alumni',     label: 'Ancien',          icon: '🎓' },
  { value: 'instructor', label: 'Formateur',       icon: '⭐' },
];

const catLabel   = v => CATEGORIES.find(c => c.value === v)?.label || v;
const levelLabel = v => LEVELS.find(l => l.value === v)?.label || v;
const roleLabel  = v => CLASS_ROLES.find(r => r.value === v)?.label || v;
const roleIcon   = v => CLASS_ROLES.find(r => r.value === v)?.icon || '';

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

/* ── User Search Input ── */
function UserSearchInput({ onSelect, placeholder = 'Rechercher par nom ou email...' }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const timer = useRef(null);
  const wrapRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    try {
      const res = await api.get(`/learning/users/search?q=${encodeURIComponent(q)}`);
      setResults(res.data.users || []);
      setOpen(true);
    } catch { setResults([]); }
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(e.target.value), 300);
  };

  const select = (u) => {
    onSelect(u);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <input value={query} onChange={handleChange} placeholder={placeholder}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 overflow-hidden">
          {results.map(u => (
            <button key={u.id} onMouseDown={() => select(u)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 text-left transition-colors">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-800 flex-shrink-0">
                {u.firstName?.[0]}{u.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">{u.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Course Form ── */
function CourseForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    title: initial?.title || '', description: initial?.description || '',
    category: initial?.category || 'general', level: initial?.level || 'tous',
    emoji: initial?.emoji || '📚', restricted: initial?.restricted || false,
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
      <label className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
        <input type="checkbox" checked={form.restricted}
          onChange={e => setForm(f => ({ ...f, restricted: e.target.checked }))} className="w-4 h-4 accent-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-900">🔒 Cours restreint</p>
          <p className="text-xs text-amber-700">Accès sur demande uniquement</p>
        </div>
      </label>
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

function LessonForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    title: initial?.title || '', body: initial?.body || '',
    videoUrl: initial?.videoUrl || '', order: initial?.order ?? 0,
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-3">
          <label className="text-xs text-gray-500 block mb-1">Titre *</label>
          <input value={form.title} onChange={set('title')}
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
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600 font-mono" />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Lien vidéo YouTube (optionnel)</label>
        <input value={form.videoUrl} onChange={set('videoUrl')}
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

function QuizBuilder({ initial, courseId, onSave, onCancel, loading }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [desc,  setDesc]  = useState(initial?.description || '');
  const [questions, setQuestions] = useState(
    initial?.questions?.map(q => ({
      question: q.question, options: JSON.parse(q.options),
      correct: q.correct, explanation: q.explanation || '',
    })) || []
  );
  const addQ   = () => setQuestions(qs => [...qs, { question: '', options: ['', '', '', ''], correct: 0, explanation: '' }]);
  const updQ   = (i, f, v) => setQuestions(qs => qs.map((q, j) => j === i ? { ...q, [f]: v } : q));
  const updOpt = (qi, oi, v) => setQuestions(qs => qs.map((q, j) => j === qi ? { ...q, options: q.options.map((o, k) => k === oi ? v : o) } : q));
  const remQ   = i => setQuestions(qs => qs.filter((_, j) => j !== i));
  return (
    <div className="space-y-5">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du quiz *"
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optionnel)"
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
          <button onClick={addQ} className="text-xs text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50">+ Question</button>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-green-800 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</span>
              <input value={q.question} onChange={e => updQ(i, 'question', e.target.value)} placeholder="Question..."
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              <button onClick={() => remQ(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2 ml-8">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${q.correct === oi ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                  <input type="radio" name={`q${i}`} checked={q.correct === oi} onChange={() => updQ(i, 'correct', oi)} className="accent-green-600" />
                  <input value={opt} onChange={e => updOpt(i, oi, e.target.value)} placeholder={`Choix ${String.fromCharCode(65 + oi)}`}
                    onClick={e => e.stopPropagation()} className="flex-1 bg-transparent outline-none text-sm" />
                </label>
              ))}
            </div>
            <input value={q.explanation} onChange={e => updQ(i, 'explanation', e.target.value)} placeholder="Explication (optionnel)"
              className="w-full ml-8 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 btn-secondary text-sm">Annuler</button>
        <button onClick={() => onSave({ title, description: desc, courseId, questions })}
          disabled={loading || !title.trim() || questions.length === 0} className="flex-1 btn-primary text-sm disabled:opacity-40">
          {loading ? '...' : initial ? 'Mettre à jour' : 'Créer le quiz'}
        </button>
      </div>
    </div>
  );
}

/* ── Enrollments Tab (course) ── */
function EnrollmentsTab({ courseId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteRole,   setInviteRole]   = useState('member');
  const [saving,       setSaving]       = useState(false);

  const fetchE = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/learning/courses/${courseId}/enrollments`);
      setEnrollments(res.data.enrollments || []);
    } catch { setEnrollments([]); } finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { fetchE(); }, [fetchE]);

  const pending  = enrollments.filter(e => e.status === 'pending');
  const invited  = enrollments.filter(e => e.status === 'invited');
  const approved = enrollments.filter(e => e.status === 'approved');

  const invite = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.post(`/learning/courses/${courseId}/invite`, { userId: selectedUser.id, role: inviteRole });
      setSelectedUser(null); fetchE();
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); } finally { setSaving(false); }
  };
  const approve = async (id) => { try { await api.patch(`/learning/enrollments/${id}`, { status: 'approved' }); fetchE(); } catch {} };
  const reject  = async (id) => { try { await api.patch(`/learning/enrollments/${id}`, { status: 'rejected' }); fetchE(); } catch {} };
  const toggleInstructor = async (e) => { try { await api.patch(`/learning/enrollments/${e.id}`, { role: e.role === 'instructor' ? 'member' : 'instructor' }); fetchE(); } catch {} };
  const remove  = async (uid) => { if (!confirm('Retirer ?')) return; try { await api.delete(`/learning/courses/${courseId}/members/${uid}`); fetchE(); } catch {} };

  if (loading) return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Invite by search */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Inviter un membre</p>
        {selectedUser ? (
          <div className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-green-100 text-xs font-bold text-green-800 flex items-center justify-center flex-shrink-0">
              {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
            </div>
            <span className="text-sm font-medium text-gray-800 flex-1">{selectedUser.firstName} {selectedUser.lastName}</span>
            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-red-400">×</button>
          </div>
        ) : (
          <UserSearchInput onSelect={setSelectedUser} />
        )}
        <div className="flex gap-2">
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-600">
            <option value="member">Membre</option>
            <option value="instructor">Formateur bénévole</option>
          </select>
          <button onClick={invite} disabled={saving || !selectedUser}
            className="btn-primary text-sm px-5 disabled:opacity-40">{saving ? '...' : 'Inviter'}</button>
        </div>
      </div>

      {/* Pending & invited */}
      {(pending.length + invited.length) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            {pending.length + invited.length} en attente
          </p>
          {[...invited.map(e => ({ ...e, badge: '📨 Invitation' })), ...pending.map(e => ({ ...e, badge: '✋ Demande' }))].map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">{e.user.firstName} {e.user.lastName}</p>
                <p className="text-xs text-gray-400">{e.user.email} · <span className="text-amber-600">{e.badge}</span></p>
              </div>
              <button onClick={() => reject(e.id)} className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Refuser</button>
              <button onClick={() => approve(e.id)} className="text-xs px-2.5 py-1 bg-green-700 text-white rounded-lg hover:bg-green-800">Approuver</button>
            </div>
          ))}
        </div>
      )}

      {/* Approved */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{approved.length} membre{approved.length !== 1 ? 's' : ''} actif{approved.length !== 1 ? 's' : ''}</p>
        {approved.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun membre inscrit</p>
        ) : approved.map(e => (
          <div key={e.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-green-100 text-xs font-bold text-green-800 flex items-center justify-center flex-shrink-0">
              {e.user.firstName?.[0]}{e.user.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800">{e.user.firstName} {e.user.lastName}</p>
              <p className="text-xs text-gray-400">{e.user.email}</p>
            </div>
            <button onClick={() => toggleInstructor(e)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${e.role === 'instructor' ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {e.role === 'instructor' ? '⭐ Formateur' : 'Membre'}
            </button>
            <button onClick={() => remove(e.user.id)} className="text-gray-300 hover:text-red-500 text-lg">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Resource upload form ── */
function ResourceUploadForm({ courseId, onDone }) {
  const [mode, setMode]   = useState('url');
  const [title, setTitle] = useState('');
  const [type,  setType]  = useState('link');
  const [url,   setUrl]   = useState('');
  const [file,  setFile]  = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (mode === 'file' && file) {
        const fd = new FormData();
        fd.append('file', file); fd.append('title', title.trim());
        if (courseId) fd.append('courseId', courseId);
        await api.post('/learning/resources/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        if (!url.trim()) return;
        await api.post('/learning/resources', { title: title.trim(), type, url: url.trim(), courseId: courseId || null });
      }
      setTitle(''); setUrl(''); setFile(null); setType('link');
      if (fileRef.current) fileRef.current.value = '';
      onDone();
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); } finally { setSaving(false); }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">Ajouter une ressource</p>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
          {[{ v: 'url', l: '🔗 URL' }, { v: 'file', l: '📁 Fichier' }].map(m => (
            <button key={m.v} onClick={() => setMode(m.v)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${mode === m.v ? 'bg-green-700 text-white' : 'text-gray-500'}`}>{m.l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre *"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
        {mode === 'url' ? (
          <select value={type} onChange={e => setType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
            {RES_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
        ) : (
          <input ref={fileRef} type="file" accept=".pdf,video/*,audio/*"
            onChange={e => setFile(e.target.files[0] || null)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:outline-none" />
        )}
      </div>
      {mode === 'url' && (
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL *"
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
      )}
      <button onClick={submit} disabled={saving || !title.trim() || (mode === 'url' ? !url.trim() : !file)}
        className="btn-primary text-xs py-1.5 disabled:opacity-40">{saving ? '...' : 'Ajouter'}</button>
    </div>
  );
}

/* ── Class Member Manager ── */
function ClassMemberManager({ classId }) {
  const [members,      setMembers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [classRole,    setClassRole]    = useState('student');
  const [saving,       setSaving]       = useState(false);

  const fetchM = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/learning/classes/${classId}/members`);
      setMembers(res.data.members || []);
    } catch { setMembers([]); } finally { setLoading(false); }
  }, [classId]);
  useEffect(() => { fetchM(); }, [fetchM]);

  const pending  = members.filter(m => m.status === 'pending');
  const invited  = members.filter(m => m.status === 'invited');
  const approved = members.filter(m => m.status === 'approved');

  const invite = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.post(`/learning/classes/${classId}/invite`, { userId: selectedUser.id, role: classRole });
      setSelectedUser(null); fetchM();
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); } finally { setSaving(false); }
  };
  const approve = async (id) => { try { await api.patch(`/learning/class-members/${id}`, { status: 'approved' }); fetchM(); } catch {} };
  const reject  = async (id) => { try { await api.patch(`/learning/class-members/${id}`, { status: 'rejected' }); fetchM(); } catch {} };
  const setRole = async (id, role) => { try { await api.patch(`/learning/class-members/${id}`, { role }); fetchM(); } catch {} };
  const remove  = async (uid) => { if (!confirm('Retirer ce membre ?')) return; try { await api.delete(`/learning/classes/${classId}/members/${uid}`); fetchM(); } catch {} };

  if (loading) return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Invite */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Inviter un membre</p>
        {selectedUser ? (
          <div className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-green-100 text-xs font-bold text-green-800 flex items-center justify-center flex-shrink-0">
              {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
            </div>
            <span className="text-sm font-medium text-gray-800 flex-1">{selectedUser.firstName} {selectedUser.lastName}</span>
            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-red-400">×</button>
          </div>
        ) : (
          <UserSearchInput onSelect={setSelectedUser} />
        )}
        <div className="flex gap-2">
          <select value={classRole} onChange={e => setClassRole(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-600">
            {CLASS_ROLES.map(r => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
          </select>
          <button onClick={invite} disabled={saving || !selectedUser}
            className="btn-primary text-sm px-5 disabled:opacity-40">{saving ? '...' : 'Inviter'}</button>
        </div>
      </div>

      {/* Pending & invited */}
      {(pending.length + invited.length) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">{pending.length + invited.length} en attente</p>
          {[...invited.map(m => ({ ...m, badge: '📨 Invitation' })), ...pending.map(m => ({ ...m, badge: '✋ Demande' }))].map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">{m.user.firstName} {m.user.lastName}</p>
                <p className="text-xs text-gray-400">{m.user.email} · <span className="text-amber-600">{m.badge}</span></p>
              </div>
              <button onClick={() => reject(m.id)} className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Refuser</button>
              <button onClick={() => approve(m.id)} className="text-xs px-2.5 py-1 bg-green-700 text-white rounded-lg hover:bg-green-800">Approuver</button>
            </div>
          ))}
        </div>
      )}

      {/* Approved members */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{approved.length} membre{approved.length !== 1 ? 's' : ''}</p>
        {approved.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-xs font-bold text-blue-800 flex items-center justify-center flex-shrink-0">
              {m.user.firstName?.[0]}{m.user.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800">{m.user.firstName} {m.user.lastName}</p>
              <p className="text-xs text-gray-400">{m.user.email}</p>
            </div>
            <select value={m.role} onChange={e => setRole(m.id, e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
              {CLASS_ROLES.map(r => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
            </select>
            <button onClick={() => remove(m.user.id)} className="text-gray-300 hover:text-red-500 text-lg">×</button>
          </div>
        ))}
        {approved.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun membre pour le moment</p>}
      </div>
    </div>
  );
}

/* ── Class Courses Tab ── */
function ClassCoursesTab({ classId, allCourses }) {
  const [classCourses, setClassCourses] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [adding, setAdding]             = useState(false);
  const [pickId, setPickId]             = useState('');

  const fetchCC = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/learning/classes/${classId}`);
      setClassCourses(res.data.class.courses?.map(c => c.course) || []);
    } catch { setClassCourses([]); } finally { setLoading(false); }
  }, [classId]);
  useEffect(() => { fetchCC(); }, [fetchCC]);

  const addCourse = async () => {
    if (!pickId) return;
    setAdding(true);
    try { await api.post(`/learning/classes/${classId}/courses`, { courseId: pickId }); setPickId(''); fetchCC(); } catch {}
    finally { setAdding(false); }
  };
  const removeCourse = async (courseId) => {
    if (!confirm('Retirer ce cours de la classe ?')) return;
    try { await api.delete(`/learning/classes/${classId}/courses/${courseId}`); fetchCC(); } catch {}
  };

  const available = allCourses.filter(c => !classCourses.find(cc => cc.id === c.id));

  if (loading) return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {available.length > 0 && (
        <div className="flex gap-2">
          <select value={pickId} onChange={e => setPickId(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
            <option value="">Sélectionner un cours à associer...</option>
            {available.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>)}
          </select>
          <button onClick={addCourse} disabled={adding || !pickId}
            className="btn-primary text-sm px-4 disabled:opacity-40">{adding ? '...' : '+ Associer'}</button>
        </div>
      )}
      {classCourses.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Aucun cours associé à cette classe</p>
      ) : classCourses.map(c => (
        <div key={c.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
          <span className="text-2xl">{c.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
            <p className="text-xs text-gray-400">{c._count?.lessons || 0} leçons</p>
          </div>
          <button onClick={() => removeCourse(c.id)} className="text-gray-300 hover:text-red-500 text-lg">×</button>
        </div>
      ))}
    </div>
  );
}

/* ── Main ── */
export default function AdminLearning() {
  const [tab, setTab]               = useState('courses');
  const [courses, setCourses]       = useState([]);
  const [resources, setResources]   = useState([]);
  const [classes, setClasses]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving,  setSaving]        = useState(false);
  const [modal, setModal]           = useState(null);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseTab, setCourseTab]   = useState('lessons');
  const [courseDetail, setCourseDetail] = useState(null);

  const [selectedClass, setSelectedClass]   = useState(null);
  const [classTab, setClassTab]             = useState('members');
  const [classModal, setClassModal]         = useState(null);
  const [classForm, setClassForm]           = useState({ name: '', description: '', emoji: '🏫', year: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, rRes, clRes] = await Promise.all([
        api.get('/learning/courses'),
        api.get('/learning/resources'),
        api.get('/learning/classes'),
      ]);
      setCourses(cRes.data.courses || []);
      setResources(rRes.data.resources || []);
      setClasses(clRes.data.classes || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const fetchCourse = useCallback(async (id) => {
    try { const res = await api.get(`/learning/courses/${id}`); setCourseDetail(res.data.course); } catch {}
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    if (selectedCourse) fetchCourse(selectedCourse.id);
    else setCourseDetail(null);
  }, [selectedCourse, fetchCourse]);

  /* Course actions */
  const saveCourse = async (form) => {
    setSaving(true);
    try {
      if (modal?.data?.id) await api.put(`/learning/courses/${modal.data.id}`, form);
      else await api.post('/learning/courses', form);
      setModal(null); fetchAll();
    } catch { } finally { setSaving(false); }
  };
  const togglePublish = async (course) => {
    try { await api.put(`/learning/courses/${course.id}`, { ...course, published: !course.published }); fetchAll(); } catch {}
  };
  const deleteCourse = async (id) => {
    if (!confirm('Supprimer ce cours ?')) return;
    try { await api.delete(`/learning/courses/${id}`); if (selectedCourse?.id === id) setSelectedCourse(null); fetchAll(); } catch {}
  };
  const saveLesson = async (form) => {
    setSaving(true);
    try {
      if (modal?.data?.id) await api.put(`/learning/courses/${selectedCourse.id}/lessons/${modal.data.id}`, form);
      else await api.post(`/learning/courses/${selectedCourse.id}/lessons`, form);
      setModal(null); fetchCourse(selectedCourse.id);
    } catch {} finally { setSaving(false); }
  };
  const deleteLesson = async (id) => {
    if (!confirm('Supprimer ?')) return;
    try { await api.delete(`/learning/courses/${selectedCourse.id}/lessons/${id}`); fetchCourse(selectedCourse.id); } catch {}
  };
  const deleteResource = async (id) => {
    if (!confirm('Supprimer ?')) return;
    try { await api.delete(`/learning/resources/${id}`); fetchAll(); if (selectedCourse) fetchCourse(selectedCourse.id); } catch {}
  };
  const saveQuiz = async (form) => {
    setSaving(true);
    try {
      if (modal?.data?.id) await api.put(`/learning/quizzes/${modal.data.id}`, form);
      else await api.post('/learning/quizzes', form);
      setModal(null); if (selectedCourse) fetchCourse(selectedCourse.id);
    } catch {} finally { setSaving(false); }
  };
  const deleteQuiz = async (id) => {
    if (!confirm('Supprimer ?')) return;
    try { await api.delete(`/learning/quizzes/${id}`); if (selectedCourse) fetchCourse(selectedCourse.id); } catch {}
  };

  /* Class actions */
  const saveClass = async () => {
    if (!classForm.name.trim()) return;
    setSaving(true);
    try {
      if (classModal?.id) await api.put(`/learning/classes/${classModal.id}`, classForm);
      else await api.post('/learning/classes', classForm);
      setClassModal(null); setClassForm({ name: '', description: '', emoji: '🏫', year: '' }); fetchAll();
    } catch {} finally { setSaving(false); }
  };
  const deleteClass = async (id) => {
    if (!confirm('Supprimer cette classe ?')) return;
    try { await api.delete(`/learning/classes/${id}`); if (selectedClass?.id === id) setSelectedClass(null); fetchAll(); } catch {}
  };

  /* Standalone resource form */
  const [stRes, setStRes]   = useState({ title: '', description: '', type: 'link', url: '' });
  const [stSaving, setStSaving] = useState(false);

  return (
    <MemberLayout title="Apprentissage">
      {/* Course modals */}
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
      {/* Class modal */}
      {classModal !== null && (
        <Modal title={classModal?.id ? 'Modifier la classe' : 'Nouvelle classe'} onClose={() => setClassModal(null)}>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-20">
                <label className="text-xs text-gray-500 block mb-1">Emoji</label>
                <input value={classForm.emoji} onChange={e => setClassForm(f => ({ ...f, emoji: e.target.value }))} maxLength={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Nom de la classe *</label>
                <input value={classForm.name} onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex : L3 Informatique, Master Droit..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Promotion / Année</label>
                <input value={classForm.year} onChange={e => setClassForm(f => ({ ...f, year: e.target.value }))}
                  placeholder="Ex : Promo 2024, 2024-2025..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <textarea value={classForm.description} onChange={e => setClassForm(f => ({ ...f, description: e.target.value }))} rows={3}
                placeholder="Décrivez l'objectif de cette classe..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setClassModal(null)} className="flex-1 btn-secondary text-sm">Annuler</button>
              <button onClick={saveClass} disabled={saving || !classForm.name.trim()}
                className="flex-1 btn-primary text-sm disabled:opacity-40">
                {saving ? '...' : classModal?.id ? 'Mettre à jour' : 'Créer la classe'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="space-y-6">
        {/* Main tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ v: 'courses', l: '📚 Cours' }, { v: 'resources', l: '🗂️ Ressources' }, { v: 'classes', l: '🏫 Classes' }].map(t => (
              <button key={t.v} onClick={() => setTab(t.v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.v ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
            ))}
          </div>
          {tab === 'courses' && <button onClick={() => setModal({ type: 'course', data: null })} className="btn-primary text-sm">+ Nouveau cours</button>}
          {tab === 'classes' && <button onClick={() => { setClassModal({}); setClassForm({ name: '', description: '', emoji: '🏫', year: '' }); }} className="btn-primary text-sm">+ Nouvelle classe</button>}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : tab === 'courses' ? (
          /* ── Courses ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              {courses.length === 0 ? (
                <div className="card text-center py-10 text-gray-400"><p className="text-3xl mb-2">📚</p><p className="text-sm">Aucun cours</p></div>
              ) : courses.map(c => (
                <div key={c.id} onClick={() => setSelectedCourse(selectedCourse?.id === c.id ? null : c)}
                  className={`card cursor-pointer transition-all hover:shadow-md ${selectedCourse?.id === c.id ? 'ring-2 ring-green-600 bg-green-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{c.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-gray-800 truncate text-sm">{c.title}</p>
                        {c.restricted && <span className="text-amber-500 text-xs">🔒</span>}
                      </div>
                      <p className="text-xs text-gray-400">{catLabel(c.category)} · {levelLabel(c.level)}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{c._count.lessons} leçon{c._count.lessons !== 1 ? 's' : ''}</span>
                        {c._count.quizzes > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{c._count.quizzes} quiz</span>}
                        {c.restricted && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{c._count.enrollments} inscrit{c._count.enrollments !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); togglePublish(c); }}
                        className={`text-[10px] px-2 py-1 rounded-full font-medium ${c.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.published ? '● Publié' : '○ Brouillon'}
                      </button>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); setModal({ type: 'course', data: c }); }} className="text-xs text-gray-400 hover:text-green-700 p-1">✏️</button>
                        <button onClick={e => { e.stopPropagation(); deleteCourse(c.id); }} className="text-xs text-gray-400 hover:text-red-500 p-1">🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2">
              {!selectedCourse ? (
                <div className="card text-center py-16 text-gray-400"><p className="text-4xl mb-3">👈</p><p className="text-sm">Sélectionnez un cours pour gérer son contenu</p></div>
              ) : !courseDetail ? (
                <div className="card flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="card">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <span className="text-3xl">{courseDetail.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">{courseDetail.title}</h3>
                        {courseDetail.restricted && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">🔒</span>}
                      </div>
                      <p className="text-xs text-gray-400">{catLabel(courseDetail.category)} · {levelLabel(courseDetail.level)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-gray-50 rounded-xl p-1 mb-5 overflow-x-auto">
                    {[
                      { v: 'lessons',     l: `Leçons (${courseDetail.lessons?.length || 0})` },
                      { v: 'quiz',        l: `Quiz (${courseDetail.quizzes?.length || 0})` },
                      { v: 'resources',   l: `Ressources` },
                      { v: 'enrollments', l: `Inscriptions` },
                    ].map(t => (
                      <button key={t.v} onClick={() => setCourseTab(t.v)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${courseTab === t.v ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500'}`}>{t.l}</button>
                    ))}
                  </div>

                  {courseTab === 'lessons' && (
                    <div className="space-y-3">
                      <button onClick={() => setModal({ type: 'lesson', data: null })}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-green-400 hover:text-green-700 transition-colors">
                        + Ajouter une leçon
                      </button>
                      {courseDetail.lessons?.map((l, i) => (
                        <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <span className="w-6 h-6 rounded-full bg-green-800 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{l.title}</p>
                            <div className="flex gap-2">{l.body && <span className="text-[10px] text-gray-400">📝</span>}{l.videoUrl && <span className="text-[10px] text-gray-400">🎬</span>}</div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setModal({ type: 'lesson', data: l })} className="text-xs text-gray-400 hover:text-green-700 p-1.5 hover:bg-white rounded-lg">✏️</button>
                            <button onClick={() => deleteLesson(l.id)} className="text-xs text-gray-400 hover:text-red-500 p-1.5 hover:bg-white rounded-lg">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {courseTab === 'quiz' && (
                    <div className="space-y-3">
                      {courseDetail.quizzes?.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-gray-400 text-sm mb-3">Aucun quiz</p>
                          <button onClick={() => setModal({ type: 'quiz', data: null })} className="btn-primary text-sm">Créer un quiz</button>
                        </div>
                      ) : courseDetail.quizzes.map(quiz => (
                        <div key={quiz.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-800 text-sm">🧩 {quiz.title}</p>
                              <p className="text-xs text-blue-600 mt-1">{quiz.questions?.length || 0} question{quiz.questions?.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setModal({ type: 'quiz', data: quiz })} className="text-xs text-gray-400 hover:text-green-700 p-1.5">✏️</button>
                              <button onClick={() => deleteQuiz(quiz.id)} className="text-xs text-gray-400 hover:text-red-500 p-1.5">🗑️</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {courseDetail.quizzes?.length > 0 && (
                        <button onClick={() => setModal({ type: 'quiz', data: null })}
                          className="w-full border-2 border-dashed border-blue-200 rounded-xl py-2 text-sm text-blue-400 hover:border-blue-400 transition-colors">
                          + Ajouter un quiz
                        </button>
                      )}
                    </div>
                  )}

                  {courseTab === 'resources' && (
                    <div className="space-y-3">
                      <ResourceUploadForm courseId={selectedCourse.id} onDone={() => fetchCourse(selectedCourse.id)} />
                      {courseDetail.resources?.map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <span className="text-lg">{RES_TYPES.find(t => t.value === r.type)?.icon || '🔗'}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                            <p className="text-xs text-gray-400 truncate">{r.fileName || r.url}</p>
                          </div>
                          <button onClick={() => deleteResource(r.id)} className="text-gray-400 hover:text-red-500 text-lg">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {courseTab === 'enrollments' && <EnrollmentsTab courseId={selectedCourse.id} />}
                </div>
              )}
            </div>
          </div>
        ) : tab === 'resources' ? (
          /* ── Resources ── */
          <div className="space-y-4">
            <div className="card space-y-3">
              <p className="text-sm font-medium text-gray-700">Ajouter une ressource générale</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={stRes.title} onChange={e => setStRes(f => ({ ...f, title: e.target.value }))} placeholder="Titre *"
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                <input value={stRes.url} onChange={e => setStRes(f => ({ ...f, url: e.target.value }))} placeholder="URL *"
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                <select value={stRes.type} onChange={e => setStRes(f => ({ ...f, type: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                  {RES_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <button onClick={async () => {
                if (!stRes.title || !stRes.url) return;
                setStSaving(true);
                try { await api.post('/learning/resources', { ...stRes, courseId: null }); setStRes({ title: '', description: '', type: 'link', url: '' }); fetchAll(); }
                catch {} finally { setStSaving(false); }
              }} disabled={stSaving || !stRes.title || !stRes.url} className="btn-primary text-sm disabled:opacity-40">
                {stSaving ? '...' : 'Ajouter'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map(r => (
                <div key={r.id} className="card flex items-start gap-3">
                  <span className="text-2xl">{RES_TYPES.find(t => t.value === r.type)?.icon || '🔗'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-800">{r.title}</p>
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-green-700 hover:underline truncate block max-w-full">{r.fileName || r.url}</a>
                  </div>
                  <button onClick={() => deleteResource(r.id)} className="text-gray-400 hover:text-red-500 text-lg flex-shrink-0">×</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Classes ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              {classes.length === 0 ? (
                <div className="card text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">🏫</p>
                  <p className="text-sm">Aucune classe pour le moment</p>
                  <p className="text-xs mt-1">Créez une classe pour regrouper des étudiants</p>
                </div>
              ) : classes.map(cls => (
                <div key={cls.id} onClick={() => setSelectedClass(selectedClass?.id === cls.id ? null : cls)}
                  className={`card cursor-pointer transition-all hover:shadow-md ${selectedClass?.id === cls.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{cls.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-sm">{cls.name}</p>
                      {cls.year && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cls.year}</span>}
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cls._count.members} membre{cls._count.members !== 1 ? 's' : ''}</span>
                        <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{cls._count.courses} cours</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); setClassModal(cls); setClassForm({ name: cls.name, description: cls.description || '', emoji: cls.emoji, year: cls.year || '' }); }}
                        className="text-xs text-gray-400 hover:text-green-700 p-1">✏️</button>
                      <button onClick={e => { e.stopPropagation(); deleteClass(cls.id); }}
                        className="text-xs text-gray-400 hover:text-red-500 p-1">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2">
              {!selectedClass ? (
                <div className="card text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">🏫</p>
                  <p className="text-sm">Sélectionnez une classe pour la gérer</p>
                </div>
              ) : (
                <div className="card">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <span className="text-3xl">{selectedClass.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800">{selectedClass.name}</h3>
                      {selectedClass.year && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedClass.year}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 bg-gray-50 rounded-xl p-1 mb-5">
                    {[{ v: 'members', l: `👥 Membres` }, { v: 'courses', l: `📚 Cours` }].map(t => (
                      <button key={t.v} onClick={() => setClassTab(t.v)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${classTab === t.v ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500'}`}>{t.l}</button>
                    ))}
                  </div>
                  {classTab === 'members' && <ClassMemberManager classId={selectedClass.id} />}
                  {classTab === 'courses' && <ClassCoursesTab classId={selectedClass.id} allCourses={courses} />}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
