import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Sidebar from './components/Sidebar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ComplaintsPage from './pages/ComplaintsPage.jsx';
import ComplaintDetailPage from './pages/ComplaintDetailPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import DepartmentsPage from './pages/DepartmentsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function AuthedProviders() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Outlet />;
  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  );
}

function AppLayout() {
  return (
    <Sidebar>
      <Outlet />
    </Sidebar>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AuthedProviders />}>
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/complaints" element={<ComplaintsPage />} />
              <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/departments"
                element={
                  <ProtectedRoute requireSuperadmin>
                    <DepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requireSuperadmin>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
