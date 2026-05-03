import { useState, useEffect } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import api from '../../api/client';

const EMPTY = { title: '', content: '', coverImage: '', published: false };

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/articles/admin/all');
      setArticles(res.data.articles || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (a) => { setEditing(a.id); setForm({ title: a.title, content: a.content, coverImage: a.coverImage || '', published: a.published }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/articles/${editing}`, form);
        setArticles(prev => prev.map(a => a.id === editing ? res.data.article : a));
        showToast('Article mis à jour');
      } else {
        const res = await api.post('/articles', form);
        setArticles(prev => [res.data.article, ...prev]);
        showToast('Article créé');
      }
      setShowForm(false);
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet article ?')) return;
    await api.delete(`/articles/${id}`);
    setArticles(prev => prev.filter(a => a.id !== id));
    showToast('Article supprimé');
  };

  const togglePublish = async (article) => {
    const res = await api.put(`/articles/${article.id}`, { ...article, published: !article.published });
    setArticles(prev => prev.map(a => a.id === article.id ? res.data.article : a));
    showToast(res.data.article.published ? 'Article publié' : 'Article dépublié');
  };

  return (
    <MemberLayout title="Gestion des articles">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm animate-slide-up">{toast}</div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-heading text-xl text-green-900">{editing ? 'Modifier l\'article' : 'Nouvel article'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Titre de l'article"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Image de couverture (URL)</label>
                <input value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="https://exemple.com/image.jpg"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contenu</label>
                <textarea required rows={10} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Rédigez votre article..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="rounded" />
                🌐 Publier immédiatement sur le site
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary text-sm">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm">
                  {saving ? 'Sauvegarde...' : editing ? 'Mettre à jour' : 'Créer l\'article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 text-sm">{articles.length} article{articles.length > 1 ? 's' : ''}</p>
          <button onClick={openCreate} className="btn-primary text-sm">+ Nouvel article</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">✍️</p><p>Aucun article</p></div>
        ) : (
          <div className="space-y-4">
            {articles.map(a => (
              <div key={a.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.published ? '🌐 Publié' : '📝 Brouillon'}
                      </span>
                      <span className="text-gray-400 text-xs">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{a.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{a.content.substring(0, 150)}...</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-col sm:flex-row">
                    <button onClick={() => togglePublish(a)} className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${a.published ? 'border-gray-200 hover:bg-gray-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {a.published ? 'Dépublier' : 'Publier'}
                    </button>
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
