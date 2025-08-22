import { createContext, useContext, useEffect, useState } from 'react';

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {nombreUsuario, negocio, rol, token}

  useEffect(() => {
    const raw = localStorage.getItem('session');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const login = async (email, password) => {
    // Mock duro: solo admin@gmail.com / admin
    if (email !== 'admin@gmail.com' || password !== 'admin') {
      const err = new Error('Credenciales incorrectas');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const session = {
      token: 'demo-token',
      nombreUsuario: 'Admin',
      negocio: 'Mi Pelu',
      rol: 'admin',
    };
    localStorage.setItem('token', session.token);
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
