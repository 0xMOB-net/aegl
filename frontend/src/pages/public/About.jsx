import { Link } from 'react-router-dom';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';

const PHOTOS = {
  hero:  'https://images.unsplash.com/photo-1706873556600-7bdf44c2caff?w=1920&q=80',
  gare:  'https://images.unsplash.com/photo-1665249814952-9d7172c1155c?w=1200&q=80',
  city1: 'https://images.unsplash.com/photo-1681633228423-e55b609905fb?w=900&q=80',
  city2: 'https://images.unsplash.com/photo-1681633227946-d6fc7b631f8f?w=900&q=80',
};

const Logo = () => (
  <svg width="48" height="54" viewBox="0 0 38 42" fill="none">
    <defs>
      <clipPath id="shieldAbout">
        <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z"/>
      </clipPath>
    </defs>
    <path d="M19 1L37 9V24C37 34 29 39.5 19 42C9 39.5 1 34 1 24V9L19 1Z" fill="#FCD116"/>
    <rect x="1" y="30" width="12" height="14" fill="#CE1126" clipPath="url(#shieldAbout)"/>
    <rect x="13" y="30" width="12" height="14" fill="#FCD116" clipPath="url(#shieldAbout)"/>
    <rect x="25" y="30" width="13" height="14" fill="#258553" clipPath="url(#shieldAbout)"/>
    <text x="19" y="25" textAnchor="middle" fill="#0d3321" fontFamily="Georgia,serif" fontWeight="bold" fontSize="15">A</text>
  </svg>
);

const stats = [
  { value: '150+', label: 'Étudiants accompagnés' },
  { value: '80+',  label: 'Attestations délivrées' },
  { value: '10+',  label: 'Hébergeurs partenaires' },
  { value: '5+',   label: 'Années d\'expérience' },
];

const values = [
  { icon: '🤝', title: 'Solidarité', desc: 'Nous croyons en la force du collectif. Chaque étudiant qui réussit inspire et soutient les suivants.' },
  { icon: '🎯', title: 'Engagement', desc: 'Nos membres bénévoles s\'investissent sans compter pour que chaque dossier soit traité avec sérieux.' },
  { icon: '🏆', title: 'Excellence', desc: 'Nous visons l\'excellence dans chaque service rendu — rapidité, précision, et bienveillance.' },
  { icon: '🌍', title: 'Identité', desc: 'Fiers de nos racines guinéennes, nous cultivons notre culture tout en nous intégrant pleinement.' },
  { icon: '🔒', title: 'Confiance', desc: 'Vos données et documents sont traités avec la plus grande discrétion et sécurité.' },
  { icon: '💡', title: 'Innovation', desc: 'Nous modernisons nos outils pour offrir des services toujours plus accessibles et efficaces.' },
];

const timeline = [
  { year: '2018', title: 'Fondation', desc: 'Quelques étudiants guinéens à Limoges décident de s\'organiser pour s\'entraider dans les démarches administratives.' },
  { year: '2019', title: 'Premiers partenaires', desc: 'Le réseau d\'hébergeurs bénévoles s\'élargit. Les premières attestations officielles sont délivrées.' },
  { year: '2021', title: 'Digitalisation', desc: 'Lancement de la première plateforme numérique de gestion des dossiers d\'attestation.' },
  { year: '2023', title: 'Expansion des services', desc: 'L\'AEGL étend son action : guide d\'intégration, événements culturels, soutien académique.' },
  { year: '2024', title: 'Nouvelle ère', desc: 'Plateforme moderne, communauté soudée, l\'AEGL est un pilier pour les étudiants guinéens à Limoges.' },
];

/* Vrais membres du bureau */
const bureau = [
  {
    nom: 'Hadja Fatoumata Dramé',
    titre: 'Présidente',
    icon: '👑',
    initiales: 'HF',
    desc: 'Dirige l\'association et représente l\'AEGL auprès des institutions et partenaires.',
    gradient: 'from-gold-500 to-yellow-600',
  },
  {
    nom: 'Mamadou Oury Baldé',
    titre: 'Trésorier',
    icon: '💰',
    initiales: 'MO',
    desc: 'Assure la gestion financière, le suivi budgétaire et la transparence des comptes.',
    gradient: 'from-green-600 to-green-800',
  },
  {
    nom: 'Fatimatou Diallo',
    titre: 'Chargée à la communication',
    icon: '📣',
    initiales: 'FD',
    desc: 'Gère la communication interne et externe, les réseaux sociaux et la visibilité de l\'AEGL.',
    gradient: 'from-purple-600 to-purple-800',
  },
  {
    nom: 'Mamadou Talibé Diallo',
    titre: 'Secrétaire général',
    icon: '📝',
    initiales: 'MT',
    desc: 'Gère l\'administration, les archives, les procès-verbaux et les communications officielles.',
    gradient: 'from-blue-600 to-blue-800',
  },
  {
    nom: 'Alseny Diallo',
    titre: 'Chargé aux sports & activités culturelles',
    icon: '⚽',
    initiales: 'AD',
    desc: 'Organise les événements sportifs, culturels et les activités de cohésion de la communauté.',
    gradient: 'from-red-600 to-red-800',
  },
];

export default function About() {
  return (
    <div className="bg-white">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <img src={PHOTOS.hero} alt="Limoges" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-950/60 to-green-900/20" />

        <div className="relative max-w-7xl mx-auto px-6 pb-20 pt-40 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
              <span className="text-white/90 text-xs font-medium tracking-widest uppercase">Notre association</span>
            </div>
            <h1 className="font-heading text-5xl md:text-7xl text-white leading-tight mb-6">
              À propos de<br />
              <span className="text-gold-500">l'AEGL</span>
            </h1>
            <p className="text-green-200 text-lg leading-relaxed">
              L'Association des Étudiants Guinéens de Limoges — un réseau de solidarité, d'entraide et de réussite au cœur de la Haute-Vienne.
            </p>
          </div>
        </div>

        <div className="flag-stripe absolute bottom-0 left-0 right-0" />
      </section>

      {/* ===== STATS ===== */}
      <section className="bg-green-950 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-heading text-4xl md:text-5xl text-gold-500 mb-2">{value}</div>
                <div className="text-green-300/70 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HISTOIRE ===== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold-500 font-semibold text-sm tracking-widest uppercase mb-4">Notre histoire</p>
              <h2 className="font-heading text-4xl md:text-5xl text-green-950 leading-tight mb-6">
                Nés de la solidarité,<br />
                <span className="text-green-700">unis par l'avenir</span>
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  L'AEGL est née d'un constat simple : les étudiants guinéens arrivant à Limoges faisaient face à d'immenses difficultés administratives. Sans attestation d'hébergement, impossible d'ouvrir un compte bancaire, d'accéder aux aides de la CAF, ou de renouveler un titre de séjour.
                </p>
                <p>
                  Face à ce vide, des étudiants déjà établis ont décidé d'agir. Ils ont mobilisé leur réseau, trouvé des hébergeurs bénévoles, et formalisé le processus. Aujourd'hui, l'AEGL est une vraie force communautaire — bien au-delà des attestations.
                </p>
                <p>
                  Nous organisons des événements culturels, offrons un soutien académique, partageons les bonnes adresses, et créons les liens qui permettent à chaque étudiant de se sentir chez lui à Limoges.
                </p>
              </div>
              <div className="mt-8">
                <Link to="/services" className="btn-primary">Découvrir nos services →</Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5]">
                <img src={PHOTOS.gare} alt="Gare de Limoges-Bénédictins" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white font-semibold text-lg">Gare de Limoges-Bénédictins</p>
                  <p className="text-green-200/80 text-sm">Notre première adresse, notre ville d'adoption</p>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gold-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 font-semibold text-sm tracking-widest uppercase mb-4">Chronologie</p>
            <h2 className="font-heading text-4xl text-green-950">Notre parcours</h2>
          </div>

          <div className="relative">
            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-green-200" />
            <div className="space-y-8">
              {timeline.map(({ year, title, desc }) => (
                <div key={year} className="relative flex gap-6 items-start">
                  <div className="relative z-10 flex-shrink-0 w-14 h-14 bg-green-950 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-gold-500 font-bold text-xs text-center leading-tight">{year}</span>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-green-900 text-base mb-1">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== VALEURS ===== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 font-semibold text-sm tracking-widest uppercase mb-4">Ce qui nous définit</p>
            <h2 className="font-heading text-4xl md:text-5xl text-green-950">Nos valeurs</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map(({ icon, title, desc }) => (
              <div key={title} className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-green-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:bg-green-100 transition-colors">
                  {icon}
                </div>
                <h3 className="font-semibold text-green-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PHOTOS ===== */}
      <section className="py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-4 rounded-3xl overflow-hidden h-64 md:h-80">
            <div className="overflow-hidden">
              <img src={PHOTOS.city1} alt="Limoges" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="overflow-hidden">
              <img src={PHOTOS.city2} alt="Limoges" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== BUREAU ===== */}
      <section className="bg-green-950 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <Logo />
            </div>
            <h2 className="font-heading text-4xl text-white mb-4">Le Bureau AEGL</h2>
            <p className="text-green-300/70 max-w-md mx-auto text-sm">
              Notre bureau exécutif est composé de 5 membres élus par la communauté étudiante guinéenne de Limoges.
            </p>
          </div>

          {/* Présidente en avant */}
          <div className="flex justify-center mb-8">
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-gold-500/10 to-gold-500/5 border border-gold-500/30 hover:border-gold-500/60 transition-all duration-300 max-w-xs w-full">
              <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-yellow-600 rounded-2xl flex items-center justify-center text-green-950 font-bold text-2xl mx-auto mb-4 shadow-gold">
                HF
              </div>
              <p className="text-2xl mb-2">👑</p>
              <p className="text-gold-500 font-heading text-xl font-semibold mb-1">Hadja Fatoumata Dramé</p>
              <p className="text-green-300/60 text-sm">Présidente</p>
              <p className="text-green-400/50 text-xs mt-2 leading-relaxed">Dirige l'association et représente l'AEGL auprès des institutions</p>
            </div>
          </div>

          {/* Autres membres */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bureau.slice(1).map(({ nom, titre, icon, initiales, desc, gradient }) => (
              <div key={nom} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300">
                <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white font-bold text-sm mx-auto mb-3 shadow-lg`}>
                  {initiales}
                </div>
                <p className="text-xl mb-2">{icon}</p>
                <p className="text-white font-semibold text-sm mb-1 leading-tight">{nom}</p>
                <p className="text-green-400/60 text-xs mb-2">{titre}</p>
                <p className="text-green-400/40 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-green-400/40 text-xs mt-10">
            Pour contacter le bureau : contact@aegl87.fr
          </p>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl text-green-950 mb-6">
            Rejoignez la communauté AEGL
          </h2>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            Que vous soyez étudiant guinéen en quête d'accompagnement ou un habitant de Limoges souhaitant aider, votre place est parmi nous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/inscription" className="btn-primary text-base px-8 py-4">
              Rejoindre l'AEGL →
            </Link>
            <Link to="/contact" className="btn-secondary text-base px-8 py-4">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
