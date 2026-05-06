import { useState, useEffect } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { StatusBadge, DossierStepper } from '../../components/members/SharedComponents';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function StudentMyDossier() {
  const { user } = useAuth();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [noticFile, setNoticeFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);
  const [aviFile, setAviFile] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [toast, setToast] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const downloadPdf = async (dossierId) => {
    setDownloading(true);
    try {
      const res = await api.get(`/pdf/${dossierId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Attestation_AEGL.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Erreur lors du téléchargement du PDF', 'error');
    } finally { setDownloading(false); }
  };

  useEffect(() => {
    api.get('/dossiers').then(r => {
      const all = r.data.dossiers || [];
      setDossier(all.find(d => d.student?.id === user?.id) || all[0] || null);
    }).finally(() => setLoading(false));
  }, []);

  const openModal = (mode) => {
    setModalMode(mode);
    setNoticeFile(null);
    setPassportFile(null);
    setAviFile(null);
    setShowCreate(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (!noticFile || !passportFile || !aviFile) {
        showToast('L\'accord préalable, le passeport et l\'AVI sont obligatoires', 'error');
        setCreating(false);
        return;
      }
      const fd = new FormData();
      fd.append('universityNotice', noticFile);
      fd.append('passport', passportFile);
      fd.append('avi', aviFile);
      let res;
      if (modalMode === 'resubmit') {
        res = await api.patch(`/dossiers/${dossier.id}/resubmit-student-docs`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Documents re-soumis ! L\'administration va les vérifier à nouveau.');
      } else {
        res = await api.post('/dossiers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Dossier créé avec succès ! L\'administration va traiter votre demande.');
      }
      setDossier(res.data.dossier);
      setShowCreate(false);
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de l\'envoi', 'error');
    } finally { setCreating(false); }
  };

  const statusMessages = {
    pending: dossier?.studentDocsVerified ? {
      title: 'Documents vérifiés — en attente d\'hébergeur',
      desc: 'Vos documents ont été validés. Le Bureau AEGL va vous assigner un hébergeur bénévole.',
      icon: '✅', color: 'bg-green-50 border-green-200 text-green-800',
    } : dossier?.studentDocsRejectedReason ? {
      title: 'Documents refusés — action requise',
      desc: 'Vos documents ont été refusés. Consultez le motif ci-dessous et re-soumettez les documents corrigés.',
      icon: '❌', color: 'bg-red-50 border-red-200 text-red-800',
    } : {
      title: 'Documents en cours de vérification',
      desc: 'Le Bureau AEGL vérifie vos documents. Vous serez notifié(e) du résultat.',
      icon: '🔍', color: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    host_assigned: {
      title: 'Un hébergeur vous a été assigné !',
      desc: 'L\'hébergeur doit maintenant soumettre ses documents (bail, énergie, identité). Nous vous tiendrons informé(e).',
      icon: '🤝', color: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    documents_provided: {
      title: 'Documents soumis — vérification en cours',
      desc: 'Le Bureau AEGL vérifie les documents de votre hébergeur. Merci de patienter.',
      icon: '🔍', color: 'bg-purple-50 border-purple-200 text-purple-800',
    },
    documents_verified: {
      title: 'Documents validés !',
      desc: 'Vos documents ont été vérifiés. Le Bureau AEGL va clôturer votre dossier et vous envoyer l\'attestation.',
      icon: '✅', color: 'bg-green-50 border-green-200 text-green-800',
    },
    confirmed: {
      title: '🎉 Votre attestation est prête !',
      desc: 'Félicitations ! Votre attestation d\'hébergement a été générée. Téléchargez-la ci-dessous.',
      icon: '🎉', color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
  };

  return (
    <MemberLayout title="Mon dossier">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${toast.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Modal création */}
      {showCreate && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-heading text-xl text-green-900">
                {modalMode === 'resubmit' ? 'Re-soumettre mes documents' : 'Créer mon dossier'}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {modalMode === 'resubmit'
                  ? 'Soumettez à nouveau les 3 documents corrigés pour que l\'administration puisse les vérifier.'
                  : '3 documents obligatoires : accord préalable, passeport, AVI'}
              </p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {[
                { id: 'notice-file', label: '📄 Accord préalable d\'inscription *', file: noticFile, setter: setNoticeFile, required: true },
                { id: 'passport-file', label: '🛂 Passeport *', file: passportFile, setter: setPassportFile, required: true },
                { id: 'avi-file', label: '💳 Attestation de Virement Irrévocable (AVI) *', file: aviFile, setter: setAviFile, required: true },
              ].map(({ id, label, file, setter, required }) => (
                <div key={id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${file ? 'border-green-400 bg-green-50' : required ? 'border-red-200 hover:border-green-300' : 'border-gray-200 hover:border-green-300'}`}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" id={id} className="hidden"
                      onChange={e => setter(e.target.files[0])} />
                    <label htmlFor={id} className="cursor-pointer">
                      {file ? (
                        <div><p className="text-green-700 font-medium text-sm">{file.name}</p><p className="text-green-500 text-xs">Cliquer pour changer</p></div>
                      ) : (
                        <div><p className="text-gray-500 text-sm">Cliquez pour choisir un fichier</p><p className="text-gray-300 text-xs mt-1">PDF, JPG, PNG</p></div>
                      )}
                    </label>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 btn-secondary text-sm">Annuler</button>
                <button type="submit" disabled={creating} className="flex-1 btn-primary text-sm">
                  {creating
                    ? (modalMode === 'resubmit' ? 'Envoi...' : 'Création...')
                    : (modalMode === 'resubmit' ? '📤 Re-soumettre mes documents' : '📁 Créer mon dossier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-fade-in max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : !dossier ? (
          /* Pas encore de dossier */
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">📁</p>
            <h2 className="font-heading text-2xl text-green-900 mb-3">Commencez votre demande</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              Créez votre dossier pour demander une attestation d'hébergement via l'AEGL.
              L'équipe vous assignera un hébergeur bénévole.
            </p>
            <button onClick={() => openModal('create')} className="btn-primary">
              📁 Créer mon dossier →
            </button>
          </div>
        ) : (
          /* Dossier existant */
          <>
            {/* Statut message */}
            {statusMessages[dossier.status] && (
              <div className={`border rounded-2xl p-5 ${statusMessages[dossier.status].color}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{statusMessages[dossier.status].icon}</span>
                  <div>
                    <h3 className="font-semibold">{statusMessages[dossier.status].title}</h3>
                    <p className="text-sm mt-1 opacity-80">{statusMessages[dossier.status].desc}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dossier card */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-800">Mon dossier</h2>
                <StatusBadge status={dossier.status} />
              </div>
              <DossierStepper status={dossier.status} />
            </div>

            {/* Hébergeur assigné */}
            {dossier.host && (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">🏠 Mon hébergeur</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-800">
                    {dossier.host.firstName[0]}{dossier.host.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dossier.host.firstName} {dossier.host.lastName}</p>
                    <p className="text-gray-400 text-sm">{dossier.host.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rejet documents étudiant */}
            {dossier.studentDocsRejectedReason && !dossier.studentDocsVerified && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">❌ Documents refusés</h3>
                    <p className="text-red-700 text-sm">{dossier.studentDocsRejectedReason}</p>
                    <p className="text-red-500 text-xs mt-2">Corrigez les documents mentionnés et soumettez-les à nouveau.</p>
                  </div>
                  <button
                    onClick={() => openModal('resubmit')}
                    className="flex-shrink-0 btn-primary text-sm whitespace-nowrap"
                  >
                    📤 Re-soumettre
                  </button>
                </div>
              </div>
            )}

            {/* Notes admin */}
            {dossier.adminNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="font-semibold text-amber-800 mb-2">📝 Message de l'administration</h3>
                <p className="text-amber-700 text-sm">{dossier.adminNotes}</p>
              </div>
            )}

            {/* Téléchargement PDF */}
            {['documents_provided', 'documents_verified', 'confirmed'].includes(dossier.status) && (
              <div className="card bg-green-50 border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900">📄 Mon attestation d'hébergement</h3>
                    <p className="text-green-700 text-sm mt-1">
                      {dossier.status === 'confirmed'
                        ? 'Attestation officielle disponible — téléchargez-la ci-dessous'
                        : 'Aperçu disponible en attente de finalisation'}
                    </p>
                  </div>
                  <button onClick={() => downloadPdf(dossier.id)} disabled={downloading} className="btn-primary">
                    {downloading ? '⏳ Chargement...' : '⬇ Télécharger'}
                  </button>
                </div>
              </div>
            )}

            {/* Documents de l'hébergeur (visibles après validation admin) */}
            {['documents_verified', 'confirmed'].includes(dossier.status) && dossier.hostDocuments?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">📎 Documents de mon hébergeur</h3>
                <div className="space-y-3">
                  {dossier.hostDocuments.map(doc => {
                    const labels = { bail: '📋 Contrat de bail', energy: '⚡ Contrat d\'énergie', identity: '🪪 Pièce d\'identité' };
                    return (
                      <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-700">{labels[doc.docType] || doc.docType}</span>
                        <a href={doc.filePath} target="_blank" rel="noreferrer"
                          className="text-xs text-green-700 font-medium border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors">
                          Voir le document →
                        </a>
                      </div>
                    );
                  })}
                </div>
                {dossier.hostAddress && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Adresse d'hébergement</p>
                    <p className="text-sm font-medium text-gray-700">📍 {dossier.hostAddress}</p>
                  </div>
                )}
              </div>
            )}

            {/* Infos dossier */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">📋 Informations du dossier</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-400">N° dossier</dt><dd className="font-mono text-xs font-medium">{dossier.id.substring(0, 8).toUpperCase()}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-400">Créé le</dt><dd>{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</dd></div>
                {dossier.closedAt && <div className="flex justify-between"><dt className="text-gray-400">Clôturé le</dt><dd className="font-medium text-green-700">{new Date(dossier.closedAt).toLocaleDateString('fr-FR')}</dd></div>}
                {(dossier.universityNoticePath || dossier.passportPath || dossier.aviPath) && (
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    {dossier.universityNoticePath && <a href={dossier.universityNoticePath} target="_blank" rel="noreferrer" className="block text-green-700 text-xs font-medium hover:underline">📄 Accord préalable d'inscription →</a>}
                    {dossier.passportPath && <a href={dossier.passportPath} target="_blank" rel="noreferrer" className="block text-green-700 text-xs font-medium hover:underline">🛂 Passeport →</a>}
                    {dossier.aviPath && <a href={dossier.aviPath} target="_blank" rel="noreferrer" className="block text-green-700 text-xs font-medium hover:underline">💳 AVI →</a>}
                  </div>
                )}
              </dl>
            </div>
          </>
        )}
      </div>
    </MemberLayout>
  );
}
