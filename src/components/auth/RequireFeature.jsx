// src/components/auth/RequireFeature.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function RequireFeature({ feature, branchId, children }) {
  const { user, hasFeature } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (feature && !hasFeature(feature, { branchId })) return <Navigate to="/" replace />;
  return children;
}
