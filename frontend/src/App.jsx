import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';

// Pages publiques — chargées immédiatement (visibles sans connexion)
import Home from './pages/public/Home';

// Toutes les autres pages — chargées uniquement quand nécessaire
const About            = lazy(() => import('./pages/public/About'));
const Services         = lazy(() => import('./pages/public/Services'));
const News             = lazy(() => import('./pages/public/News'));
const NewsDetail       = lazy(() => import('./pages/public/NewsDetail'));
const Contact          = lazy(() => import('./pages/public/Contact'));
const Collectes        = lazy(() => import('./pages/public/Collectes'));

const Login            = lazy(() => import('./pages/auth/Login'));
const Register         = lazy(() => import('./pages/auth/Register'));
const ResetPassword    = lazy(() => import('./pages/auth/ResetPassword'));

const AdminDashboard   = lazy(() => import('./pages/admin/Dashboard'));
const AdminDossiers    = lazy(() => import('./pages/admin/Dossiers'));
const AdminDossierDetail = lazy(() => import('./pages/admin/DossierDetail'));
const AdminArticles    = lazy(() => import('./pages/admin/Articles'));
const AdminHosts       = lazy(() => import('./pages/admin/Hosts'));
const AdminActivity    = lazy(() => import('./pages/admin/Activity'));
const AdminAlerts      = lazy(() => import('./pages/admin/Alerts'));
const AdminCollectes   = lazy(() => import('./pages/admin/Collectes'));

const HostDossiers     = lazy(() => import('./pages/host/MyDossiers'));
const HostAttestations = lazy(() => import('./pages/host/Attestations'));
const HostAlerts       = lazy(() => import('./pages/host/Alerts'));
const HostProfile      = lazy(() => import('./pages/host/Profile'));

const StudentDossier   = lazy(() => import('./pages/student/MyDossier'));
const StudentAlerts    = lazy(() => import('./pages/student/Alerts'));

const MemberMessagerie    = lazy(() => import('./pages/members/Messagerie'));
const AdminMessagerie     = lazy(() => import('./pages/admin/Messagerie'));
const MemberLearning      = lazy(() => import('./pages/members/Learning'));
const AdminLearning       = lazy(() => import('./pages/admin/Learning'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-[3px] border-green-800 border-t-transparent rounded-full animate-spin" />
      <p className="text-green-800 font-medium text-sm">Chargement...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* SITE PUBLIC */}
            <Route path="/"               element={<Home />} />
            <Route path="/a-propos"       element={<About />} />
            <Route path="/services"       element={<Services />} />
            <Route path="/actualites"     element={<News />} />
            <Route path="/actualites/:slug" element={<NewsDetail />} />
            <Route path="/contact"        element={<Contact />} />
            <Route path="/collectes"      element={<Collectes />} />

            {/* AUTH */}
            <Route path="/login"                        element={<Login />} />
            <Route path="/inscription"                  element={<Register />} />
            <Route path="/reinitialiser-mot-de-passe"   element={<ResetPassword />} />

            {/* ESPACE MEMBRES */}
            <Route path="/membres" element={<ProtectedRoute><MembersIndex /></ProtectedRoute>} />

            {/* ADMIN */}
            <Route path="/membres/admin/dashboard"  element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/membres/admin/dossiers"   element={<ProtectedRoute roles={['admin']}><AdminDossiers /></ProtectedRoute>} />
            <Route path="/membres/admin/dossiers/:id" element={<ProtectedRoute roles={['admin']}><AdminDossierDetail /></ProtectedRoute>} />
            <Route path="/membres/admin/articles"   element={<ProtectedRoute roles={['admin']}><AdminArticles /></ProtectedRoute>} />
            <Route path="/membres/admin/hebergeurs" element={<ProtectedRoute roles={['admin']}><AdminHosts /></ProtectedRoute>} />
            <Route path="/membres/admin/activite"   element={<ProtectedRoute roles={['admin']}><AdminActivity /></ProtectedRoute>} />
            <Route path="/membres/admin/alertes"    element={<ProtectedRoute roles={['admin']}><AdminAlerts /></ProtectedRoute>} />
            <Route path="/membres/admin/collectes"  element={<ProtectedRoute roles={['admin']}><AdminCollectes /></ProtectedRoute>} />

            {/* HOST */}
            <Route path="/membres/hebergeur/dossiers"     element={<ProtectedRoute roles={['host']}><HostDossiers /></ProtectedRoute>} />
            <Route path="/membres/hebergeur/attestations" element={<ProtectedRoute roles={['host']}><HostAttestations /></ProtectedRoute>} />
            <Route path="/membres/hebergeur/alertes"      element={<ProtectedRoute roles={['host']}><HostAlerts /></ProtectedRoute>} />
            <Route path="/membres/hebergeur/profil"       element={<ProtectedRoute roles={['host']}><HostProfile /></ProtectedRoute>} />

            {/* STUDENT */}
            <Route path="/membres/etudiant/dossier" element={<ProtectedRoute roles={['student']}><StudentDossier /></ProtectedRoute>} />
            <Route path="/membres/etudiant/alertes" element={<ProtectedRoute roles={['student']}><StudentAlerts /></ProtectedRoute>} />

            {/* MESSAGERIE ADMIN */}
            <Route path="/membres/admin/messagerie" element={<ProtectedRoute roles={['admin']}><AdminMessagerie /></ProtectedRoute>} />

            {/* MESSAGERIE MEMBRES (student + host) */}
            <Route path="/membres/messagerie" element={<ProtectedRoute roles={['student', 'host']}><MemberMessagerie /></ProtectedRoute>} />

            {/* APPRENTISSAGE */}
            <Route path="/membres/apprentissage" element={<ProtectedRoute roles={['student', 'host']}><MemberLearning /></ProtectedRoute>} />
            <Route path="/membres/admin/apprentissage" element={<ProtectedRoute roles={['admin']}><AdminLearning /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
