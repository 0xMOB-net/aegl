import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Logo = () => (
  <svg width="40" height="45" viewBox="0 0 38 42" fill="none">
    <defs>
      <clipPath id="shieldLogin">
        <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z"/>
      </clipPath>
    </defs>
    <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z" fill="#FCD116"/>
    <rect x="1" y="30" width="12" height="14" fill="#CE1126" clipPath="url(#shieldLogin)"/>
    <rect x="13" y="30" width="12" height="14" fill="#FCD116" clipPath="url(#shieldLogin)"/>
    <rect x="25" y="30" width="13" height="14" fill="#258553" clipPath="url(#shieldLogin)"/>
    <text x="19" y="25" textAnchor="middle" fill="#0d3321" fontFamily="Georgia,serif" fontWeight="bold" fontSize="15">A</text>
  </svg>
);

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/membres');
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">

      {/* LEFT — Photo + branding */}
      <div className="hidden md:flex flex-col relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1665249814952-9d7172c1155c?w=1200&q=80"
          alt="Gare de Limoges"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/95 via-green-950/80 to-green-800/70" />

        <div className="relative flex flex-col justify-between h-full p-12">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="group-hover:scale-105 transition-transform">
              <Logo />
            </div>
            <div>
              <p className="text-white font-heading font-bold text-xl leading-none">AEGL</p>
              <p className="text-green-400 text-[10px] tracking-widest uppercase">Limoges</p>
            </div>
          </Link>

          <div>
            <blockquote className="text-white/90 font-heading text-2xl leading-relaxed mb-6 italic">
              "La solidarité est la première condition de la réussite collective."
            </blockquote>
            <p className="text-green-400/70 text-sm">— Valeurs de l'AEGL</p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { v: '150+', l: 'Étudiants' },
                { v: '40+', l: 'Hébergeurs' },
                { v: '5+', l: 'Ans' },
              ].map(({ v, l }) => (
                <div key={l} className="bg-white/8 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-gold-500 font-bold font-heading text-xl">{v}</p>
                  <p className="text-green-300/60 text-xs mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flag-stripe rounded-full h-1" />
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="flex flex-col justify-center px-8 py-12 md:px-16 bg-white">
        <div className="max-w-sm w-full mx-auto">

          {/* Mobile logo */}
          <div className="md:hidden mb-8 flex items-center gap-3">
            <Logo />
            <span className="font-heading text-green-800 text-xl font-bold">AEGL</span>
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-3xl text-green-950 mb-2">Connexion</h1>
            <p className="text-gray-400 text-sm">Accédez à votre espace membre AEGL</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="votre@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent hover:border-gray-300 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                <Link to="/reinitialiser-mot-de-passe" className="text-xs text-green-700 hover:text-green-800 hover:underline transition-colors">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent hover:border-gray-300 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : 'Se connecter →'}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-gray-300 text-xs">ou</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <p className="text-center text-gray-500 text-sm">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-green-700 font-semibold hover:text-green-800 hover:underline transition-colors">
              S'inscrire gratuitement
            </Link>
          </p>

          <p className="text-center mt-4">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-500 transition-colors">
              ← Retour au site public
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
