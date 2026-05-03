import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import api from '../../api/client';

export default function NewsDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setLoading(true);
    api.get(`/articles/${slug}`)
      .then(r => {
        setArticle(r.data.article);
        return api.get('/articles');
      })
      .then(r => {
        const all = r.data.articles || [];
        setRelated(all.filter(a => a.slug !== slug).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-green-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement de l'article...</p>
        </div>
      </div>
    </div>
  );

  if (!article) return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center flex-col gap-6 px-6">
        <p className="text-6xl">🔍</p>
        <h2 className="font-heading text-2xl text-green-900">Article introuvable</h2>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          Cet article n'existe pas ou a été supprimé. Consultez nos autres actualités.
        </p>
        <Link to="/actualites" className="btn-primary">← Retour aux actualités</Link>
      </div>
    </div>
  );

  const readTime = Math.max(1, Math.ceil(article.content.length / 1200));

  return (
    <div className="bg-white">
      <Navbar />

      {/* ===== COVER IMAGE ===== */}
      {article.coverImage && (
        <div className="relative h-[55vh] overflow-hidden">
          <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-green-950/30" />
        </div>
      )}

      {/* ===== ARTICLE ===== */}
      <article className={`max-w-3xl mx-auto px-6 ${article.coverImage ? 'pb-20' : 'pt-36 pb-20'}`}>

        {/* Back */}
        <Link to="/actualites" className="inline-flex items-center gap-2 text-green-700 text-sm font-medium hover:text-green-900 transition-colors mt-8 mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux actualités
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className="bg-gold-500/20 text-gold-600 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
            Actualité
          </span>
          <span className="text-gray-400 text-sm">
            {new Date(article.publishedAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400 text-sm">{readTime} min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="font-heading text-4xl md:text-5xl text-green-950 leading-tight mb-6">
          {article.title}
        </h1>

        {/* Author */}
        {article.author && (
          <div className="flex items-center gap-3 mb-10 pb-10 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {article.author.firstName?.[0]}{article.author.lastName?.[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">{article.author.firstName} {article.author.lastName}</p>
              <p className="text-xs text-gray-400">Bureau AEGL</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg prose-green max-w-none">
          {article.content.split('\n\n').map((para, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-6 text-base">
              {para}
            </p>
          ))}
        </div>

        {/* Share / Footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Partagez cet article</p>
            <div className="flex gap-2">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold hover:bg-blue-700 transition-colors"
              >f</a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`}
                target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-bold hover:bg-black transition-colors"
              >𝕏</a>
              <a
                href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(window.location.href)}`}
                className="w-9 h-9 rounded-xl bg-green-700 text-white flex items-center justify-center hover:bg-green-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </a>
            </div>
          </div>
          <Link to="/actualites" className="btn-secondary text-sm">
            ← Voir tous les articles
          </Link>
        </div>
      </article>

      {/* ===== RELATED ARTICLES ===== */}
      {related.length > 0 && (
        <section className="bg-gray-50 py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h3 className="font-heading text-2xl text-green-950 mb-8">Autres articles</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map(a => (
                <Link
                  key={a.id}
                  to={`/actualites/${a.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    {a.coverImage
                      ? <img src={a.coverImage} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">📰</div>
                    }
                  </div>
                  <div className="p-4">
                    <p className="text-green-700 text-xs mb-1">
                      {new Date(a.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-green-800 transition-colors">
                      {a.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
