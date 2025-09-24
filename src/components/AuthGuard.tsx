import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAuth = true, requireAdmin = false }: AuthGuardProps) {
  const { user, session, profile, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || roleLoading) return;

    const currentPath = location.pathname;
    
    // If requires auth but no user, redirect to login
    if (requireAuth && !user) {
      navigate('/login', { replace: true });
      return;
    }

    // If user logged in but on auth pages, redirect to home
    if (user && ['/login', '/cadastro', '/recuperar', '/'].includes(currentPath)) {
      console.log('Usuário logado tentando acessar página de auth:', currentPath, 'Redirecionando para /home');
      navigate('/home', { replace: true });
      return;
    }

    // If requires admin but user is not admin
    if (requireAdmin && user && !isAdmin) {
      navigate('/home', { replace: true });
      return;
    }
  }, [user, session, loading, roleLoading, isAdmin, navigate, location.pathname, requireAuth, requireAdmin]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}