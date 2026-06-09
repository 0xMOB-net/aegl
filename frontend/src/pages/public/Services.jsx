import { Link } from 'react-router-dom';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';

const PHOTOS = {
  hero:  'https://images.unsplash.com/photo-1706873556600-7bdf44c2caff?w=1920&q=80',
  gare:  'https://images.unsplash.com/photo-1665249814952-9d7172c1155c?w=1200&q=80',
  city1: 'https://images.unsplash.com/photo-1681633228423-e55b609905fb?w=900&q=80',
};

const services = [
  {
    icon: '📄',
    color: 'from-red-500 to-red-700',
    bg: 'bg-red-50 border-red-100',
    tag: 'bg-red-100 text-red-700',
    title: 'Attestation d\'hébergement',
    tagLabel: 'Service phare',
    desc: 'Obtenez votre attestation officielle d\'hébergement — indispensable pour votre compte bancaire, la CAF, votre titre de séjour et bien plus encore.',
    features: ['Dossier 100% en ligne', 'Hébergeur bénévole', 'PDF officiel', 'Délai 3–10 jours'],
  },
  {
    icon: '🗺️',
    color: 'from-gold-500 to-yellow-600',
    bg: 'bg-amber-50 border-amber-100',
    tag: 'bg-amber-100 text-amber-700',
    title: 'Guide d\'intégration',
    tagLabel: 'Guide pratique',
    desc: 'Tout ce que vous devez savoir pour vous installer à Limoges : logement, transport, santé, banque, université — expliqué simplement.',
    features: ['Plan de la ville', 'Démarches admin', 'Bonnes adresses', 'Contacts utiles'],
  },
  {
    icon: '🎓',
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50 border-blue-100',
    tag: 'bg-blue-100 text-blue-700',
    title: 'Soutien académique',
    tagLabel: 'Académique',
    desc: 'Des étudiants plus avancés vous accompagnent dans votre parcours : révisions, conseils de méthode, orientation, stages.',
    features: ['Tutorat entre pairs', 'Conseils d\'orientation', 'Réseau Alumni', 'Stages & emplois'],
  },
  {
    icon: '🎭',
    color: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50 border-purple-100',
    tag: 'bg-purple-100 text-purple-700',
    title: 'Vie culturelle & events',
    tagLabel: 'Communauté',
    desc: 'Des événements réguliers pour célébrer la culture guinéenne : soirées, repas partagés, fêtes nationales, concerts, sports.',
    features: ['Soirées culturelles', 'Fêtes guinéennes', 'Tournois sportifs', 'Sorties en groupe'],
  },
  {
    icon: '🏠',
    color: 'from-green-500 to-green-700',
    bg: 'bg-green-50 border-green-100',
    tag: 'bg-green-100 text-green-700',
    title: 'Réseau d\'hébergeurs',
    tagLabel: 'Solidarité',
    desc: 'Notre réseau de plus de 40 hébergeurs bénévoles est là pour vous accueillir le temps que vous trouviez votre logement définitif.',
    features: ['40+ hébergeurs actifs', 'Entièrement gratuit', 'Acte de solidarité', 'Processus sécurisé'],
  },
  {
    icon: '📋',
    color: 'from-teal-500 to-teal-700',
    bg: 'bg-teal-50 border-teal-100',
    tag: 'bg-teal-100 text-teal-700',
    title: 'Accompagnement admin',
    tagLabel: 'Administratif',
    desc: 'Vous n\'êtes jamais seul face aux démarches en France. Visa, préfecture, CPAM, banque — nos membres vous guident pas à pas.',
    features: ['Aide visa & séjour', 'Ouverture compte', 'CPAM & CAF', 'Permanences bénévoles'],
  },
];

const steps = [
  { num: 1, icon: '📝', title: 'Créez votre compte', desc: 'Inscrivez-vous sur notre plateforme en quelques minutes et déposez votre avis d\'inscription universitaire.', color: 'bg-red-600 text-white' },
  { num: 2, icon: '🤝', title: 'Assignation d\'un hébergeur', desc: 'Le bureau AEGL vous met en relation avec un hébergeur bénévole de notre réseau de confiance.', color: 'bg-gold-500 text-green-900' },
  { num: 3, icon: '📁', title: 'Documents hébergeur', desc: 'L\'hébergeur dépose ses justificatifs : bail, contrat d\'énergie et pièce d\'identité.', color: 'bg-green-800 text-white' },
  { num: 4, icon: '✅', title: 'Vérification', desc: 'Le bureau AEGL vérifie et valide l\'ensemble des documents soumis avant clôture.', color: 'bg-blue-700 text-white' },
  { num: 5, icon: '🎉', title: 'Attestation prête !', desc: 'Votre attestation PDF officielle est générée et envoyée par email. Téléchargeable depuis votre espace.', color: 'bg-green-600 text-white' },
];

const faq = [
  { q: 'Qui peut bénéficier du service d\'attestation ?', a: 'Tout étudiant guinéen inscrit ou en cours d\'inscription à l\'Université de Limoges peut faire une demande. Le service est gratuit et réservé aux membres de l\'AEGL.' },
  { q: 'L\'hébergement est-il payant ?', a: 'Non, le service est entièrement bénévole et gratuit. Les hébergeurs agissent par solidarité communautaire, sans contrepartie financière.' },
  { q: 'Combien de temps prend la procédure ?', a: 'Le délai varie selon la disponibilité des hébergeurs, mais en général 3 à 10 jours ouvrés suffisent pour obtenir votre attestation finale.' },
  { q: 'Quels documents l\'hébergeur doit-il fournir ?', a: 'Trois documents obligatoires : (1) contrat de bail en cours, (2) justificatif de contrat d\'énergie (électricité ou gaz), et (3) copie recto-verso de sa pièce d\'identité.' },
  { q: 'L\'attestation est-elle reconnue par les administrations ?', a: 'Oui. Notre attestation est rédigée conformément aux exigences légales françaises et est généralement acceptée par les banques, la CAF et les services préfectoraux.' },
  { q: 'Comment devenir hébergeur partenaire ?', a: 'Inscrivez-vous sur la plateforme avec le rôle "hébergeur". Notre bureau vous contactera pour vérifier votre situation et vous intégrer au réseau. Merci pour votre générosité !' },
];

export default function Services() {
  return (
    <div className="bg-white">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[65vh] flex items-end overflow-hidden">
        <img src={PHOTOS.city1} alt="Limoges" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-950/55 to-green-900/10" />

        <div className="relative max-w-7xl mx-auto px-6 pb-20 pt-40 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
              <span className="text-white/90 text-xs font-medium tracking-widest uppercase">Ce que nous offrons</span>
            </div>
            <h1 className="font-heading text-5xl md:text-7xl text-white leading-tight mb-6">
              Nos <span className="text-gold-500">services</span>
            </h1>
            <p className="text-green-200 text-lg leading-relaxed max-w-xl">
              Bien plus que des attestations — l'AEGL est votre partenaire complet pour réussir votre vie étudiante à Limoges.
            </p>
          </div>
        </div>

        <div className="flag-stripe absolute bottom-0 left-0 right-0" />
      </section>

      {/* ===== SERVICES GRID ===== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 font-semibold text-sm tracking-widest uppercase mb-4">Notre offre complète</p>
            <h2 className="font-heading text-4xl md:text-5xl text-green-950">6 services pour votre réussite</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(({ icon, title, desc, features, bg, tag, tagLabel }) => (
              <div key={title} className={`group rounded-2xl border p-6 ${bg} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col`}>
                <div className="flex items-start justify-between mb-5">
                  <div className="text-4xl">{icon}</div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tag}`}>{tagLabel}</span>
                </div>
                <h3 className="font-heading text-xl text-green-950 mb-3">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 flex-1">{desc}</p>
                <ul className="space-y-1.5">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROCESSUS ATTESTATION ===== */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 font-semibold text-sm tracking-widest uppercase mb-4">Comment ça marche</p>
            <h2 className="font-heading text-4xl text-green-950">Obtenir votre attestation</h2>
            <p className="text-gray-500 mt-4 max-w-lg mx-auto text-sm">Un processus simple et sécurisé en 5 étapes, entièrement géré par notre équipe bénévole.</p>
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-5 items-start">
                <div className={`${step.color} w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-md`}>
                  {step.num}
                </div>
                <div className="flex-1 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl">{step.icon}</span>
                    <h3 className="font-semibold text-green-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PHOTO SECTION ===== */}
      <section className="relative h-80 overflow-hidden">
        <img src={PHOTOS.gare} alt="Gare de Limoges" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-green-950/70 flex items-center justify-center">
          <div className="text-center text-white px-6">
            <p className="text-gold-500 font-semibold text-sm tracking-widest uppercase mb-3">Limoges, votre nouvelle ville</p>
            <h2 className="font-heading text-4xl mb-4">Bienvenue à Limoges !</h2>
            <p className="text-green-200 text-sm max-w-md mx-auto">L'AEGL est là pour faire de votre arrivée une expérience positive et mémorable.</p>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 font-semibold text-sm tracking-widest uppercase mb-4">Vous avez des questions ?</p>
            <h2 className="font-heading text-4xl text-green-950">Questions fréquentes</h2>
          </div>

          <div className="space-y-3">
            {faq.map(({ q, a }) => (
              <details key={q} className="group bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-green-900 text-sm pr-4">{q}</span>
                  <svg className="w-5 h-5 text-green-700 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50">
                  <p className="pt-4">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-green-950 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-gold-500/30 transition-colors">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="font-heading text-2xl text-white mb-3">Je suis étudiant(e)</h3>
              <p className="text-green-300/70 text-sm leading-relaxed mb-6">
                Créez votre dossier d'attestation, accédez au guide d'intégration et rejoignez notre communauté.
              </p>
              <Link to="/inscription" className="btn-gold inline-flex">
                Créer mon compte étudiant →
              </Link>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-blue-400/30 transition-colors">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="font-heading text-2xl text-white mb-3">Je veux héberger</h3>
              <p className="text-green-300/70 text-sm leading-relaxed mb-6">
                Offrez une adresse à un étudiant guinéen. Un geste simple qui change tout — c'est 100% gratuit.
              </p>
              <Link to="/inscription?role=host" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-6 py-3 text-sm font-semibold transition-colors">
                Devenir hébergeur →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
