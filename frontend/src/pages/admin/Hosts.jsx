import { useState, useEffect } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { StatusBadge } from '../../components/members/SharedComponents';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export function AdminHosts() {
  const [hosts, setHosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('hosts');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [hRes, sRes] = await Promise.all([api.get('/admin/hosts'), api.get('/admin/students')]);
      setHosts(hRes.data.hosts || []);
      setStudents(sRes.data.students || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Supprimer le compte de ${name} ? Cette action est irréversible et supprimera tous ses dossiers associés.`)) return;
    setDeleting(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      showToast(`Compte de ${name} supprimé.`);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const data = tab === 'hosts' ? hosts : students;

  return (
    <MemberLayout title="Membres">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}
      <div className="space-y-6 animate-fade-in">
        <div className="flex gap-2">
          <button onClick={() => setTab('hosts')} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'hosts' ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            🏠 Hébergeurs ({hosts.length})
          </button>
          <button onClick={() => setTab('students')} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'students' ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            🎓 Étudiants ({students.length})
          </button>
        </div>

        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">👥</p><p>Aucun membre</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3">Nom</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Genre</th>
                    {tab === 'hosts' && <th className="px-6 py-3">Logement</th>}
                    <th className="px-6 py-3">Dossiers</th>
                    <th className="px-6 py-3">Inscrit le</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map(u => {
                    const avail = u.lodgingSurface ? Math.floor(u.lodgingSurface / 9) - (u.currentOccupants || 0) : null;
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                        <td className="px-6 py-4 text-gray-500">{u.email}</td>
                        <td className="px-6 py-4 text-gray-500">{u.gender === 'F' ? 'Féminin' : 'Masculin'}</td>
                        {tab === 'hosts' && (
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {u.lodgingSurface ? (
                              <span>
                                {u.lodgingSurface} m² · {u.currentOccupants ?? '?'} occ. actuel{' '}
                                <span className={`font-semibold ${avail > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                  ({avail > 0 ? `+${avail} dispo` : 'complet'})
                                </span>
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-800">{u._count?.hostDossiers ?? u._count?.studentDossiers ?? 0}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                            disabled={deleting === u.id}
                            className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline disabled:opacity-40"
                          >
                            {deleting === u.id ? '...' : '🗑 Supprimer'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  );
}

export default AdminHosts;

export function AdminActivity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/activity').then(r => setLogs(r.data.logs || [])).finally(() => setLoading(false));
  }, []);

  const actionLabel = (action) => {
    const map = {
      login: '🔑 Connexion', register: '👤 Inscription', create_dossier: '📁 Dossier créé',
      assign_host: '🤝 Hébergeur assigné', revoke_host: '↩ Hébergeur révoqué',
      validate_docs: '✅ Docs validés', reject_docs: '❌ Docs rejetés',
      close_dossier: '🎉 Dossier clôturé', upload_documents: '📤 Documents soumis',
      reset_password: '🔐 MDP réinitialisé',
    };
    return map[action] || action;
  };

  return (
    <MemberLayout title="Journal d'activité">
      <div className="space-y-4 animate-fade-in">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">📋</p><p>Aucune activité</p></div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Utilisateur</th>
                    <th className="px-6 py-3">Rôle</th>
                    <th className="px-6 py-3">Date & heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-800">{actionLabel(log.action)}</td>
                      <td className="px-6 py-3 text-gray-600">{log.user?.firstName} {log.user?.lastName}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${log.user?.role === 'admin' ? 'bg-red-100 text-red-700' : log.user?.role === 'host' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {log.user?.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {new Date(log.createdAt).toLocaleDateString('fr-FR')} à {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}

export function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/alerts').then(r => setAlerts(r.data.alerts || [])).finally(() => setLoading(false));
  }, []);

  return (
    <MemberLayout title="Alertes & dossiers urgents">
      <div className="space-y-6 animate-fade-in">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : alerts.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">✅</p>
            <p className="text-gray-500 font-medium">Tout est à jour !</p>
            <p className="text-gray-400 text-sm mt-1">Aucun dossier ne nécessite d'attention urgente.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-xl">⚠️</span>
              <p className="text-amber-800 text-sm font-medium">{alerts.length} dossier{alerts.length > 1 ? 's' : ''} nécessite{alerts.length === 1 ? '' : 'nt'} votre attention</p>
            </div>
            <div className="space-y-4">
              {alerts.map(d => (
                <div key={d.id} className="card border-l-4 border-amber-400 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusBadge status={d.status} />
                        <span className="text-gray-400 text-xs">Depuis le {new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{d.student?.firstName} {d.student?.lastName}</p>
                      <p className="text-gray-500 text-xs">{d.student?.email}</p>
                      {d.host && <p className="text-gray-400 text-xs mt-1">Hébergeur: {d.host.firstName} {d.host.lastName}</p>}
                      <p className="text-amber-700 text-xs mt-2 font-medium">
                        {d.status === 'pending' ? '⏳ En attente d\'un hébergeur depuis plus de 7 jours'
                          : d.status === 'documents_provided' ? '📋 Documents fournis — en attente de votre vérification'
                          : '✅ Documents vérifiés — en attente de clôture'}
                      </p>
                    </div>
                    <Link to={`/membres/admin/dossiers/${d.id}`} className="btn-primary text-xs px-4 py-2 flex-shrink-0">
                      Traiter →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </MemberLayout>
  );
}
