import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { inject } from '@vercel/analytics'

inject()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Si un token d'impersonation est passé dans l'URL (?_t=...), on le stocke
// dans sessionStorage (propre à cet onglet) sans toucher à la session admin
const _params = new URLSearchParams(window.location.search);
const _impToken = _params.get('_t');
if (_impToken) {
  sessionStorage.setItem('aegl_token', _impToken);
  _params.delete('_t');
  const _newUrl = window.location.pathname + (_params.toString() ? '?' + _params.toString() : '');
  window.history.replaceState({}, '', _newUrl);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
