import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import RequestBlood from './pages/RequestBlood';
import HealthPassport from './pages/HealthPassport';
import Hospitals from './pages/Hospitals';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Emergency from './pages/Emergency';
import Settings from './pages/Settings';
import Community from './pages/Community';
import BloodCamps from './pages/BloodCamps';
import AccountCreated from './pages/AccountCreated';
import Assistant from './components/Assistant';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { db } from './services/firebase';
import { markNotificationRead } from './services/bloodMatching';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Still checking auth state — show a small centred spinner
  if (user === undefined) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #fee2e2', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/" />;
}

const FULLSCREEN_PATHS = ['/login', '/register', '/emergency', '/account-created'];

function NotificationBridge() {
  const { user } = useAuth();
  const seenNotificationIds = useRef(new Set<string>());

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'notifications'), where('recipientUserId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach(notificationDoc => {
        const notification = notificationDoc.data();
        if (notification.status !== 'unread') return;
        if (seenNotificationIds.current.has(notificationDoc.id)) return;

        seenNotificationIds.current.add(notificationDoc.id);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`BloodBee Match: ${notification.bloodGroup} needed`, {
            body: `${notification.patientName} needs blood near ${notification.location}.`,
            icon: '/Bloodbeelogo.png',
          });
        }

        markNotificationRead(notificationDoc.id).catch((err) => {
          console.error('Failed to mark notification as read', err);
        });
      });
    });

    return unsubscribe;
  }, [user]);

  return null;
}

function AppLayout() {
  const location = useLocation();
  const isFullscreen = FULLSCREEN_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans flex flex-col transition-colors duration-300">
      <NotificationBridge />
      {!isFullscreen && <Header />}
      <main className={isFullscreen ? 'flex-1' : 'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account-created" element={<AccountCreated />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/request" element={<PrivateRoute><RequestBlood /></PrivateRoute>} />
          <Route path="/passport" element={<PrivateRoute><HealthPassport /></PrivateRoute>} />
          <Route path="/hospitals" element={<PrivateRoute><Hospitals /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
          <Route path="/camps" element={<PrivateRoute><BloodCamps /></PrivateRoute>} />
        </Routes>
      </main>
      <Assistant />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
