import { useState, useEffect, useRef } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { StatusBadge, DossierStepper } from '../../components/members/SharedComponents';
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

const DOC_FIELDS = [
  { name: 'bail',        label: 'Contrat de bail',                              icon: '📋' },
  { name: 'identity',   label: "Pièce d'identité / titre de séjour",           icon: '🪪' },
  { name: 'quittance_1', label: 'Quittance de loyer n°1 (la plus récente)',    icon: '🧾' },
  { name: 'quittance_2', label: 'Quittance de loyer n°2',                      icon: '🧾' },
  { name: 'quittance_3', label: 'Quittance de loyer n°3',                      icon: '🧾' },
  { name: 'facture_1',  label: 'Facture nominative n°1 (électricité, téléphone…)', icon: '⚡' },
  { name: 'facture_2',  label: 'Facture nominative n°2',                       icon: '⚡' },
  { name: 'facture_3',  label: 'Facture nominative n°3',                       icon: '⚡' },
];

const emptyFiles = () => Object.fromEntries(DOC_FIELDS.map(f => [f.name, null]));

// Composant canvas de signature
function SignatureCanvas({ onSign, onClear }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a3a2a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    const blank = document.createElement('canvas');
    blank.width = canvas.width; blank.height = canvas.height;
    const isEmpty = canvas.toDataURL() === blank.toDataURL();
    if (!isEmpty) onSign(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white relative">
        <canvas
          ref={canvasRef}
          width={480} height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-300 text-xs pointer-events-none select-none">
          Signez ici avec votre souris ou votre doigt
        </p>
      </div>
      <button type="button" onClick={clear} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
        Effacer et recommencer
      </button>
    </div>
  );
}

export default function HostMyDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);       // dossier sélectionné pour upload docs
  const [signing, setSigning] = useState(null);         // dossier sélectionné pour signature
  const [uploading, setUploading] = useState(false);
  const [submittingSig, setSubmittingSig] = useState(false);
  const [address, setAddress] = useState('');
  const [files, setFiles] = useState(emptyFiles());
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchDossiers = () => {
    api.get('/dossiers').then(r => setDossiers(r.data.dossiers || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDossiers(); }, []);

  // Upload des 8 documents
  const handleUpload = async (e) => {
    e.preventDefault();
    const missing = DOC_FIELDS.filter(f => !files[f.name]).map(f => f.label);
    if (missing.length > 0) return showToast(`Documents manquants : ${missing[0]}${missing.length > 1 ? ` et ${missing.length - 1} autre(s)` : ''}`, 'error');
    if (!address.trim()) return showToast("Veuillez saisir votre adresse complète", 'error');

    setUploading(true);
    try {
      const fd = new FormData();
      DOC_FIELDS.forEach(f => { if (files[f.name]) fd.append(f.name, files[f.name]); });
      fd.append('address', address);
      await api.post(`/documents/${selected.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDossiers(prev => prev.map(d => d.id === selected.id ? { ...d, status: 'documents_provided' } : d));
      setSelected(null);
      setFiles(emptyFiles());
      setAddress('');
      showToast("Documents soumis ! L'administration va les vérifier.");
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors du dépôt', 'error');
    } finally { setUploading(false); }
  };

  // Soumission de la signature
  const handleSign = async () => {
    if (!signatureDataUrl) return showToast('Veuillez signer dans le cadre ci-dessus', 'error');
    setSubmittingSig(true);
    try {
      // Convertir le dataURL en Blob
      const res = await fetch(signatureDataUrl);
      const blob = await res.blob();
      const fd = new FormData();
      fd.append('signature', blob, 'signature.png');
      await api.post(`/dossiers/${signing.id}/sign-attestation`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast("Signature envoyée ! L'étudiant va recevoir son dossier complet par email.");
      setSigning(null);
      setSignatureDataUrl(null);
      fetchDossiers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de la signature', 'error');
    } finally { setSubmittingSig(false); }
  };

  const FileInput = ({ name, label, icon }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{icon} {label} <span className="text-red-500">*</span></label>
      <div className={`border-2 border-dashed rounded-xl p-3 text-center transition-all ${files[name] ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id={`file-${name}`}
          onChange={e => setFiles(prev => ({ ...prev, [name]: e.target.files[0] }))} />
        <label htmlFor={`file-${name}`} className="cursor-pointer block">
          {files[name]
            ? <><p className="text-green-700 font-medium text-xs truncate">{files[name].name}</p><p className="text-green-500 text-xs">Cliquer pour changer</p></>
            : <p className="text-gray-400 text-xs">Cliquez pour choisir (PDF, JPG, PNG)</p>}
        </label>
      </div>
    </div>
  );

  const allFilled = DOC_FIELDS.every(f => files[f.name]);
  const filledCount = DOC_FIELDS.filter(f => files[f.name]).length;

  return (
    <MemberLayout title="Mes dossiers assignés">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${toast.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Modal upload des 8 documents */}
      {selected && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-heading text-xl text-green-900">Soumettre mes documents</h3>
              <p className="text-gray-500 text-sm mt-1">Pour : <strong>{selected.student.firstName} {selected.student.lastName}</strong></p>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                ⚠️ Ces 8 documents sont requis par le consulat. Assurez-vous qu'ils sont lisibles et à votre nom.
              </p>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">📍 Mon adresse complète d'hébergement</label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="123 rue des Lilas, 87100 Limoges"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOC_FIELDS.map(f => <FileInput key={f.name} {...f} />)}
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Documents fournis</span>
                  <span className={allFilled ? 'text-green-700 font-semibold' : ''}>{filledCount} / {DOC_FIELDS.length}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all ${allFilled ? 'bg-green-500' : 'bg-amber-400'}`}
                    style={{ width: `${(filledCount / DOC_FIELDS.length) * 100}%` }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setSelected(null); setFiles(emptyFiles()); setAddress(''); }}
                  className="flex-1 btn-secondary text-sm">Annuler</button>
                <button type="submit" disabled={uploading || !allFilled}
                  className="flex-1 btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? '⏳ Envoi...' : '📤 Soumettre les 8 documents'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal signature de l'attestation */}
      {signing && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-heading text-xl text-green-900">✍️ Signer l'attestation d'hébergement</h3>
              <p className="text-gray-500 text-sm mt-1">Pour : <strong>{signing.student.firstName} {signing.student.lastName}</strong></p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
                <p className="font-semibold mb-1">📄 Comment ça marche ?</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-green-700">
                  <li>Dessinez votre signature dans le cadre ci-dessous</li>
                  <li>Cliquez sur "Valider ma signature"</li>
                  <li>Le système génère automatiquement un PDF complet (attestation + tous vos documents)</li>
                  <li>L'étudiant(e) reçoit immédiatement ce PDF par email</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre signature</label>
                <SignatureCanvas
                  onSign={setSignatureDataUrl}
                  onClear={() => setSignatureDataUrl(null)}
                />
                {signatureDataUrl && (
                  <p className="text-xs text-green-600 mt-1.5">✓ Signature enregistrée</p>
                )}
              </div>

              {submittingSig && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Génération du PDF en cours — cela peut prendre 15 à 30 secondes, ne fermez pas cette fenêtre.
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setSigning(null); setSignatureDataUrl(null); }}
                  disabled={submittingSig}
                  className="flex-1 btn-secondary text-sm disabled:opacity-50">Annuler</button>
                <button type="button" onClick={handleSign}
                  disabled={submittingSig || !signatureDataUrl}
                  className="flex-1 btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {submittingSig ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Traitement...
                    </span>
                  ) : '✅ Valider ma signature'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5 animate-fade-in">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : dossiers.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-gray-500 font-medium">Aucun dossier assigné</p>
            <p className="text-gray-400 text-sm mt-1">L'administration vous contactera quand un étudiant aura besoin de votre aide.</p>
          </div>
        ) : (
          dossiers.map(d => (
            <div key={d.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{d.student.firstName} {d.student.lastName}</h3>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-gray-400 text-sm">{d.student.email}</p>
                  <p className="text-gray-400 text-xs mt-0.5">Dossier du {new Date(d.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {d.status === 'host_assigned' && (
                    <button onClick={() => setSelected(d)} className="btn-primary text-sm">
                      📤 Soumettre mes docs
                    </button>
                  )}
                  {d.status === 'attestation_pending' && (
                    <button onClick={() => setSigning(d)}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-colors animate-pulse">
                      ✍️ Signer l'attestation
                    </button>
                  )}
                </div>
              </div>

              {d.status === 'attestation_pending' && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-800 text-sm font-medium">✍️ Action requise — Signez l'attestation d'hébergement</p>
                  <p className="text-amber-600 text-xs mt-1">L'administration a validé tous les documents. Votre signature est la dernière étape avant que l'étudiant(e) reçoive son dossier complet.</p>
                </div>
              )}

              <DossierStepper status={d.status} />

              {d.adminNotes && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-800 text-sm font-medium">📝 Note de l'administration :</p>
                  <p className="text-amber-700 text-sm mt-1">{d.adminNotes}</p>
                </div>
              )}
              {d.status === 'confirmed' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <p className="text-green-800 text-sm font-medium">🎉 Dossier clôturé — dossier complet envoyé à l'étudiant</p>
                  <button onClick={() => downloadPDF(d.id, `${d.student.firstName}_${d.student.lastName}`)} className="text-green-700 text-xs font-medium hover:underline">
                    Voir l'attestation →
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </MemberLayout>
  );
}
