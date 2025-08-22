import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {nombreUsuario, negocio, rol, token}

  useEffect(() => {
    const raw = localStorage.getItem('session');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post(ENDPOINTS.auth.login, { email, password });
    const session = {
      token: data.token,
      nombreUsuario: data.user.name,
      negocio: data.user.businessName,
      rol: data.user.role,
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('session', JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
