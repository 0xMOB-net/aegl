import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/members/MemberLayout';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function AlertsPage() {
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dossiers').then(r => setDossiers(r.data.dossiers || [])).finally(() => setLoading(false));
  }, []);

  const alerts = dossiers.filter(d => {
    if (user?.role === 'host') return d.status === 'host_assigned';
    if (user?.role === 'student') return d.status === 'host_assigned' && d.adminNotes;
    return false;
  });

  return (
    <MemberLayout title="Alertes">
      <div className="space-y-5 animate-fade-in">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : alerts.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">✅</p>
            <p className="text-gray-500 font-medium">Aucune alerte</p>
            <p className="text-gray-400 text-sm mt-1">Tout est en ordre !</p>
          </div>
        ) : (
          alerts.map(d => (
            <div key={d.id} className="card border-l-4 border-amber-400 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user?.role === 'host'
                      ? `Action requise : dossier de ${d.student?.firstName} ${d.student?.lastName}`
                      : 'Vos documents ont été rejetés'
                    }
                  </h3>
                  {d.adminNotes && (
                    <p className="text-amber-700 text-sm mt-1 bg-amber-50 rounded-lg p-2">{d.adminNotes}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    {user?.role === 'host'
                      ? 'Merci de soumettre vos 3 documents dans la section "Mes dossiers"'
                      : 'L\'hébergeur va soumettre de nouveaux documents'
                    }
                  </p>
                  {user?.role === 'host' && (
                    <Link to="/membres/hebergeur/dossiers" className="btn-primary text-xs mt-3 inline-flex">
                      Soumettre mes documents →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </MemberLayout>
  );
}

export default AlertsPage;
