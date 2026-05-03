import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/members/MemberLayout';
import { StatCard, StatusBadge } from '../../components/members/SharedComponents';
import api from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentDossiers, setRecentDossiers] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, dossiersRes] = await Promise.all([
        api.get('/dossiers/stats'),
        api.get('/dossiers?limit=5'),
      ]);
      setStats(statsRes.data);
      setRecentDossiers(dossiersRes.data.dossiers?.slice(0, 5) || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Dashboard fetch error', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Rafraîchissement auto toutes les 15 secondes
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <MemberLayout title="Tableau de bord">
      <div className="space-y-8 animate-fade-in">

        {/* En-tête avec indicateur temps réel */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-800 font-semibold">Vue d'ensemble</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full ml-2 animate-pulse" />
            </p>
          </div>
          <button onClick={fetchData} className="text-xs text-green-700 hover:text-green-800 flex items-center gap-1.5 border border-green-200 rounded-lg px-3 py-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Actualiser
          </button>
        </div>

        {/* Stats cards */}
        {stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Total dossiers" value={stats.total} icon="📁" color="blue" />
            <StatCard label="En attente" value={stats.pending} icon="⏳" color="amber" />
            <StatCard label="Docs à vérifier" value={stats.docsProvided} icon="📋" color="purple" />
            <StatCard label="Confirmés" value={stats.confirmed} icon="✅" color="green" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* 2e ligne stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Hébergeur assigné" value={stats.hostAssigned} icon="🤝" color="blue" />
            <StatCard label="Docs vérifiés" value={stats.docsVerified} icon="✔️" color="green" />
            <StatCard label="Étudiants inscrits" value={stats.totalStudents} icon="🎓" color="blue" />
            <StatCard label="Hébergeurs inscrits" value={stats.totalHosts} icon="🏠" color="green" />
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/membres/admin/dossiers', label: 'Voir tous les dossiers', icon: '📁', color: 'bg-green-50 hover:bg-green-100 text-green-800 border-green-100' },
            { to: '/membres/admin/alertes', label: 'Voir les alertes', icon: '🔔', color: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-100' },
            { to: '/membres/admin/annonces', label: 'Nouvelle annonce', icon: '📢', color: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-100' },
            { to: '/membres/admin/articles', label: 'Gérer les articles', icon: '✍️', color: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-100' },
          ].map(({ to, label, icon, color }) => (
            <Link key={to} to={to} className={`border rounded-xl p-4 flex items-center gap-3 transition-all text-sm font-medium ${color}`}>
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          ))}
        </div>

        {/* Dossiers récents */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">Derniers dossiers</h3>
            <Link to="/membres/admin/dossiers" className="text-green-700 text-sm hover:underline">Voir tout →</Link>
          </div>
          {recentDossiers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucun dossier pour le moment</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-3">Étudiant</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3">Hébergeur</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentDossiers.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{d.student.firstName} {d.student.lastName}</div>
                        <div className="text-gray-400 text-xs">{d.student.email}</div>
                      </td>
                      <td className="py-3"><StatusBadge status={d.status} /></td>
                      <td className="py-3 text-gray-600">{d.host ? `${d.host.firstName} ${d.host.lastName}` : <span className="text-gray-300">—</span>}</td>
                      <td className="py-3 text-gray-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3">
                        <Link to={`/membres/admin/dossiers/${d.id}`} className="text-green-700 hover:text-green-800 font-medium text-xs">Voir →</Link>
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
