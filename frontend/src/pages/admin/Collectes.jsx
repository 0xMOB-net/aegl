import { useState, useEffect } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import api from '../../api/client';

const emptyForm = { title: '', description: '', goal: '', helloassoUrl: '' };

export default function AdminCollectes() {
  const [collectes, setCollectes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // collecte en cours d'édition
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = () => {
    setLoading(true);
    api.get('/collectes/all').then(r => setCollectes(r.data.collectes || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ title: c.title, description: c.description, goal: c.goal || '', helloassoUrl: c.helloassoUrl });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/collectes/${editing.id}`, form);
        showToast('Collecte modifiée');
      } else {
        await api.post('/collectes', form);
        showToast('Collecte créée');
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      await api.patch(`/collectes/${c.id}`, { isActive: !c.isActive });
      fetchAll();
    } catch {
      showToast('Erreur', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette collecte ?')) return;
    try {
      await api.delete(`/collectes/${id}`);
      showToast('Collecte supprimée');
      fetchAll();
    } catch {
      showToast('Erreur', 'error');
    }
  };

  return (
    <MemberLayout title="Collectes">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="font-heading text-xl text-gray-900 mb-5">
              {editing ? 'Modifier la collecte' : 'Nouvelle collecte'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex : Soirée culturelle AEGL 2025"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez l'événement ou le projet à financer..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objectif (€) — optionnel</label>
                <input
                  type="number"
                  value={form.goal}
                  onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                  placeholder="500"
                  min="1"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien HelloAsso *</label>
                <input
                  value={form.helloassoUrl}
                  onChange={e => setForm(f => ({ ...f, helloassoUrl: e.target.value }))}
                  placeholder="https://www.helloasso.com/associations/aegl/collectes/..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Copiez l'URL de votre collecte depuis{' '}
                  <a href="https://www.helloasso.com" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">helloasso.com</a>
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-800 rounded-xl hover:bg-green-900 transition-colors disabled:opacity-40">
                  {saving ? '...' : editing ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{collectes.length} collecte{collectes.length !== 1 ? 's' : ''}</p>
          <button onClick={openCreate} className="btn-primary text-sm">
            + Nouvelle collecte
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : collectes.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-4xl mb-3">🤝</p>
            <p className="text-gray-400">Aucune collecte — créez-en une !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {collectes.map(c => (
              <div key={c.id} className={`card flex items-start justify-between gap-4 ${!c.isActive ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {c.goal && <span>Objectif : {c.goal.toLocaleString('fr-FR')} €</span>}
                    <a href={c.helloassoUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline truncate max-w-xs">
                      {c.helloassoUrl}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(c)} className="text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    {c.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                  <button onClick={() => openEdit(c)} className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
