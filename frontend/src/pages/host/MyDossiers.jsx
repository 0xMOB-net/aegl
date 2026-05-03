import { useState, useEffect, useRef } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { StatusBadge, DossierStepper } from '../../components/members/SharedComponents';
import api from '../../api/client';

export default function HostMyDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [address, setAddress] = useState('');
  const [files, setFiles] = useState({ bail: null, energy: null, identity: null });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    api.get('/dossiers').then(r => setDossiers(r.data.dossiers || [])).finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files.bail || !files.energy || !files.identity) return showToast('Veuillez fournir les 3 documents', 'error');
    if (!address.trim()) return showToast('Veuillez saisir votre adresse complète', 'error');

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('bail', files.bail);
      fd.append('energy', files.energy);
      fd.append('identity', files.identity);
      fd.append('address', address);

      const res = await api.post(`/documents/${selected.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDossiers(prev => prev.map(d => d.id === selected.id ? { ...d, status: 'documents_provided' } : d));
      setSelected(null);
      showToast('Documents soumis avec succès ! L\'administration va les vérifier.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors du dépôt', 'error');
    } finally { setUploading(false); }
  };

  const FileInput = ({ name, label, icon }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{icon} {label}</label>
      <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${files[name] ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id={`file-${name}`}
          onChange={e => setFiles(prev => ({ ...prev, [name]: e.target.files[0] }))} />
        <label htmlFor={`file-${name}`} className="cursor-pointer">
          {files[name] ? (
            <div>
              <p className="text-green-700 font-medium text-sm">{files[name].name}</p>
              <p className="text-green-500 text-xs">Cliquer pour changer</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-sm">Cliquez pour choisir un fichier</p>
              <p className="text-gray-300 text-xs mt-1">PDF, JPG, PNG (max 10 Mo)</p>
            </div>
          )}
        </label>
      </div>
    </div>
  );

  return (
    <MemberLayout title="Mes dossiers assignés">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${toast.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Modal upload */}
      {selected && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-heading text-xl text-green-900">Soumettre mes documents</h3>
              <p className="text-gray-500 text-sm mt-1">Pour : {selected.student.firstName} {selected.student.lastName}</p>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">📍 Mon adresse complète d'hébergement</label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="123 rue des Lilas, 87000 Limoges"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <FileInput name="bail" label="Contrat de bail" icon="📋" />
              <FileInput name="energy" label="Contrat d'énergie (électricité/gaz)" icon="⚡" />
              <FileInput name="identity" label="Pièce d'identité" icon="🪪" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setSelected(null); setFiles({ bail: null, energy: null, identity: null }); setAddress(''); }} className="flex-1 btn-secondary text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={uploading} className="flex-1 btn-primary text-sm">
                  {uploading ? '⏳ Envoi en cours...' : '📤 Soumettre les documents'}
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
                  <a href={`/api/pdf/${d.id}`} target="_blank" rel="noreferrer" className="text-green-700 text-xs font-medium hover:underline">
                    Voir le PDF →
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </MemberLayout>
  );
}
