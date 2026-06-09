import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/members/MemberLayout';
import { StatusBadge } from '../../components/members/SharedComponents';
import api from '../../api/client';

/* ── Carte action ── */
function ActionCard({ count, label, sublabel, icon, href, color }) {
  const hasAction = count > 0;
  const colors = {
    red:   { bg: 'bg-red-50 border-red-200',     num: 'text-red-600',   icon: 'bg-red-100'   },
    blue:  { bg: 'bg-blue-50 border-blue-200',    num: 'text-blue-600',  icon: 'bg-blue-100'  },
    gray:  { bg: 'bg-gray-50 border-gray-200',    num: 'text-gray-400',  icon: 'bg-gray-100'  },
  };
  const c = colors[hasAction ? color : 'gray'];

  const inner = (
    <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-all ${c.bg} ${hasAction ? 'hover:shadow-md cursor-pointer' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${c.icon}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-3xl font-bold leading-none ${c.num}`}>{count}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
      </div>
      {hasAction && <span className="ml-auto text-gray-400 text-lg flex-shrink-0">→</span>}
    </div>
  );

  return hasAction ? <Link to={href}>{inner}</Link> : inner;
}

/* ── Graphique 3 mois ── */
function EvolutionChart({ data }) {
  if (!data?.length) {
    return <div className="h-20 flex items-center justify-center text-gray-300 text-sm">Chargement…</div>;
  }
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const last = data[data.length - 1]?.count ?? 0;
  const prev = data[data.length - 2]?.count ?? 0;
  const trend = last - prev;

  return (
    <div>
      <div className="flex items-end justify-between gap-3 h-20 mb-2">
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          const isLast = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <span className="text-xs text-gray-500 font-semibold">{d.count > 0 ? d.count : ''}</span>
              <div className="w-full flex flex-col justify-end" style={{ height: '52px' }}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ${isLast ? 'bg-green-600' : 'bg-green-200'}`}
                  style={{ height: `${Math.max(pct, d.count > 0 ? 10 : 0)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
        <span>{total} dossier{total !== 1 ? 's' : ''} sur 3 mois</span>
        {trend > 0 && <span className="text-green-600 font-medium">↑ {trend} de plus ce mois</span>}
        {trend < 0 && <span className="text-gray-400">↓ {Math.abs(trend)} de moins ce mois</span>}
        {trend === 0 && total > 0 && <span>Stable ce mois</span>}
      </div>
    </div>
  );
}

/* ── Étape pipeline ── */
function PipelineStep({ label, count, urgent, isLast }) {
  const hasItems = count > 0;
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className={`flex-1 min-w-0 rounded-2xl p-4 text-center border-2 transition-all ${
        urgent && hasItems ? 'bg-amber-50 border-amber-300'
          : hasItems ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 border-gray-100'
      }`}>
        <p className={`text-3xl font-bold leading-none ${
          urgent && hasItems ? 'text-amber-600' : hasItems ? 'text-green-700' : 'text-gray-300'
        }`}>{count}</p>
        <p className="text-xs text-gray-500 mt-2 font-medium">{label}</p>
      </div>
      {!isLast && <span className="text-gray-300 text-xl flex-shrink-0">→</span>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,          setStats]          = useState(null);
  const [unread,         setUnread]         = useState(0);
  const [monthly,        setMonthly]        = useState([]);
  const [recentDossiers, setRecentDossiers] = useState([]);
  const [lastUpdate,     setLastUpdate]     = useState(new Date());
  const [loading,        setLoading]        = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, dossiersRes, unreadRes, monthlyRes] = await Promise.all([
        api.get('/dossiers/stats'),
        api.get('/dossiers?limit=5'),
        api.get('/messages/admin/unread-count'),
        api.get('/dossiers/stats/monthly'),
      ]);
      setStats(statsRes.data);
      setRecentDossiers(dossiersRes.data.dossiers?.slice(0, 5) || []);
      setUnread(unreadRes.data.unreadCount || 0);
      setMonthly(monthlyRes.data.months || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Dashboard fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const s = stats || {};
  const totalDossiers = s.total || 0;
  const inProgress = totalDossiers - (s.confirmed || 0);
  // Taux basé sur les dossiers créés (pas sur tous les inscrits)
  const completionRate = totalDossiers > 0
    ? Math.round(((s.confirmed || 0) / totalDossiers) * 100)
    : 0;

  return (
    <MemberLayout title="Tableau de bord">
      <div className="space-y-6">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-800 font-semibold text-lg">Vue d'ensemble</h2>
            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1.5">
              Actualisé à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </p>
          </div>
          <button onClick={fetchData}
            className="text-xs text-green-700 hover:text-green-800 flex items-center gap-1.5 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* ── À traiter ── */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">À traiter</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ActionCard
                  count={s.docsProvided || 0}
                  label="Documents à vérifier"
                  sublabel="Dossiers en attente de votre vérification"
                  icon="📋"
                  color="red"
                  href="/membres/admin/dossiers"
                />
                <ActionCard
                  count={unread}
                  label="Messages non lus"
                  sublabel="Étudiants en attente de réponse"
                  icon="💬"
                  color="blue"
                  href="/membres/admin/messagerie"
                />
              </div>
            </div>

            {/* ── Pipeline simplifié ── */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dossiers</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{totalDossiers} au total · {inProgress} en cours · {s.confirmed || 0} confirmés</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PipelineStep label="En attente"  count={s.pending        || 0} urgent={false} />
                <PipelineStep label="Docs prêts"  count={s.documentsReady || 0} urgent={false} />
                <PipelineStep label="Confirmés"   count={s.confirmed      || 0} urgent={false} isLast />
              </div>
            </div>

            {/* ── Évolution 3 mois ── */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Activité récente</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Nouveaux dossiers enregistrés</p>
                </div>
              </div>
              <EvolutionChart data={monthly} />
            </div>

            {/* ── Membres + Dossiers récents ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Membres */}
              <div className="card flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Membres</h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-xl">🎓</span>
                    <div>
                      <p className="text-2xl font-bold text-blue-600 leading-none">{s.totalStudents || 0}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Étudiants</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-xl">🏠</span>
                    <div>
                      <p className="text-2xl font-bold text-green-600 leading-none">{s.totalHosts || 0}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Hébergeurs</p>
                    </div>
                  </div>
                </div>

                {totalDossiers > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Dossiers confirmés</span>
                      <span className="font-semibold text-green-700">{completionRate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      {s.confirmed || 0} confirmé{(s.confirmed || 0) !== 1 ? 's' : ''} sur {totalDossiers} dossier{totalDossiers !== 1 ? 's' : ''} créés
                    </p>
                  </div>
                )}
              </div>

              {/* Dossiers récents */}
              <div className="card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Derniers dossiers</h3>
                  <Link to="/membres/admin/dossiers" className="text-green-700 text-xs hover:underline font-medium">
                    Voir tout →
                  </Link>
                </div>
                {recentDossiers.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Aucun dossier pour le moment</p>
                ) : (
                  <div className="space-y-1.5">
                    {recentDossiers.map(d => (
                      <Link
                        key={d.id}
                        to={`/membres/admin/dossiers/${d.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                          {d.student.firstName[0]}{d.student.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {d.student.firstName} {d.student.lastName}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {d.host ? `🏠 ${d.host.firstName} ${d.host.lastName}` : "🏠 Sans hébergeur"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <StatusBadge status={d.status} />
                          <p className="text-[10px] text-gray-400">
                            {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className="text-gray-300 group-hover:text-green-600 transition-colors ml-1">›</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MemberLayout>
  );
}
