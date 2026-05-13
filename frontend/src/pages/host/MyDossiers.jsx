import { useState, useEffect } from 'react';
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
  { name: 'bail',        label: 'Contrat de bail',              icon: '📋', required: true },
  { name: 'identity',   label: 'Pièce d\'identité / titre de séjour', icon: '🪪', required: true },
  { name: 'quittance_1', label: 'Quittance de loyer n°1 (la plus récente)',  icon: '🧾', required: true },
  { name: 'quittance_2', label: 'Quittance de loyer n°2',       icon: '🧾', required: true },
  { name: 'quittance_3', label: 'Quittance de loyer n°3',       icon: '🧾', required: true },
  { name: 'facture_1',  label: 'Facture nominative n°1 (électricité, téléphone…)', icon: '⚡', required: true },
  { name: 'facture_2',  label: 'Facture nominative n°2',        icon: '⚡', required: true },
  { name: 'facture_3',  label: 'Facture nominative n°3',        icon: '⚡', required: true },
];

const emptyFiles = () => Object.fromEntries(DOC_FIELDS.map(f => [f.name, null]));

export default function HostMyDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [address, setAddress] = useState('');
  const [files, setFiles] = useState(emptyFiles());
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    api.get('/dossiers').then(r => setDossiers(r.data.dossiers || [])).finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const missing = DOC_FIELDS.filter(f => f.required && !files[f.name]).map(f => f.label);
    if (missing.length > 0) return showToast(`Documents manquants : ${missing.join(', ')}`, 'error');
    if (!address.trim()) return showToast('Veuillez saisir votre adresse complète', 'error');

    setUploading(true);
    try {
      const fd = new FormData();
      DOC_FIELDS.forEach(f => { if (files[f.name]) fd.append(f.name, files[f.name]); });
      fd.append('address', address);
      await api.post(`/documents/${selected.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDossiers(prev => prev.map(d => d.id === selected.id ? { ...d, status: 'documents_provided' } : d));
      setSelected(null);
      showToast('Documents soumis avec succès ! L\'administration va les vérifier.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors du dépôt', 'error');
    } finally { setUploading(false); }
  };

  const FileInput = ({ name, label, icon }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{icon} {label} <span className="text-red-500">*</span></label>
      <div className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${files[name] ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id={`file-${name}`}
          onChange={e => setFiles(prev => ({ ...prev, [name]: e.target.files[0] }))} />
        <label htmlFor={`file-${name}`} className="cursor-pointer block">
          {files[name] ? (
            <>
              <p className="text-green-700 font-medium text-xs truncate">{files[name].name}</p>
              <p className="text-green-500 text-xs">Cliquer pour changer</p>
            </>
          ) : (
            <p className="text-gray-400 text-xs">Cliquez pour choisir (PDF, JPG, PNG)</p>
          )}
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

      {/* Modal dépôt documents */}
      {selected && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-heading text-xl text-green-900">Soumettre mes documents</h3>
              <p className="text-gray-500 text-sm mt-1">Pour : <strong>{selected.student.firstName} {selected.student.lastName}</strong></p>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                ⚠️ Ces 8 documents sont requis par le consulat (visa étudiant). Assurez-vous qu'ils sont lisibles et à votre nom.
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

              {/* Barre de progression */}
              <div className="pt-2">
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
                <button type="button"
                  onClick={() => { setSelected(null); setFiles(emptyFiles()); setAddress(''); }}
                  className="flex-1 btn-secondary text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={uploading || !allFilled}
                  className="flex-1 btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? '⏳ Envoi en cours...' : '📤 Soumettre les 8 documents'}
                </button>
              </div>
            </form>
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
                {d.status === 'host_assigned' && (
                  <button onClick={() => setSelected(d)} className="btn-primary text-sm flex-shrink-0">
                    📤 Soumettre mes docs
                  </button>
                )}
              </div>
              <DossierStepper status={d.status} />
              {d.adminNotes && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-800 text-sm font-medium">📝 Note de l'administration :</p>
                  <p className="text-amber-700 text-sm mt-1">{d.adminNotes}</p>
                </div>
              )}
              {d.status === 'confirmed' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <p className="text-green-800 text-sm font-medium">🎉 Dossier clôturé — attestation envoyée à l'étudiant</p>
                  <button onClick={() => downloadPDF(d.id, `${d.student.firstName}_${d.student.lastName}`)} className="text-green-700 text-xs font-medium hover:underline">
                    Voir le PDF →
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
