import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import api from '../../api/client';

const PHOTOS = {
  hero:  'https://images.unsplash.com/photo-1706873556600-7bdf44c2caff?w=1920&q=80',
  gare:  'https://images.unsplash.com/photo-1665249814952-9d7172c1155c?w=1200&q=80',
  city1: 'https://images.unsplash.com/photo-1681633228423-e55b609905fb?w=900&q=80',
  city2: 'https://images.unsplash.com/photo-1681633227946-d6fc7b631f8f?w=900&q=80',
  city3: 'https://images.unsplash.com/photo-1599141636679-fb8564a12af9?w=900&q=80',
  city4: 'https://images.unsplash.com/photo-1566923176178-382eb1b43376?w=900&q=80',
};

const STATS = [
  { value: '150+', label: 'Étudiants accompagnés' },
  { value: '5+',   label: "Années d'expérience" },
  { value: '10+',  label: 'Hébergeurs partenaires' },
  { value: '2026', label: 'Ère de la digitalisation' },
];

const LIMOGES_PLACES = [
  {
    emoji: '🚉',
    name: 'Gare de Limoges-Bénédictins',
    category: 'Transport',
    desc: 'Chef-d\'œuvre Art Déco, construite en 1929. Liaisons Paris (2h30 en TGV), Bordeaux, Lyon.',
    photo: 'https://images.unsplash.com/photo-1665249814952-9d7172c1155c?w=600&q=80',
    tag: 'bg-blue-100 text-blue-700',
    tip: 'TGV direct Paris-Limoges',
  },
  {
    emoji: '🎓',
    name: 'Université de Limoges',
    category: 'Études',
    desc: 'Fondée en 1968, l\'Université de Limoges accueille 15 000 étudiants sur plusieurs campus.',
    photo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80',
    tag: 'bg-green-100 text-green-700',
    tip: '15 000 étudiants',
  },
  {
    emoji: '📚',
    name: 'BFM — Bibliothèque Francophone',
    category: 'Culture',
    desc: 'L\'une des plus grandes bibliothèques de France. Accès gratuit pour les étudiants de l\'Unilim.',
    photo: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80',
    tag: 'bg-purple-100 text-purple-700',
    tip: 'Accès gratuit étudiant',
  },
  {
    emoji: '🚌',
    name: 'TCRM — Transports en Commun',
    category: 'Transport',
    desc: 'Réseau de bus couvrant toute l\'agglomération. Tarif étudiant réduit. App TCL disponible.',
    photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    tag: 'bg-yellow-100 text-yellow-700',
    tip: 'Abonnement étudiant ~15€/mois',
  },
  {
    emoji: '🏠',
    name: 'CROUS Limoges',
    category: 'Logement',
    desc: 'Résidences universitaires et restaurants du CROUS sur tous les campus. Dossier en ligne sur Messervices.etudiant.gouv.fr',
    photo: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
    tag: 'bg-orange-100 text-orange-700',
    tip: 'Loyer ~200-350€/mois',
  },
  {
    emoji: '🌳',
    name: 'Jardin de l\'Évêché',
    category: 'Loisirs',
    desc: 'Parc botanique au cœur de Limoges, classé "Jardin remarquable". Idéal pour se détendre entre cours.',
    photo: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=80',
    tag: 'bg-emerald-100 text-emerald-700',
    tip: 'Entrée libre & gratuite',
  },
  {
    emoji: '🏛️',
    name: 'Musée Adrien Dubouché',
    category: 'Culture',
    desc: 'Musée national de la porcelaine — collection unique au monde. Visite gratuite pour les étudiants.',
    photo: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80',
    tag: 'bg-red-100 text-red-700',
    tip: 'Gratuit -26 ans & étudiants',
  },
  {
    emoji: '🏥',
    name: 'CPAM — Sécurité Sociale',
    category: 'Santé',
    desc: 'Affiliez-vous dès votre arrivée pour bénéficier du remboursement de vos soins. Démarche en ligne possible.',
    photo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
    tag: 'bg-teal-100 text-teal-700',
    tip: 'Inscription ameli.fr',
  },
];

const ACTIVITES = [
  { icon: '🎉', title: 'Événements culturels', desc: 'Soirées guinéennes, fêtes nationales, gastronomie — célébrez votre culture loin de chez vous.' },
  { icon: '⚽', title: 'Sports & loisirs', desc: 'Tournois de foot, sorties nature, activités sportives — restez actif et soudé.' },
  { icon: '📚', title: 'Soutien académique', desc: 'Tutorat, conseils d\'orientation, partage de ressources entre étudiants.' },
  { icon: '🤲', title: 'Entraide & solidarité', desc: 'Accueil des nouveaux arrivants, collecte de solidarité, réseau d\'entre-aide.' },
  { icon: '🎓', title: 'Accompagnement admin', desc: 'Aide pour CAF, titre de séjour, sécurité sociale — on vous guide pas à pas.' },
  { icon: '🌐', title: 'Réseau professionnel', desc: 'Mise en relation avec des anciens, opportunités de stages et d\'emploi à Limoges.' },
];

const GUIDE_LIMOGES = [
  { emoji: '🚌', titre: 'Transport (TCRM)', texte: 'Bus à 0,50€ avec la carte étudiant. Navette gratuite Université ↔ Centre-ville.' },
  { emoji: '🏠', titre: 'Logement étudiant', texte: 'CROUS, résidences étudiantes privées, colocation — l\'AEGL vous aide à trouver.' },
  { emoji: '🏥', titre: 'Santé & CPAM', texte: 'Affiliation à la Sécurité Sociale en ligne. Médecin de campus gratuit sur RDV.' },
  { emoji: '🏦', titre: 'Ouvrir un compte', texte: 'Société Générale, BNP, La Banque Postale — l\'attestation AEGL est acceptée partout.' },
];

export default function Home() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    api.get('/articles').then(res => setArticles(res.data.articles?.slice(0, 3) || [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={PHOTOS.hero} alt="Limoges" className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }}/>
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/95 via-green-950/80 to-green-900/60"/>
        </div>
        <div className="absolute bottom-0 left-0 right-0 flag-stripe"/>

        <div className="relative max-w-7xl mx-auto px-6 py-36 grid lg:grid-cols-5 gap-12 items-center w-full">
          <div className="lg:col-span-3 animate-fade-in-up">
            <div className="inline-flex items-center gap-2.5 glass rounded-full px-5 py-2 text-sm font-medium text-white mb-8">
              <span>🇬🇳</span>
              <span>Association étudiante guinéenne • Limoges, France</span>
              <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse ml-1"/>
            </div>

            <h1 className="font-heading text-5xl lg:text-7xl text-white leading-[1.08] mb-6">
              Bienvenue à<br/>
              <span className="text-gradient-gold">Limoges</span>,<br/>
              <span className="text-4xl lg:text-5xl font-normal italic text-white/80">l'AEGL est là pour vous</span>
            </h1>

            <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-xl">
              Communauté, événements culturels, soutien académique, accompagnement administratif
              — l'AEGL est votre maison loin de chez vous à Limoges.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/inscription" className="btn-gold text-base px-8 py-4">
                Rejoindre l'AEGL →
              </Link>
              <Link to="/services" className="glass border border-white/25 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/15 transition-all inline-flex items-center gap-2 text-base">
                Nos services
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4 animate-fade-in">
            {STATS.map(s => (
              <div key={s.label} className="glass rounded-2xl p-5 border border-white/10 text-center hover:border-gold-500/30 transition-all">
                <div className="font-heading text-3xl font-bold text-gold-500 mb-1">{s.value}</div>
                <div className="text-white/70 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-0 overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[520px]">
          <div className="relative min-h-[360px] lg:min-h-full">
            <img src={PHOTOS.gare} alt="Gare de Limoges-Bénédictins"
              className="w-full h-full object-cover absolute inset-0"
              onError={e => { e.target.parentElement.classList.add('hero-bg'); e.target.style.display='none'; }}/>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"/>
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
              <p className="text-green-900 font-bold text-sm">🚉 Gare de Limoges-Bénédictins</p>
              <p className="text-gray-500 text-xs mt-0.5">Chef-d'œuvre Art Déco, construite en 1929</p>
            </div>
          </div>

          <div className="bg-green-950 flex items-center p-12 lg:p-16">
            <div>
              <div className="inline-flex items-center gap-2 bg-gold-500/15 text-gold-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                📍 Limoges, Nouvelle-Aquitaine
              </div>
              <h2 className="font-heading text-3xl lg:text-4xl text-white mb-5 leading-snug">
                Une ville qui vous accueille,<br/>
                une asso qui vous accompagne
              </h2>
              <p className="text-green-300/80 text-sm leading-relaxed mb-8">
                Limoges, capitale mondiale de la porcelaine, abrite une université reconnue et
                une communauté guinéenne dynamique. L'AEGL est votre maison loin de chez vous :
                nous vous aidons à vous installer, à vous intégrer, et à réussir.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: '50 000+', l: 'Habitants' },
                  { v: '15 000+', l: 'Étudiants' },
                  { v: '1968', l: 'Fondation Unilim' },
                  { v: '87', l: 'Haute-Vienne' },
                ].map(s => (
                  <div key={s.l} className="bg-green-800/40 rounded-xl p-3 text-center">
                    <div className="text-gold-500 font-bold text-lg">{s.v}</div>
                    <div className="text-green-300 text-xs">{s.l}</div>
                  </div>
                ))}
              </div>
              <Link to="/a-propos" className="btn-gold mt-8 text-sm py-2.5 px-6">
                Découvrir l'AEGL →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="section-divider"/>
            <h2 className="font-heading text-4xl lg:text-5xl text-green-900 mb-4">Bien plus que des attestations</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
              L'AEGL c'est une vraie communauté. Événements, sports, soutien scolaire,
              aide administrative — rejoignez-nous et vivez pleinement votre vie à Limoges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACTIVITES.map((a, i) => (
              <div key={a.title}
                className={`rounded-2xl p-7 card-hover cursor-default ${
                  i === 0 ? 'bg-green-900 text-white' :
                  i === 1 ? 'bg-gold-500 text-green-900' :
                  'bg-gray-50 border border-gray-100'
                }`}
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <div className="text-4xl mb-4">{a.icon}</div>
                <h3 className={`font-heading text-xl mb-3 ${i === 0 ? 'text-white' : i === 1 ? 'text-green-900' : 'text-green-900'}`}>
                  {a.title}
                </h3>
                <p className={`text-sm leading-relaxed ${i === 0 ? 'text-green-200' : i === 1 ? 'text-green-800' : 'text-gray-500'}`}>
                  {a.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services" className="btn-primary text-base px-8 py-4">
              Voir tous nos services →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-0 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 h-72">
          {[PHOTOS.city1, PHOTOS.city2, PHOTOS.city3, PHOTOS.city4].map((photo, i) => (
            <div key={i} className="relative overflow-hidden group">
              <img src={photo} alt={`Limoges ${i+1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={e => { e.target.parentElement.style.background = '#1a5c3a'; e.target.style.display='none'; }}/>
              <div className="absolute inset-0 bg-green-950/20 group-hover:bg-green-950/0 transition-colors"/>
            </div>
          ))}
        </div>
        <div className="bg-green-950 text-center py-4">
          <p className="text-green-300 text-sm">📸 Limoges, Haute-Vienne — Ville d'art et d'histoire</p>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-divider" style={{margin: '0 0 1.5rem 0'}}/>
              <h2 className="font-heading text-4xl text-green-900 mb-5">
                Vous arrivez à Limoges ?<br/>
                <span className="text-green-600">On vous guide</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Premier voyage en France ? L'AEGL a préparé un guide complet pour faciliter
                vos premières semaines. Transport, logement, santé, démarches admin —
                tout y est.
              </p>
              <div className="space-y-4">
                {GUIDE_LIMOGES.map(g => (
                  <div key={g.titre} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all">
                    <span className="text-3xl flex-shrink-0">{g.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{g.titre}</p>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{g.texte}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/services" className="btn-primary mt-8 w-fit">
                Guide complet d'arrivée →
              </Link>
            </div>

            <div className="relative">
              <div className="absolute -top-4 -right-4 w-full h-full bg-gold-500/10 rounded-3xl -z-10"/>
              <div className="bg-green-900 rounded-3xl p-8 text-white">
                <h3 className="font-heading text-2xl mb-6">Ce que l'AEGL peut faire pour vous</h3>
                {[
                  '✅ Attestation d\'hébergement officielle',
                  '✅ Accueil à l\'aéroport ou à la gare',
                  '✅ Aide pour ouvrir un compte bancaire',
                  '✅ Accompagnement CPAM et CAF',
                  '✅ Mise en relation avec des compatriotes',
                  '✅ Accès aux événements de la communauté',
                  '✅ Soutien académique et orientation',
                  '✅ Réseau professionnel et stages',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 py-2.5 border-b border-green-800/50 last:border-0">
                    <span className="text-sm text-green-100">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="section-divider"/>
            <h2 className="font-heading text-4xl text-green-900 mb-4">Obtenir votre attestation</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              4 étapes simples pour recevoir votre attestation d'hébergement officielle.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-px bg-gradient-to-r from-red-600 via-gold-500 to-green-700"/>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { n:'01', c:'bg-red-600', t:'Inscription', d:'Créez votre compte étudiant sur la plateforme.' },
                { n:'02', c:'bg-gold-500 text-green-900', t:'Hébergeur assigné', d:'Le Bureau AEGL vous met en relation.' },
                { n:'03', c:'bg-green-700', t:'Documents soumis', d:'L\'hébergeur dépose ses justificatifs.' },
                { n:'04', c:'bg-green-900', t:'Attestation PDF', d:'Téléchargez et recevez par email.' },
              ].map(step => (
                <div key={step.n} className="text-center relative z-10">
                  <div className={`${step.c} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                    <span className={`font-heading font-bold text-2xl ${step.c.includes('gold') ? 'text-green-900' : 'text-white'}`}>{step.n}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{step.t}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-14">
            <Link to="/inscription" className="btn-primary px-8 py-4">Commencer ma demande →</Link>
            <Link to="/services" className="btn-secondary px-8 py-4">En savoir plus</Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="section-divider"/>
            <h2 className="font-heading text-4xl lg:text-5xl text-green-900 mb-4">Découvrez Limoges</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
              Tous les lieux essentiels pour votre vie étudiante — campus, bibliothèques, transports,
              culture et services administratifs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {LIMOGES_PLACES.map((place) => (
              <div key={place.name} className="group rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="relative h-44 overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={place.photo}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-600"
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.background = '#1a5c3a';
                      e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-5xl">${place.emoji}</div>`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${place.tag}`}>
                    {place.category}
                  </span>
                  <span className="absolute bottom-3 left-3 text-2xl">{place.emoji}</span>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 group-hover:text-green-800 transition-colors">
                    {place.name}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed flex-1 mb-3">
                    {place.desc}
                  </p>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                    <span className="text-green-700 text-xs font-medium">{place.tip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services" className="btn-secondary text-sm px-6 py-3">
              Guide complet d'installation →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 hero-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%"><defs><pattern id="dotsH" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#dotsH)"/></svg>
        </div>
        <div className="absolute bottom-0 left-0 right-0 flag-stripe"/>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h2 className="font-heading text-4xl lg:text-5xl text-white mb-5">Rejoignez la communauté AEGL</h2>
          <p className="text-green-200 mb-12 max-w-xl mx-auto text-base">
            Étudiant ou hébergeur, il y a une place pour vous dans notre réseau de solidarité.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="glass rounded-3xl p-8 border border-white/15">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="font-heading text-xl text-white mb-3">Je suis étudiant(e)</h3>
              <p className="text-green-200/70 text-sm mb-6">Attestation, intégration, soutien — tout est gratuit.</p>
              <Link to="/inscription?role=student" className="btn-gold w-full justify-center">Commencer →</Link>
            </div>
            <div className="glass rounded-3xl p-8 border border-white/15">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="font-heading text-xl text-white mb-3">Je veux héberger</h3>
              <p className="text-green-200/70 text-sm mb-6">Aidez un étudiant guinéen à s'installer.</p>
              <Link to="/inscription?role=host" className="btn-white w-full justify-center">Devenir hébergeur →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="section-divider" style={{margin: '0 0 1rem 0'}}/>
              <h2 className="font-heading text-4xl text-green-900">Dernières actualités</h2>
              <p className="text-gray-400 text-sm mt-2">Restez informé de la vie de l'AEGL</p>
            </div>
            <Link to="/actualites" className="btn-secondary text-sm py-2.5 px-5">Voir tout →</Link>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl">
              <p className="text-5xl mb-4">✍️</p>
              <p className="text-gray-500 mb-4">Les premières actualités seront publiées bientôt</p>
              <Link to="/login" className="btn-primary text-sm">Publier un article →</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {articles.map((a, i) => (
                <Link key={a.id} to={`/actualites/${a.slug}`} className={`group block ${i === 0 ? 'md:col-span-1' : ''}`}>
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-gradient-to-br from-green-50 to-green-100">
                    {a.coverImage
                      ? <img src={a.coverImage} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      : <div className="w-full h-full flex items-center justify-center"><span className="text-5xl opacity-30">📰</span></div>
                    }
                  </div>
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                    {new Date(a.publishedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                  </span>
                  <h3 className="font-heading text-lg text-gray-900 group-hover:text-green-800 transition-colors mt-1 mb-2 line-clamp-2">{a.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{a.content?.substring(0, 120)}...</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
