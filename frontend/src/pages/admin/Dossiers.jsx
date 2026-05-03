import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/members/MemberLayout';
import { StatusBadge } from '../../components/members/SharedComponents';
import api from '../../api/client';

const STATUSES = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'host_assigned', label: 'Hébergeur assigné' },
  { value: 'documents_provided', label: 'Documents fournis' },
  { value: 'documents_verified', label: 'Docs vérifiés' },
  { value: 'confirmed', label: 'Confirmé' },
];

export default function AdminDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer le dossier de ${nom} ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/dossiers/${id}`);
      setDossiers(prev => prev.filter(d => d.id !== id));
      showToast('Dossier supprimé');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await api.get(`/dossiers?${params}`);
      setDossiers(res.data.dossiers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDossiers(); }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDossiers();
  };

  return (
    <MemberLayout title="Gestion des dossiers">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm animate-slide-up">
          {toast}
        </div>
      )}
      <div className="space-y-6 animate-fade-in">
        {/* Filtres */}
        <div className="card flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-3">
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <button type="submit" className="btn-primary text-sm px-4 py-2.5">
              🔍 Rechercher
            </button>
          </form>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(({ value, label }) => (
              <button key={value} onClick={() => setStatusFilter(value)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                statusFilter === value
                  ? 'bg-green-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : dossiers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p>Aucun dossier trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3">Étudiant</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Hébergeur</th>
                    <th className="px-6 py-3">Créé le</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dossiers.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{d.student.firstName} {d.student.lastName}</div>
                        <div className="text-gray-400 text-xs">{d.student.email}</div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                      <td className="px-6 py-4 text-gray-600">
                        {d.host ? `${d.host.firstName} ${d.host.lastName}` : <span className="text-gray-300 italic">Non assigné</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link to={`/membres/admin/dossiers/${d.id}`} className="btn-primary text-xs px-4 py-2">
                            Gérer →
                          </Link>
                          <button
                            onClick={() => handleDelete(d.id, `${d.student.firstName} ${d.student.lastName}`)}
                            className="text-xs text-red-600 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  );
}
