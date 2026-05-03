import { useState, useEffect } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import api from '../../api/client';

const EMPTY = { title: '', content: '', audience: 'all', pinned: false, isPublic: false };

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.announcements || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (a) => { setEditing(a.id); setForm({ title: a.title, content: a.content, audience: a.audience, pinned: a.pinned, isPublic: a.isPublic }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/announcements/${editing}`, form);
        setAnnouncements(prev => prev.map(a => a.id === editing ? res.data.announcement : a));
        showToast('Annonce mise à jour');
      } else {
        const res = await api.post('/announcements', form);
        setAnnouncements(prev => [res.data.announcement, ...prev]);
        showToast('Annonce créée');
      }
      setShowForm(false);
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    await api.delete(`/announcements/${id}`);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    showToast('Annonce supprimée');
  };

  const audienceLabel = (a) => ({ all: 'Tous', students: 'Étudiants', hosts: 'Hébergeurs' }[a] || a);
  const audienceColor = (a) => ({ all: 'bg-blue-100 text-blue-700', students: 'bg-purple-100 text-purple-700', hosts: 'bg-green-100 text-green-700' }[a] || '');

  return (
    <MemberLayout title="Gestion des annonces">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm animate-slide-up">
          {toast}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-heading text-xl text-green-900">{editing ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contenu</label>
                <textarea required rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
                <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                  <option value="all">Tous les membres</option>
                  <option value="students">Étudiants uniquement</option>
                  <option value="hosts">Hébergeurs uniquement</option>
                </select>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} className="rounded" />
                  📌 Épingler
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} className="rounded" />
                  🌐 Visible publiquement
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary text-sm">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm">
                  {saving ? 'Sauvegarde...' : editing ? 'Mettre à jour' : 'Créer l\'annonce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{announcements.length} annonce{announcements.length > 1 ? 's' : ''}</p>
          <button onClick={openCreate} className="btn-primary text-sm">+ Nouvelle annonce</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">📢</p><p>Aucune annonce</p></div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div key={a.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {a.pinned && <span className="text-xs">📌</span>}
                      {a.isPublic && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Public</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${audienceColor(a.audience)}`}>{audienceLabel(a.audience)}</span>
                      <span className="text-gray-400 text-xs">{new Date(a.publishedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{a.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{a.content}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(a)} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">Modifier</button>
                    <button onClick={() => handleDelete(a.id)} className="text-xs text-red-600 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
