import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Logo = () => (
  <svg width="40" height="45" viewBox="0 0 38 42" fill="none">
    <defs><clipPath id="shieldReg"><path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z"/></clipPath></defs>
    <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z" fill="#FCD116"/>
    <rect x="1" y="30" width="12" height="14" fill="#CE1126" clipPath="url(#shieldReg)"/>
    <rect x="13" y="30" width="12" height="14" fill="#FCD116" clipPath="url(#shieldReg)"/>
    <rect x="25" y="30" width="13" height="14" fill="#258553" clipPath="url(#shieldReg)"/>
    <text x="19" y="25" textAnchor="middle" fill="#0d3321" fontFamily="Georgia,serif" fontWeight="bold" fontSize="15">A</text>
  </svg>
);

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
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? level.color : 'bg-gray-200'}`} />
          ))}
        </div>
        <span className={`text-xs font-semibold whitespace-nowrap ${level.text}`}>{level.label}</span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {criteria.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`text-xs font-bold flex-shrink-0 ${checks[key] ? 'text-green-600' : 'text-gray-300'}`}>{checks[key] ? '✓' : '○'}</span>
            <span className={`text-xs transition-colors ${checks[key] ? 'text-green-700 line-through decoration-green-300' : 'text-gray-500'}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '',
    gender: '', role: params.get('role') === 'host' ? 'host' : 'student',
    dateOfBirth: '', birthPlace: '',
    lodgingSurface: '', currentOccupants: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const checks = checkPassword(form.password);
  const isPasswordValid = Object.values(checks).every(Boolean);
  const passwordsMatch = form.password === form.confirmPassword;
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isPasswordValid) return setError('Le mot de passe ne respecte pas tous les critères de sécurité.');
    if (!passwordsMatch)  return setError('Les mots de passe ne correspondent pas.');
    if (!form.gender)     return setError('Veuillez sélectionner votre genre.');
    if (form.role === 'host' && (!form.lodgingSurface || form.currentOccupants === '')) {
      return setError('Veuillez renseigner la surface et le nombre d\'occupants actuels.');
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password,
        gender: form.gender, role: form.role,
        dateOfBirth: form.dateOfBirth || undefined,
        birthPlace: form.birthPlace || undefined,
        ...(form.role === 'host' ? { lodgingSurface: form.lodgingSurface, currentOccupants: form.currentOccupants } : {}),
      });
      navigate('/membres');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent hover:border-gray-300 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="group-hover:scale-105 transition-transform"><Logo /></div>
            <div className="text-left">
              <p className="font-heading text-green-800 text-xl font-bold leading-none">AEGL</p>
              <p className="text-green-600 text-[10px] tracking-widest uppercase">Limoges</p>
            </div>
          </Link>
          <h1 className="font-heading text-3xl text-green-950">Créer un compte</h1>
          <p className="text-gray-400 text-sm mt-2">Rejoignez la communauté AEGL gratuitement</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              <span className="flex-shrink-0">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Je suis</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'student', label: 'Étudiant(e)', desc: 'Je cherche une attestation', icon: '🎓' },
                  { value: 'host',    label: 'Hébergeur(se)', desc: 'Je veux accueillir',       icon: '🏠' },
                ].map(({ value, label, desc, icon }) => (
                  <button key={value} type="button" onClick={() => setForm({ ...form, role: value })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.role === value ? 'border-green-700 bg-green-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    <span className="text-2xl block mb-1.5">{icon}</span>
                    <span className={`text-sm font-semibold block ${form.role === value ? 'text-green-800' : 'text-gray-800'}`}>{label}</span>
                    <span className="text-xs text-gray-400">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genre <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }].map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => setForm({ ...form, gender: value })}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.gender === value ? 'border-green-700 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prénom / Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                <input type="text" required value={form.firstName} onChange={set('firstName')} placeholder="Mamadou" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                <input type="text" required value={form.lastName} onChange={set('lastName')} placeholder="Bah" className={inputClass} />
              </div>
            </div>

            {/* Date de naissance + Lieu */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de naissance</label>
                <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu de naissance</label>
                <input type="text" value={form.birthPlace} onChange={set('birthPlace')} placeholder="Conakry" className={inputClass} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={set('email')} placeholder="votre@email.com" className={inputClass} />
            </div>

            {/* Logement — hébergeurs seulement */}
            {form.role === 'host' && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 space-y-4">
                <p className="text-sm font-semibold text-green-800">🏠 Informations sur votre logement</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Surface <span className="text-red-500">*</span> <span className="text-xs text-gray-400 font-normal">(m²)</span>
                    </label>
                    <input type="number" min="1" required value={form.lodgingSurface} onChange={set('lodgingSurface')} placeholder="45" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Occupants actuels <span className="text-red-500">*</span>
                    </label>
                    <input type="number" min="0" required value={form.currentOccupants} onChange={set('currentOccupants')} placeholder="1" className={inputClass} />
                  </div>
                </div>
                {form.lodgingSurface && form.currentOccupants !== '' && (() => {
                  const avail = Math.floor(parseInt(form.lodgingSurface) / 9) - parseInt(form.currentOccupants);
                  return (
                    <p className={`text-xs font-medium ${avail > 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {avail > 0
                        ? `✓ Capacité estimée : ${avail} place${avail > 1 ? 's' : ''} disponible${avail > 1 ? 's' : ''}`
                        : '⚠ Logement complet (minimum 9 m² par personne)'}
                    </p>
                  );
                })()}
              </div>
            )}

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe <span className="ml-1 text-xs text-gray-400 font-normal">— doit respecter tous les critères</span>
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                  placeholder="••••••••" className={`${inputClass} pr-12`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <PasswordStrengthMeter password={form.password} />
            </div>

            {/* Confirmer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} required value={form.confirmPassword} onChange={set('confirmPassword')}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12 ${form.confirmPassword && !passwordsMatch ? 'border-red-300 focus:ring-red-400' : ''}`}
                  autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {form.confirmPassword && !passwordsMatch && <p className="text-xs text-red-500 mt-1.5">✗ Les mots de passe ne correspondent pas</p>}
              {form.confirmPassword && passwordsMatch  && <p className="text-xs text-green-600 mt-1.5">✓ Les mots de passe correspondent</p>}
            </div>

            <button type="submit" disabled={loading || !isPasswordValid || !passwordsMatch}
              className="btn-primary w-full justify-center py-3.5 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création du compte...
                </span>
              ) : '🔒 Créer mon compte →'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-green-700 font-semibold hover:text-green-800 hover:underline transition-colors">Se connecter</Link>
          </p>
        </div>

        <p className="text-center mt-4">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-500 transition-colors">← Retour au site public</Link>
        </p>
      </div>
    </div>
  );
}
