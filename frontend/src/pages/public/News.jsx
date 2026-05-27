import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import api from '../../api/client';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1706873556600-7bdf44c2caff?w=900&q=80';

const categories = ['Tous', 'Événements', 'Administration', 'Communauté', 'Académique', 'Culture'];

export function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Tous');

  useEffect(() => {
    const ctrl = new AbortController();
    api.get('/articles', { signal: ctrl.signal })
      .then(r => setArticles(r.data.articles || []))
      .catch(err => { if (err.name !== 'CanceledError') setError('Impossible de charger les articles'); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const featured = useMemo(() => articles[0] || null, [articles]);
  const rest = useMemo(() => articles.slice(1), [articles]);

  return (
    <div className="bg-white">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative bg-green-950 pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gold-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-56 h-56 bg-green-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs font-medium tracking-widest uppercase">Actualités</span>
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-white mb-6">
            La vie de <span className="text-gold-500">l'AEGL</span>
          </h1>
          <p className="text-green-300/80 text-lg max-w-xl mx-auto">
            Événements, annonces, portraits, conseils — toute l'actualité de votre association guinéenne à Limoges.
          </p>
        </div>

        <div className="flag-stripe absolute bottom-0 left-0 right-0" />
      </section>

      {/* ===== CONTENT ===== */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-2 border-green-800 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Chargement des articles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-32">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-6xl mb-6">📭</p>
            <h3 className="font-heading text-2xl text-green-900 mb-3">Aucun article publié</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Les actualités de l'AEGL seront publiées ici très bientôt. Revenez régulièrement !
            </p>
          </div>
        ) : (
          <>
            {/* FEATURED ARTICLE */}
            {featured && (
              <Link to={`/actualites/${featured.slug}`} className="group block mb-16">
                <div className="grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-green-950">
                  <div className="relative aspect-[16/10] lg:aspect-auto overflow-hidden">
                    <img
                      src={featured.coverImage || PLACEHOLDER}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      fetchpriority="high" decoding="async"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-gold-500 text-green-950 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                        À la une
                      </span>
                    </div>
                  </div>
                  <div className="p-10 flex flex-col justify-center">
                    <p className="text-green-400/70 text-xs mb-4 font-medium">
                      {new Date(featured.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {featured.author && ` · ${featured.author.firstName} ${featured.author.lastName}`}
                    </p>
                    <h2 className="font-heading text-3xl text-white leading-tight mb-4 group-hover:text-gold-400 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-green-300/60 text-sm leading-relaxed line-clamp-4 mb-8">
                      {featured.content.substring(0, 300)}...
                    </p>
                    <div className="inline-flex items-center gap-2 text-gold-500 text-sm font-semibold group-hover:gap-3 transition-all">
                      Lire l'article
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* FILTER BAR */}
            {rest.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-10">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-green-900 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* ARTICLES GRID */}
            {rest.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map(article => (
                  <Link
                    key={article.id}
                    to={`/actualites/${article.slug}`}
                    className="group flex flex-col rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img
                        src={article.coverImage || PLACEHOLDER}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy" decoding="async"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-green-700 text-xs font-medium mb-2">
                        {new Date(article.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <h3 className="font-heading text-lg text-gray-900 group-hover:text-green-800 transition-colors mb-2 line-clamp-2 flex-1">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-xs line-clamp-2 mb-4">
                        {article.content.substring(0, 120)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-green-700 text-xs font-semibold group-hover:text-green-800 transition-colors">
                          Lire la suite →
                        </span>
                        {article.author && (
                          <span className="text-xs text-gray-400">
                            {article.author.firstName} {article.author.lastName[0]}.
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ===== NEWSLETTER CTA ===== */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-4xl mb-4">📬</p>
          <h2 className="font-heading text-3xl text-green-950 mb-4">Restez informé(e)</h2>
          <p className="text-gray-500 text-sm mb-8">
            Créez votre compte AEGL pour recevoir toutes nos actualités, événements et annonces directement par email.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/inscription" className="btn-primary">Créer mon compte →</Link>
            <Link to="/contact" className="btn-secondary">Nous contacter</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default News;
