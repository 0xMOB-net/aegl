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
  const [confirming, setConfirming] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const downloadPdf = async (dossierId) => {
    setDownloading(true);
    try {
      const res = await api.get(`/pdf/${dossierId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Dossier_complet_AEGL.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Téléchargement réussi');
    } catch (err) {
      let msg = 'Erreur lors du téléchargement';
      try {
        const blob = err.response?.data;
        if (blob instanceof Blob) {
          const text = await blob.text();
          msg = JSON.parse(text).error || msg;
        }
      } catch {}
      showToast(msg, 'error');
    } finally { setDownloading(false); }
  };

  useEffect(() => {
    api.get('/dossiers').then(r => {
      const all = r.data.dossiers || [];
      setDossier(all.find(d => d.student?.id === user?.id) || all[0] || null);
    }).finally(() => setLoading(false));
  }, []);

  const confirmDossier = async () => {
    setConfirming(true);
    try {
      const res = await api.patch(`/dossiers/${dossier.id}/student-confirm`);
      setDossier(res.data.dossier);
      showToast('Dossier clôturé');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur', 'error');
    } finally { setConfirming(false); }
  };

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
      desc: 'Tous les documents ont été validés. Le Bureau AEGL va générer l\'attestation et l\'envoyer à votre hébergeur pour signature.',
      icon: '✅', color: 'bg-green-50 border-green-200 text-green-800',
    },
    attestation_pending: {
      title: '✍️ Votre hébergeur signe l\'attestation',
      desc: 'L\'attestation a été envoyée à votre hébergeur par email. Dès qu\'il l\'aura signée, vous recevrez votre dossier complet par email.',
      icon: '⏳', color: 'bg-orange-50 border-orange-200 text-orange-800',
    },
    documents_ready: {
      title: 'Votre dossier est disponible',
      desc: 'Téléchargez-le et confirmez la réception.',
      icon: '📥', color: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    confirmed: {
      title: 'Dossier clôturé',
      desc: 'Votre dossier d\'hébergement est complet. Téléchargez-le ci-dessous.',
      icon: '✅', color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
  };

  const docFields = [
    {
      id: 'notice-file',
      label: '📄 Accord préalable d\'inscription *',
      file: noticFile,
      setter: setNoticeFile,
      hint: null,
    },
    {
      id: 'passport-file',
      label: '🛂 Passeport (page identité) *',
      file: passportFile,
      setter: setPassportFile,
      hint: null,
    },
    {
      id: 'avi-file',
      label: '🔐 Attestation de Virement Irrévocable (AVI) *',
      file: aviFile,
      setter: setAviFile,
      hint: 'Document confidentiel — chiffré et accessible uniquement aux agents AEGL habilités.',
      isConfidential: true,
    },
  ];

  return (
    <MemberLayout title="Mon dossier">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${toast.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Modal soumission documents ── */}
      {showCreate && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up my-4">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-heading text-xl text-green-900">
                {modalMode === 'resubmit' ? 'Re-soumettre mes documents' : 'Créer mon dossier'}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {modalMode === 'resubmit'
                  ? 'Soumettez à nouveau les 3 documents corrigés pour vérification.'
                  : '3 documents obligatoires : accord préalable, passeport, AVI'}
              </p>
            </div>

            {/* Bandeau sécurité */}
            <div className="mx-6 mt-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-green-600 text-lg flex-shrink-0 mt-0.5">🔒</span>
              <div>
                <p className="text-green-800 text-xs font-semibold">Vos documents sont protégés</p>
                <p className="text-green-700 text-xs mt-0.5 leading-relaxed">
                  Tous vos fichiers sont <strong>chiffrés</strong> dès l'envoi et stockés sur des serveurs sécurisés.
                  Seuls les agents AEGL habilités y ont accès. Aucun document n'est partagé avec des tiers.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {docFields.map(({ id, label, file, setter, hint, isConfidential }) => (
                <div key={id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  {hint && (
                    <p className={`text-xs mb-2 flex items-center gap-1.5 ${isConfidential ? 'text-amber-600' : 'text-gray-400'}`}>
                      {isConfidential && <span>⚠️</span>}
                      {hint}
                    </p>
                  )}
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    file
                      ? isConfidential ? 'border-amber-400 bg-amber-50' : 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      id={id}
                      className="hidden"
                      onChange={e => setter(e.target.files[0])}
                    />
                    <label htmlFor={id} className="cursor-pointer block">
                      {file ? (
                        <div>
                          <p className={`font-medium text-sm ${isConfidential ? 'text-amber-700' : 'text-green-700'}`}>
                            🔒 {file.name}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">Cliquer pour changer</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-500 text-sm">Cliquez pour choisir un fichier</p>
                          <p className="text-gray-300 text-xs mt-1">PDF, JPG, PNG — max 10 Mo</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              ))}

              {/* Engagement confidentialité */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 leading-relaxed">
                🛡️ En soumettant ce formulaire, vous acceptez que vos documents soient traités
                exclusivement par l'équipe AEGL dans le cadre de votre demande d'attestation.
                Vos documents sont supprimés après clôture du dossier.
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 btn-secondary text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={creating} className="flex-1 btn-primary text-sm">
                  {creating ? 'Envoi...' : modalMode === 'resubmit' ? '🔒 Re-soumettre' : '🔒 Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-fade-in max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !dossier ? (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">📁</p>
            <h2 className="font-heading text-2xl text-green-900 mb-3">Commencez votre demande</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Créez votre dossier pour demander une attestation d'hébergement via l'AEGL.
              L'équipe vous assignera un hébergeur bénévole.
            </p>
            {/* Mini sécurité */}
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700 mb-6">
              🔒 Vos documents sont chiffrés et protégés
            </div>
            <br />
            <button onClick={() => openModal('create')} className="btn-primary">
              📁 Créer mon dossier →
            </button>
          </div>
        ) : (
          <>
            {/* Statut */}
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

            {/* Documents déposés — indicateurs sans liens exposés */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>📎</span> Documents déposés
                <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-1">🔒 Sécurisé</span>
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'hasUniversityNotice', label: 'Accord préalable d\'inscription', icon: '📄' },
                  { key: 'hasPassport',         label: 'Passeport',                       icon: '🛂' },
                  { key: 'hasAvi',              label: 'Attestation de Virement Irrévocable (AVI)', icon: '🔐', confidential: true },
                ].map(({ key, label, icon, confidential }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      {icon} {label}
                      {confidential && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Confidentiel</span>
                      )}
                    </span>
                    {dossier[key] ? (
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                        ✓ Reçu
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full">
                        Non soumis
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                🔒 Vos documents sont chiffrés et accessibles uniquement aux agents AEGL habilités.
                Ils ne sont jamais partagés avec des tiers.
              </p>
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
                  <button onClick={() => openModal('resubmit')} className="flex-shrink-0 btn-primary text-sm whitespace-nowrap">
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

            {/* Documents prêts — en attente de confirmation étudiant */}
            {dossier.status === 'documents_ready' && (
              <div className="card border-2 border-blue-300 bg-blue-50">
                <h3 className="font-semibold text-blue-900 mb-1">📥 Votre dossier est disponible</h3>
                <p className="text-blue-700 text-sm mb-4">
                  Téléchargez-le, vérifiez son contenu, puis confirmez la réception pour clôturer votre dossier.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => downloadPdf(dossier.id)}
                    disabled={downloading}
                    className="btn-secondary flex-1 justify-center"
                  >
                    {downloading ? '⏳ Chargement...' : '⬇ Télécharger'}
                  </button>
                  <button
                    onClick={confirmDossier}
                    disabled={confirming}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-5 rounded-xl transition-colors disabled:opacity-40"
                  >
                    {confirming ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="text-xl font-bold leading-none">✓</span>
                        <span>J'ai reçu mon dossier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Téléchargement PDF */}
            {dossier.status === 'confirmed' && (
              <div className="card border-2 border-emerald-300 bg-emerald-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-emerald-600 text-lg">📄</span>
                      <h3 className="font-semibold text-emerald-900">Dossier clôturé avec succès</h3>
                    </div>
                    <p className="text-emerald-700 text-sm">
                      Votre dossier complet est disponible. Téléchargez-le et conservez-le pour vos démarches administratives.
                    </p>
                    {dossier.closedAt && (
                      <p className="text-emerald-500 text-xs mt-1.5">
                        Clôturé le {new Date(dossier.closedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => downloadPdf(dossier.id)}
                    disabled={downloading}
                    className="btn-primary flex-shrink-0 whitespace-nowrap"
                  >
                    {downloading ? '⏳ Chargement...' : '⬇ Télécharger'}
                  </button>
                </div>
              </div>
            )}

            {/* Informations dossier */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">📋 Informations du dossier</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-400">N° dossier</dt>
                  <dd className="font-mono text-xs font-medium">{dossier.id.substring(0, 8).toUpperCase()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Créé le</dt>
                  <dd>{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</dd>
                </div>
                {dossier.closedAt && (
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Clôturé le</dt>
                    <dd className="font-medium text-green-700">{new Date(dossier.closedAt).toLocaleDateString('fr-FR')}</dd>
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
