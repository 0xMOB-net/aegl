import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MemberLayout from '../../components/members/MemberLayout';
import { StatusBadge, DossierStepper } from '../../components/members/SharedComponents';
import api from '../../api/client';

export default function AdminDossierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dossier, setDossier] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [selectedHost, setSelectedHost] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDossier = async () => {
    try {
      const [dRes, hRes] = await Promise.all([
        api.get(`/dossiers/${id}`),
        api.get('/admin/hosts'),
      ]);
      setDossier(dRes.data.dossier);
      setHosts(hRes.data.hosts || []);
      setNotes(dRes.data.dossier.adminNotes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDossier(); }, [id]);

  const action = async (type, body = {}) => {
    setActionLoading(type);
    try {
      let res;
      if (type === 'assign')   res = await api.patch(`/dossiers/${id}/assign-host`, { hostId: selectedHost });
      if (type === 'revoke')   res = await api.patch(`/dossiers/${id}/revoke-host`);
      if (type === 'validate') res = await api.patch(`/dossiers/${id}/validate-docs`);
      if (type === 'reject')   res = await api.patch(`/dossiers/${id}/reject-docs`, { reason: rejectReason });
      if (type === 'close')    res = await api.patch(`/dossiers/${id}/close`);
      if (type === 'notes')    res = await api.patch(`/dossiers/${id}/notes`, { adminNotes: notes });
      if (res?.data?.dossier) setDossier(res.data.dossier);
      setShowRejectModal(false);
      showToast(
        type === 'assign'   ? 'Hébergeur assigné avec succès' :
        type === 'revoke'   ? 'Hébergeur révoqué' :
        type === 'validate' ? 'Documents validés' :
        type === 'reject'   ? 'Documents rejetés' :
        type === 'close'    ? 'Dossier clôturé — attestation générée et email envoyé !' :
        'Notes sauvegardées'
      );
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const downloadPDF = async () => {
    try {
      const base = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('aegl_token');
      const res = await fetch(`${base}/pdf/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'PDF non disponible', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Attestation_AEGL_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showToast('Erreur lors du téléchargement', 'error');
    }
  };

  if (loading) return (
    <MemberLayout title="Dossier">
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" />
      </div>
    </MemberLayout>
  );

  if (!dossier) return (
    <MemberLayout title="Dossier introuvable">
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-gray-500 mb-4">Dossier introuvable</p>
        <Link to="/membres/admin/dossiers" className="btn-primary">Retour aux dossiers</Link>
      </div>
    </MemberLayout>
  );

  return (
    <MemberLayout title={`Dossier — ${dossier.student.firstName} ${dossier.student.lastName}`}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${
          toast.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Modal rejet */}
      {showRejectModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-heading text-xl text-gray-900 mb-3">Rejeter les documents</h3>
            <p className="text-gray-500 text-sm mb-4">Indiquez la raison du rejet. L'hébergeur devra soumettre à nouveau.</p>
            <textarea
              rows={3} value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Ex : Le contrat de bail est illisible..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 btn-secondary text-sm">Annuler</button>
              <button onClick={() => action('reject')} disabled={actionLoading === 'reject'} className="flex-1 btn-danger text-sm">
                {actionLoading === 'reject' ? '...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Retour */}
        <Link to="/membres/admin/dossiers" className="text-green-700 text-sm hover:text-green-800 inline-flex items-center gap-1">
          ← Retour aux dossiers
        </Link>

        {/* En-tête */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="font-heading text-2xl text-green-900">
                {dossier.student.firstName} {dossier.student.lastName}
              </h2>
              <p className="text-gray-400 text-sm mt-1">{dossier.student.email} • {dossier.student.gender === 'F' ? 'Étudiante' : 'Étudiant'}</p>
              <p className="text-gray-400 text-xs mt-0.5">ID : {dossier.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <StatusBadge status={dossier.status} />
          </div>
          <DossierStepper status={dossier.status} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Infos étudiant */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">👤 Informations étudiant</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-400">Nom complet</dt><dd className="font-medium">{dossier.student.firstName} {dossier.student.lastName}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Email</dt><dd className="font-medium">{dossier.student.email}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Genre</dt><dd className="font-medium">{dossier.student.gender === 'F' ? 'Féminin' : 'Masculin'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Dossier créé le</dt><dd className="font-medium">{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</dd></div>
              {dossier.universityNoticePath && (
                <div className="pt-2 border-t border-gray-100">
                  {(() => {
                    const backendBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
                    const url = dossier.universityNoticePath.startsWith('http') ? dossier.universityNoticePath : `${backendBase}${dossier.universityNoticePath}`;
                    return (
                      <a href={url} target="_blank" rel="noreferrer" className="text-green-700 text-xs font-medium hover:underline">
                        📄 Voir l'avis d'inscription universitaire
                      </a>
                    );
                  })()}
                </div>
              )}
            </dl>
          </div>

          {/* Hébergeur */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">🏠 Hébergeur assigné</h3>
            {dossier.host ? (
              <div className="space-y-2 text-sm">
                <dl className="space-y-2">
                  <div className="flex justify-between"><dt className="text-gray-400">Nom</dt><dd className="font-medium">{dossier.host.firstName} {dossier.host.lastName}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-400">Email</dt><dd className="font-medium">{dossier.host.email}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-400">Genre</dt><dd className="font-medium">{dossier.host.gender === 'F' ? 'Féminin' : 'Masculin'}</dd></div>
                </dl>
                {['pending', 'host_assigned'].includes(dossier.status) && (
                  <button onClick={() => action('revoke')} disabled={actionLoading === 'revoke'} className="mt-3 text-red-600 text-xs hover:underline">
                    {actionLoading === 'revoke' ? '...' : '🗑 Révoquer l\'hébergeur'}
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-gray-400 text-sm mb-3 italic">Aucun hébergeur assigné</p>
                {dossier.status === 'pending' && (
                  <div className="space-y-3">
                    <select
                      value={selectedHost}
                      onChange={e => setSelectedHost(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      <option value="">— Choisir un hébergeur —</option>
                      {hosts.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.firstName} {h.lastName} ({h._count?.hostDossiers || 0} dossier{h._count?.hostDossiers > 1 ? 's' : ''})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => action('assign')}
                      disabled={!selectedHost || actionLoading === 'assign'}
                      className="btn-primary w-full justify-center text-sm"
                    >
                      {actionLoading === 'assign' ? 'Assignation...' : '✅ Assigner cet hébergeur'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documents hébergeur */}
        {dossier.hostDocuments?.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">📁 Documents soumis par l'hébergeur</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {dossier.hostDocuments.map(doc => {
                const labels = { bail: '📋 Contrat de bail', energy: '⚡ Contrat d\'énergie', identity: '🪪 Pièce d\'identité' };
                const backendBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
                const docUrl = doc.filePath.startsWith('http') ? doc.filePath : `${backendBase}${doc.filePath}`;
                return (
                  <a key={doc.id} href={docUrl} target="_blank" rel="noreferrer"
                    className="border border-gray-200 rounded-xl p-4 hover:border-green-400 hover:bg-green-50 transition-all group">
                    <p className="text-sm font-medium text-gray-800 mb-1">{labels[doc.docType] || doc.docType}</p>
                    <p className="text-xs text-green-700 group-hover:underline">Voir le document →</p>
                    {doc.verified && <span className="text-xs text-green-600 font-medium">✔ Vérifié</span>}
                  </a>
                );
              })}
            </div>

            {/* Actions validation */}
            {dossier.status === 'documents_provided' && (
              <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
                <button onClick={() => action('validate')} disabled={!!actionLoading} className="btn-primary flex-1 justify-center text-sm">
                  {actionLoading === 'validate' ? 'Validation...' : '✅ Valider les documents'}
                </button>
                <button onClick={() => setShowRejectModal(true)} className="btn-danger flex-1 text-sm">
                  ❌ Rejeter les documents
                </button>
              </div>
            )}
          </div>
        )}

        {/* PDF & clôture */}
        {['documents_provided', 'documents_verified', 'confirmed'].includes(dossier.status) && (
          <div className="card bg-green-50 border-green-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-green-900">📄 Attestation PDF</h3>
                <p className="text-green-700 text-sm mt-1">
                  {dossier.status === 'confirmed'
                    ? 'Dossier clôturé — attestation envoyée à l\'étudiant'
                    : 'Prévisualisez l\'attestation avant de clôturer'
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={downloadPDF} className="btn-secondary text-sm">⬇ Télécharger le PDF</button>
                {dossier.status === 'documents_verified' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Clôturer le dossier ? L\'étudiant recevra l\'attestation par email.')) action('close');
                    }}
                    disabled={actionLoading === 'close'}
                    className="btn-gold text-sm"
                  >
                    {actionLoading === 'close' ? 'Envoi...' : '🎉 Clôturer & envoyer'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes admin */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">📝 Notes administratives (internes)</h3>
          <textarea
            rows={4} value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ajouter une note interne sur ce dossier..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none mb-3"
          />
          <button onClick={() => action('notes')} disabled={actionLoading === 'notes'} className="btn-primary text-sm">
            {actionLoading === 'notes' ? 'Sauvegarde...' : '💾 Sauvegarder les notes'}
          </button>
        </div>
      </div>
    </MemberLayout>
  );
}
