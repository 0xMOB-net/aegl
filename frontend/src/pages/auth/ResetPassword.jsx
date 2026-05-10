import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const checkPassword = (pwd) => ({
  length:  pwd.length >= 8,
  upper:   /[A-Z]/.test(pwd),
  lower:   /[a-z]/.test(pwd),
  number:  /[0-9]/.test(pwd),
  special: /[^A-Za-z0-9]/.test(pwd),
});

const STRENGTH_LEVELS = [
  { label: 'Très faible', color: 'bg-red-500',    text: 'text-red-600'    },
  { label: 'Faible',      color: 'bg-orange-400', text: 'text-orange-600' },
  { label: 'Moyen',       color: 'bg-yellow-400', text: 'text-yellow-600' },
  { label: 'Fort',        color: 'bg-green-500',  text: 'text-green-600'  },
  { label: 'Très fort',   color: 'bg-emerald-500',text: 'text-emerald-600'},
];

function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const checks = checkPassword(password);
  const score = Object.values(checks).filter(Boolean).length;
  const level = STRENGTH_LEVELS[score - 1] || STRENGTH_LEVELS[0];

  const criteria = [
    { key: 'length',  label: '8 caractères minimum' },
    { key: 'upper',   label: 'Une lettre majuscule (A-Z)' },
    { key: 'lower',   label: 'Une lettre minuscule (a-z)' },
    { key: 'number',  label: 'Un chiffre (0-9)' },
    { key: 'special', label: 'Un caractère spécial (!@#$%&*)' },
  ];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? level.color : 'bg-gray-200'}`} />
          ))}
        </div>
        <span className={`text-xs font-semibold whitespace-nowrap ${level.text}`}>{level.label}</span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {criteria.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`text-xs font-bold flex-shrink-0 ${checks[key] ? 'text-green-600' : 'text-gray-300'}`}>
              {checks[key] ? '✓' : '○'}
            </span>
            <span className={`text-xs transition-colors ${checks[key] ? 'text-green-700 line-through decoration-green-300' : 'text-gray-500'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const checks = checkPassword(form.newPassword);
  const isPasswordValid = Object.values(checks).every(Boolean);
  const passwordsMatch = form.newPassword === form.confirmPassword;

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) return setStatus({ type: 'error', msg: 'Le mot de passe ne respecte pas tous les critères de sécurité.' });
    if (!passwordsMatch)  return setStatus({ type: 'error', msg: 'Les mots de passe ne correspondent pas.' });
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, newPassword: form.newPassword,
      });
      setStatus({ type: 'success', msg: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Erreur lors de la réinitialisation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-green-800 rounded-xl flex items-center justify-center">
              <span className="text-yellow-400 font-bold">A</span>
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
            <div className="grid grid-cols-2 gap-3">
              {[{ name: 'firstName', label: 'Prénom' }, { name: 'lastName', label: 'Nom' }].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input type="text" required value={form[name]}
                    onChange={e => setForm({ ...form, [name]: e.target.value })}
                    className={inputClass} />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={inputClass} />
            </div>

            {/* Nouveau mot de passe + jauge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nouveau mot de passe
                <span className="ml-1 text-xs text-gray-400 font-normal">— critères requis ↓</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12`}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <PasswordStrengthMeter password={form.newPassword} />
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password" required
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className={`${inputClass} ${form.confirmPassword && !passwordsMatch ? 'border-red-300' : ''}`}
                autoComplete="new-password"
              />
              {form.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1.5">✗ Les mots de passe ne correspondent pas</p>
              )}
              {form.confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-600 mt-1.5">✓ Les mots de passe correspondent</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Réinitialisation...' : '🔒 Réinitialiser mon mot de passe →'}
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
