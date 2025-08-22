import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) {
    // Guarda a dónde iba para volver después del login
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return children;
}
