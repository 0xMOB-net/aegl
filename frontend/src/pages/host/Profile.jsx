import { useState } from 'react';
import MemberLayout from '../../components/members/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function HostProfile() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    dateOfBirth:      user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    birthPlace:       user?.birthPlace || '',
    lodgingSurface:   user?.lodgingSurface ?? '',
    currentOccupants: user?.currentOccupants ?? '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const capacity = form.lodgingSurface !== '' && form.currentOccupants !== ''
    ? Math.floor(parseInt(form.lodgingSurface) / 9) - parseInt(form.currentOccupants)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.lodgingSurface === '' || form.currentOccupants === '') {
      return showToast('La surface et le nombre d\'occupants sont obligatoires.', 'error');
    }
    if (parseInt(form.lodgingSurface) < 9) {
      return showToast('La surface doit être d\'au moins 9 m².', 'error');
    }
    if (parseInt(form.currentOccupants) < 0) {
      return showToast('Le nombre d\'occupants ne peut pas être négatif.', 'error');
    }
    setSaving(true);
    try {
      const res = await api.patch('/auth/me', {
        dateOfBirth:      form.dateOfBirth || null,
        birthPlace:       form.birthPlace  || null,
        lodgingSurface:   parseInt(form.lodgingSurface),
        currentOccupants: parseInt(form.currentOccupants),
      });
      updateUser(res.data.user);
      showToast('Profil mis à jour avec succès.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition-colors";

  return (
    <MemberLayout title="Mon profil">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${
          toast.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl space-y-6 animate-fade-in">

        {/* Infos non modifiables */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">👤 Informations personnelles</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-gray-400">Nom complet</dt>
              <dd className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-400">Email</dt>
              <dd className="font-medium text-gray-900">{user?.email}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-400">Genre</dt>
              <dd className="font-medium text-gray-900">{user?.gender === 'F' ? 'Féminin' : 'Masculin'}</dd>
            </div>
          </dl>
          <p className="text-xs text-gray-400 mt-4 italic">Pour modifier votre nom ou email, contactez l'administration AEGL.</p>
        </div>

        {/* Capacité d'hébergement — résumé */}
        <div className={`card border-2 ${capacity === null ? 'border-gray-200' : capacity > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h3 className="font-semibold text-gray-800 mb-3">🏠 Capacité d'hébergement</h3>
          {capacity === null ? (
            <p className="text-gray-400 text-sm">Renseignez votre surface et vos occupants pour voir votre capacité.</p>
          ) : capacity > 0 ? (
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-green-700">+{capacity}</div>
              <div>
                <p className="text-green-800 font-semibold">place{capacity > 1 ? 's' : ''} disponible{capacity > 1 ? 's' : ''}</p>
                <p className="text-green-600 text-xs mt-0.5">
                  {form.lodgingSurface} m² ÷ 9 = {Math.floor(parseInt(form.lodgingSurface) / 9)} place{Math.floor(parseInt(form.lodgingSurface) / 9) > 1 ? 's' : ''} max — {form.currentOccupants} occupant{parseInt(form.currentOccupants) > 1 ? 's' : ''} actuel{parseInt(form.currentOccupants) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-red-600">0</div>
              <div>
                <p className="text-red-700 font-semibold">Logement complet</p>
                <p className="text-red-500 text-xs mt-0.5">
                  {form.lodgingSurface} m² = {Math.floor(parseInt(form.lodgingSurface) / 9)} place{Math.floor(parseInt(form.lodgingSurface) / 9) > 1 ? 's' : ''} max — {form.currentOccupants} occupant{parseInt(form.currentOccupants) > 1 ? 's' : ''} actuel{parseInt(form.currentOccupants) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">Règle : 9 m² minimum par personne (norme légale française)</p>
        </div>

        {/* Formulaire modifiable */}
        <form onSubmit={handleSubmit} className="card space-y-5">
          <h3 className="font-semibold text-gray-800">✏️ Modifier mes informations</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de naissance</label>
              <input type="date" value={form.dateOfBirth}
                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu de naissance</label>
              <input type="text" value={form.birthPlace}
                onChange={e => setForm({ ...form, birthPlace: e.target.value })}
                placeholder="Conakry" className={inputClass} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-green-800 mb-3">🏠 Logement</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Surface <span className="text-red-500">*</span> <span className="text-xs text-gray-400 font-normal">(m²)</span>
                </label>
                <input type="number" min="9" required value={form.lodgingSurface}
                  onChange={e => setForm({ ...form, lodgingSurface: e.target.value })}
                  placeholder="45" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Occupants actuels <span className="text-red-500">*</span>
                </label>
                <input type="number" min="0" required value={form.currentOccupants}
                  onChange={e => setForm({ ...form, currentOccupants: e.target.value })}
                  placeholder="1" className={inputClass} />
              </div>
            </div>
            {form.lodgingSurface && form.currentOccupants !== '' && (
              <div className={`mt-2 text-xs font-medium px-3 py-2 rounded-lg ${capacity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {capacity > 0
                  ? `✓ Vous pouvez accueillir ${capacity} étudiant${capacity > 1 ? 's' : ''} supplémentaire${capacity > 1 ? 's' : ''}`
                  : '⚠ Logement complet — aucune place disponible'}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </span>
            ) : '💾 Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </MemberLayout>
  );
}
