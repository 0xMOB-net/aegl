import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export default function ResetPassword() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setStatus({ type: 'error', msg: 'Les mots de passe ne correspondent pas' });
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { firstName: form.firstName, lastName: form.lastName, email: form.email, newPassword: form.newPassword });
      setStatus({ type: 'success', msg: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Erreur lors de la réinitialisation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-green-800 rounded-xl flex items-center justify-center">
              <span className="text-gold-500 font-bold">A</span>
            </div>
            <span className="font-heading text-green-800 text-lg font-bold">AEGL</span>
          </Link>
          <h1 className="font-heading text-3xl text-green-900">Réinitialiser le mot de passe</h1>
          <p className="text-gray-500 text-sm mt-2">Renseignez vos informations pour réinitialiser votre mot de passe</p>
        </div>

        <div className="card">
          {status && (
            <div className={`px-4 py-3 rounded-xl text-sm mb-6 ${status.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {status.msg}
              {status.type === 'success' && <Link to="/login" className="block mt-2 font-medium underline">Se connecter →</Link>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[{ name: 'firstName', label: 'Prénom' }, { name: 'lastName', label: 'Nom' }].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input type="text" required value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
              <input type="password" required value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <input type="password" required value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Réinitialisation...' : 'Réinitialiser →'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            <Link to="/login" className="text-green-700 hover:underline">← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
