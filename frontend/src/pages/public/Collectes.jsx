import { useState, useEffect } from 'react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';
import api from '../../api/client';

export default function Collectes() {
  const [collectes, setCollectes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    api.get('/collectes', { signal: ctrl.signal })
      .then(r => setCollectes(r.data.collectes || []))
      .catch(err => { if (err.name !== 'CanceledError') setError('Impossible de charger les collectes'); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const widgetUrl = (url) => {
    const clean = url.replace(/\/$/, '');
    return clean.endsWith('/widget') ? clean : `${clean}/widget`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Modale widget HelloAsso */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading text-lg text-green-900 truncate pr-4">{modal.title}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none flex-shrink-0">×</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={widgetUrl(modal.helloassoUrl)}
                title={modal.title}
                className="w-full h-full"
                style={{ minHeight: '560px', border: 'none' }}
                allow="payment"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-green-950 text-white py-16 px-4 text-center">
        <p className="text-gold-400 text-sm font-semibold tracking-widest uppercase mb-3">Solidarité</p>
        <h1 className="font-heading text-4xl md:text-5xl mb-4">Nos collectes</h1>
        <p className="text-green-300 max-w-xl mx-auto text-lg">
          Soutenez les projets et événements de l'AEGL. Chaque contribution compte.
        </p>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-14">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : collectes.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🤝</p>
            <p className="text-lg font-medium text-gray-500">Aucune collecte en cours</p>
            <p className="text-sm mt-2">Revenez bientôt !</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collectes.map(c => (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                {/* En-tête colorée */}
                <div className="bg-gradient-to-br from-green-800 to-green-950 px-6 py-8 text-white">
                  <div className="text-3xl mb-3">🤝</div>
                  <h2 className="font-heading text-xl leading-snug">{c.title}</h2>
                  {c.goal && (
                    <p className="text-green-300 text-sm mt-2 font-medium">Objectif : {c.goal.toLocaleString('fr-FR')} €</p>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">{c.description}</p>
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => setModal(c)}
                      className="w-full bg-green-800 hover:bg-green-900 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <span>💚</span>
                      <span>Contribuer</span>
                    </button>
                    <a
                      href={c.helloassoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center text-xs text-gray-400 hover:text-green-700 transition-colors block"
                    >
                      Ouvrir sur HelloAsso →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
