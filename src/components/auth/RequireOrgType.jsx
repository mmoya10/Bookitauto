// src/components/auth/RequireOrgType.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function RequireOrgType({ mustBe, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (mustBe === 'empresa' && user?.tipo !== 'Staff_Empresa') return <Navigate to="/" replace />;
  if (mustBe === 'cliente' && user?.tipo !== 'Staff_Clientes') return <Navigate to="/" replace />;
  return children;
}
