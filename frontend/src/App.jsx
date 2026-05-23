import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { Analytics } from '@vercel/analytics/react';

import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import News from './pages/public/News';
import NewsDetail from './pages/public/NewsDetail';
import Contact from './pages/public/Contact';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';

import AdminDashboard from './pages/admin/Dashboard';
import AdminDossiers from './pages/admin/Dossiers';
import AdminCollectes from './pages/admin/Collectes';
import Collectes from './pages/public/Collectes';
import AdminDossierDetail from './pages/admin/DossierDetail';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminArticles from './pages/admin/Articles';
import AdminHosts from './pages/admin/Hosts';
import AdminActivity from './pages/admin/Activity';
import AdminAlerts from './pages/admin/Alerts';

import HostDossiers from './pages/host/MyDossiers';
import HostAttestations from './pages/host/Attestations';
import HostAlerts from './pages/host/Alerts';
import HostProfile from './pages/host/Profile';

import StudentDossier from './pages/student/MyDossier';
import StudentAlerts from './pages/student/Alerts';

import MemberAnnouncements from './pages/members/Announcements';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-green-800 border-t-transparent rounded-full animate-spin" />
        <p className="text-green-800 font-medium">Chargement...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/membres" replace />;
  return children;
};

const MembersIndex = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/membres/admin/dashboard" />;
  if (user.role === 'host') return <Navigate to="/membres/hebergeur/dossiers" />;
  return <Navigate to="/membres/etudiant/dossier" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Analytics />
        <Routes>
          {/* SITE PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/actualites" element={<News />} />
          <Route path="/actualites/:slug" element={<NewsDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/collectes" element={<Collectes />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />

          {/* ESPACE MEMBRES - INDEX */}
          <Route path="/membres" element={<ProtectedRoute><MembersIndex /></ProtectedRoute>} />

          {/* ADMIN */}
          <Route path="/membres/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/membres/admin/dossiers" element={<ProtectedRoute roles={['admin']}><AdminDossiers /></ProtectedRoute>} />
          <Route path="/membres/admin/dossiers/:id" element={<ProtectedRoute roles={['admin']}><AdminDossierDetail /></ProtectedRoute>} />
          <Route path="/membres/admin/annonces" element={<ProtectedRoute roles={['admin']}><AdminAnnouncements /></ProtectedRoute>} />
          <Route path="/membres/admin/articles" element={<ProtectedRoute roles={['admin']}><AdminArticles /></ProtectedRoute>} />
          <Route path="/membres/admin/hebergeurs" element={<ProtectedRoute roles={['admin']}><AdminHosts /></ProtectedRoute>} />
          <Route path="/membres/admin/activite" element={<ProtectedRoute roles={['admin']}><AdminActivity /></ProtectedRoute>} />
          <Route path="/membres/admin/alertes" element={<ProtectedRoute roles={['admin']}><AdminAlerts /></ProtectedRoute>} />
          <Route path="/membres/admin/collectes" element={<ProtectedRoute roles={['admin']}><AdminCollectes /></ProtectedRoute>} />

          {/* HOST */}
          <Route path="/membres/hebergeur/dossiers" element={<ProtectedRoute roles={['host']}><HostDossiers /></ProtectedRoute>} />
          <Route path="/membres/hebergeur/attestations" element={<ProtectedRoute roles={['host']}><HostAttestations /></ProtectedRoute>} />
          <Route path="/membres/hebergeur/alertes" element={<ProtectedRoute roles={['host']}><HostAlerts /></ProtectedRoute>} />
          <Route path="/membres/hebergeur/profil" element={<ProtectedRoute roles={['host']}><HostProfile /></ProtectedRoute>} />

          {/* STUDENT */}
          <Route path="/membres/etudiant/dossier" element={<ProtectedRoute roles={['student']}><StudentDossier /></ProtectedRoute>} />
          <Route path="/membres/etudiant/alertes" element={<ProtectedRoute roles={['student']}><StudentAlerts /></ProtectedRoute>} />

          {/* COMMUN */}
          <Route path="/membres/annonces" element={<ProtectedRoute><MemberAnnouncements /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
