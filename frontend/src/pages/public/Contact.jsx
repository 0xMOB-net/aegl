import { useState } from 'react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import { Link } from 'react-router-dom';

const PHOTO = 'https://images.unsplash.com/photo-1665249814952-9d7172c1155c?w=1200&q=80';

const contactInfo = [
  {
    icon: '📧',
    title: 'Email',
    value: 'contact@aegl87.fr',
    href: 'mailto:contact@aegl87.fr',
    desc: 'Réponse sous 24–48h',
  },
  {
    icon: '📍',
    title: 'Localisation',
    value: 'Limoges, Haute-Vienne (87)',
    href: null,
    desc: 'France métropolitaine',
  },
  {
    icon: '🏛️',
    title: 'Université partenaire',
    value: 'Université de Limoges',
    href: 'https://www.unilim.fr',
    desc: 'Campus & antennes',
  },
  {
    icon: '🕐',
    title: 'Disponibilité',
    value: 'Lun – Ven, 9h – 18h',
    href: null,
    desc: 'Hors jours fériés',
  },
];

const topics = [
  'Demande d\'attestation',
  'Devenir hébergeur',
  'Problème technique',
  'Informations générales',
  'Partenariat',
  'Autre',
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = form.topic || 'Message depuis le site AEGL';
    const body = `Nom: ${form.name}\nEmail: ${form.email}\nSujet: ${subject}\n\n${form.message}`;
    window.location.href = `mailto:contact@aegl87.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="bg-white">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden">
        <img src={PHOTO} alt="Limoges" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-950/60 to-green-900/20" />

        <div className="relative max-w-7xl mx-auto px-6 pb-16 pt-40 w-full">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
              <span className="text-white/90 text-xs font-medium tracking-widest uppercase">Nous joindre</span>
            </div>
            <h1 className="font-heading text-5xl md:text-6xl text-white leading-tight mb-4">
              Contactez<br />
              <span className="text-gold-500">l'AEGL</span>
            </h1>
            <p className="text-green-200 text-base leading-relaxed">
              Une question, une demande, un partenariat ? Notre équipe bénévole vous répond rapidement.
            </p>
          </div>
        </div>

        <div className="flag-stripe absolute bottom-0 left-0 right-0" />
      </section>

      {/* ===== CONTACT INFO CARDS ===== */}
      <section className="bg-green-950 py-12 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactInfo.map(({ icon, title, value, href, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-gold-500/30 hover:bg-white/8 transition-all">
              <div className="text-2xl mb-3">{icon}</div>
              <p className="text-green-400/60 text-xs uppercase tracking-wide mb-1">{title}</p>
              {href
                ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="text-white text-sm font-medium hover:text-gold-400 transition-colors">{value}</a>
                : <p className="text-white text-sm font-medium">{value}</p>
              }
              <p className="text-green-400/40 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FORM + SOCIAL ===== */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-5 gap-12">

          {/* LEFT: Info & Social */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-heading text-3xl text-green-950 mb-4">On est là pour vous</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                L'équipe AEGL est composée d'étudiants bénévoles qui comprennent vos défis. N'hésitez pas à nous écrire — chaque message est lu et traité avec attention.
              </p>
            </div>

            {/* Réseaux sociaux */}
            <div>
              <h3 className="font-semibold text-green-900 mb-4 text-sm">Retrouvez-nous</h3>
              <div className="space-y-3">
                <a href="mailto:contact@aegl87.fr" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-green-50 transition-colors group">
                  <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email officiel</p>
                    <p className="text-sm font-medium text-green-800 group-hover:text-green-700">contact@aegl87.fr</p>
                  </div>
                </a>

                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Facebook</p>
                    <p className="text-sm font-medium text-blue-700 group-hover:text-blue-600">AEGL Limoges</p>
                  </div>
                </a>

                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-pink-50 transition-colors group">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Instagram</p>
                    <p className="text-sm font-medium text-pink-700 group-hover:text-pink-600">@aegl_limoges</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
              <h3 className="font-semibold text-green-900 text-sm mb-3">Accès rapide</h3>
              <div className="space-y-2">
                <Link to="/inscription" className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 transition-colors">
                  <span className="text-xs">→</span> Créer un compte étudiant
                </Link>
                <Link to="/inscription?role=host" className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 transition-colors">
                  <span className="text-xs">→</span> Devenir hébergeur
                </Link>
                <Link to="/services" className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 transition-colors">
                  <span className="text-xs">→</span> Voir nos services
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <h2 className="font-heading text-2xl text-green-950 mb-2">Envoyer un message</h2>
              <p className="text-gray-400 text-sm mb-8">Votre message sera transmis à notre équipe par email.</p>

              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✉️</div>
                  <h3 className="font-heading text-xl text-green-900 mb-2">Votre messagerie s'est ouverte</h3>
                  <p className="text-gray-500 text-sm mb-6">Finalisez l'envoi depuis votre client email. Nous vous répondrons sous 24–48h.</p>
                  <button onClick={() => setSent(false)} className="btn-secondary text-sm">
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Votre nom complet *</label>
                      <input
                        type="text"
                        required
                        placeholder="Mamadou Bah"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow hover:border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Votre email *</label>
                      <input
                        type="email"
                        required
                        placeholder="mamadou@email.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow hover:border-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sujet de votre demande</label>
                    <select
                      value={form.topic}
                      onChange={e => setForm({ ...form, topic: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow hover:border-gray-300 bg-white"
                    >
                      <option value="">Choisir un sujet...</option>
                      {topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Votre message *</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Décrivez votre demande en détail. Plus vous êtes précis(e), mieux nous pourrons vous aider."
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow hover:border-gray-300 resize-none"
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center py-4 text-base">
                    Envoyer le message →
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    En envoyant ce message, votre client email s'ouvrira avec les informations pré-remplies.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
