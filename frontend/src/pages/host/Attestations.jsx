import { useState, useEffect } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { StatusBadge } from '../../components/members/SharedComponents';
import api from '../../api/client';

const downloadPDF = async (dossierId, nom) => {
  const base = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('aegl_token');
  const res = await fetch(`${base}/pdf/${dossierId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return alert('PDF non disponible');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Attestation_AEGL_${nom}.pdf`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

export default function HostAttestations() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dossiers').then(r => {
      const confirmed = r.data.dossiers?.filter(d =>
        ['documents_provided', 'documents_verified', 'attestation_pending', 'confirmed'].includes(d.status)
      ) || [];
      setDossiers(confirmed);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <MemberLayout title="Mes attestations générées">
      <div className="space-y-5 animate-fade-in">
        <p className="text-gray-500 text-sm">Les attestations PDF disponibles pour les dossiers que vous avez traités.</p>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : dossiers.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">📄</p>
            <p className="text-gray-500 font-medium">Aucune attestation disponible</p>
            <p className="text-gray-400 text-sm mt-1">Les attestations apparaissent ici une fois les documents soumis.</p>
          </div>
        ) : (
          dossiers.map(d => (
            <div key={d.id} className="card flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{d.student.firstName} {d.student.lastName}</h3>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-gray-400 text-sm">{d.student.email}</p>
                {d.closedAt && <p className="text-gray-400 text-xs mt-0.5">Clôturé le {new Date(d.closedAt).toLocaleDateString('fr-FR')}</p>}
              </div>
              <button
                onClick={() => downloadPDF(d.id, `${d.student.firstName}_${d.student.lastName}`)}
                className="btn-primary text-sm flex-shrink-0"
              >
                ⬇ Télécharger PDF
              </button>
            </div>
          ))
        )}
      </div>
    </MemberLayout>
  );
}
