import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import FixedBackground from './components/background/MoltenMetal';
import CustomCursor from './components/cursor/CustomCursor.jsx';
import LoaderCurtain from './components/ui/LoaderCurtain.jsx';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CursorProvider } from './context/CursorContext.jsx';
import { LenisProvider } from './context/LenisContext.jsx';
import './styles/tokens.css';

const Landing = lazy(() => import('./screens/Landing/Landing'));
const Login = lazy(() => import('./screens/Login/Login'));
const Register = lazy(() => import('./screens/Register/Register'));
const AdminDashboard = lazy(() => import('./screens/AdminDashboard/AdminDashboard'));
const UserDashboard = lazy(() => import('./screens/UserDashboard/UserDashboard'));

function ProtectedRoute({ children, allowedRoles }) {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(auth.role)) return <Navigate to="/login" replace />;

  return children;
}

function AppShell() {
  const [loaderStage, setLoaderStage] = useState('darkStart');
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // 1. Wait for progress bar (1.8s) + a 1s pause before opening curtain
    const openTimer = window.setTimeout(() => {
      setLoaderStage('darkOpen');
    }, 2800);

    // 2. Unmount from DOM after curtain slide animation completes (2800ms + 1250ms)
    const doneTimer = window.setTimeout(() => {
      setLoaderStage('done');
      setShowLoader(false);
    }, 4050);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Loading Screen */}
      {showLoader && <LoaderCurtain stage={loaderStage} title="REPOFORGE" />}

      <Suspense fallback={<div className="app-loading" aria-label="Loading" />}>
        <FixedBackground
          color1="#140600"
          color2="#B02501"
          color3="#FAB600"
          speed={0.25}
          scale={5}
          detail={4}
          glow={1.4}
          coreSize={0.08}
          swirl={0.8}
          fold={-0.18}
          blackPoint={0.08}
          brightness={1.1}
          colorMode="molten"
          grain={true}
          grainIntensity={0.04}
          mouseInteraction={true}
          mouseStrength={0.18}
          opacity={0.85}
        />
        <CustomCursor />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard/user" element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin', 'judge']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LenisProvider>
        <CursorProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </CursorProvider>
      </LenisProvider>
    </AuthProvider>
  );
}

