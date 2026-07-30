import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MyComplaintsPage from './pages/MyComplaintsPage.jsx';
import NewComplaintPage from './pages/NewComplaintPage.jsx';
import ComplaintDetailPage from './pages/ComplaintDetailPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function AppLayout() {
  return (
    <div className="min-h-screen bg-paper dark:bg-[#0d1614]">
      <Navbar />
      <Outlet />
    </div>
  );
}

/** Socket needs an authenticated user, so it's mounted INSIDE the auth
 * provider tree, wrapping only the routes that require login. */
function AuthedProviders() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Outlet />;
  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<AuthedProviders />}>
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/complaints" element={<MyComplaintsPage />} />
              <Route path="/complaints/new" element={<NewComplaintPage />} />
              <Route path="/complaints/:id/edit" element={<NewComplaintPage />} />
              <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
