import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Not authenticated — go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but no org — must complete onboarding (unless already there)
  if (!user.organizationId && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Has org but trying to visit onboarding — redirect home
  if (user.organizationId && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  // Admin-only guard
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
