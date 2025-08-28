// src/hooks/useAuth.js
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthCtx = createContext();

/**
 * Normalizamos tipos/roles:
 * - Empresa: tipo = "Staff_Empresa", roles = "Admin" | "Gestor"
 *   perms: Tickets, Cuentas, Personal (booleans)
 *
 * - Clientes: tipo = "Staff_Clientes", roles = "Admin General" | "Admin Sucursal" | "Personal"
 *   perms: Ver Caja, Gestionar Caja, Ver Productos, Gestionar Productos, Ver Stock, Gestionar stock,
 *          Ver Usuarios, Gestionar Usuarios, Ver Espacios, Gestionar Espacios, Ver todos los informes,
 *          Gestionar Horario, Gestionar Personal, Gestionar Negocio, Facturación
 *   scope (Admin Sucursal): allowedBranches: ["branchId..."] (o "all" para Admin General)
 */

const MOCK_USERS = [
  // EMPRESA: Admin (todo)
  {
    email: 'admin@empresa.com',
    password: 'admin',
    session: {
      token: 'token-empresa-admin',
      nombreUsuario: 'Admin Empresa',
      negocio: 'Bookitauto HQ',
      tipo: 'Staff_Empresa',
      rol: 'Admin', // Admin: todos los permisos
      empresaPerms: {
        Tickets: true,
        Cuentas: true,
        Personal: true,
      },
      clientePerms: null,
      scope: { allowedBranches: 'all' },
    },
  },
  // CLIENTE: Admin General (todo activado)
  {
    email: 'cliente@empresa.com',
    password: 'cliente',
    session: {
      token: 'token-cliente-admin-general',
      nombreUsuario: 'Cliente Admin General',
      negocio: 'Mi Pelu',
      tipo: 'Staff_Clientes',
      rol: 'Admin General',
      empresaPerms: null,
      clientePerms: {
        'Ver Caja': true, 'Gestionar Caja': true,
        'Ver Productos': false, 'Gestionar Productos': true,
        'Ver Stock': false, 'Gestionar stock': true,
        'Ver Usuarios': false, 'Gestionar Usuarios': true,
        'Ver Espacios': true, 'Gestionar Espacios': true,
        'Ver todos los informes': true,
        'Gestionar Horario': true,
        'Gestionar Personal': true,
        'Gestionar Negocio': true,
        'Facturación': true,
      },
      scope: { allowedBranches: 'all' }, // Admin General
    },
  },

  // Si quieres probar Gestor de Empresa con permisos parciales:
  // {
  //   email: 'gestor@empresa.com',
  //   password: 'gestor',
  //   session: {
  //     token: 'token-empresa-gestor',
  //     nombreUsuario: 'Gestor Empresa',
  //     negocio: 'Bookitauto HQ',
  //     tipo: 'Staff_Empresa',
  //     rol: 'Gestor',
  //     empresaPerms: { Tickets: true, Cuentas: true, Personal: false },
  //     clientePerms: null,
  //     scope: { allowedBranches: 'all' },
  //   },
  // },

  // Y un Admin Sucursal de cliente (solo sucursal X):
  // {
  //   email: 'sucursal@empresa.com',
  //   password: 'sucursal',
  //   session: {
  //     token: 'token-cliente-admin-sucursal',
  //     nombreUsuario: 'Admin Sucursal',
  //     negocio: 'Mi Pelu',
  //     tipo: 'Staff_Clientes',
  //     rol: 'Admin Sucursal',
  //     clientePerms: {
  //       'Ver Caja': true, 'Gestionar Caja': true,
  //       'Ver Productos': true, 'Gestionar Productos': true,
  //       'Ver Stock': true, 'Gestionar stock': true,
  //       'Ver Usuarios': true, 'Gestionar Usuarios': true,
  //       'Ver Espacios': true, 'Gestionar Espacios': true,
  //       'Ver todos los informes': true,
  //       'Gestionar Horario': true,
  //       'Gestionar Personal': true,
  //       'Gestionar Negocio': true,
  //       'Facturación': true,
  //     },
  //     empresaPerms: null,
  //     scope: { allowedBranches: ['branch_1'] }, // solo esta sucursal
  //   },
  // },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('session');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const login = async (email, password) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!found) {
      const err = new Error('Credenciales incorrectas');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }
    localStorage.setItem('token', found.session.token);
    localStorage.setItem('session', JSON.stringify(found.session));
    setUser(found.session);
    return found.session;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    setUser(null);
  };

  // Helpers
  const isEmpresa = user?.tipo === 'Staff_Empresa';
  const isCliente = user?.tipo === 'Staff_Clientes';

  // hasEmpresaPerm('Tickets' | 'Cuentas' | 'Personal')
  const hasEmpresaPerm = (permKey) => {
    if (!isEmpresa) return false;
    if (user?.rol === 'Admin') return true; // Admin empresa = todo
    return !!user?.empresaPerms?.[permKey];
  };

  /**
   * hasClientePerm(permKey, { branchId })
   * - Admin General: true siempre
   * - Admin Sucursal: true SOLO si branchId ∈ allowedBranches
   * - Personal: según flags de clientePerms (y si hay branchId, opcionalmente limitar)
   */
  const hasClientePerm = (permKey, opts = {}) => {
    if (!isCliente) return false;
    const role = user?.rol;
    const allowed = user?.scope?.allowedBranches ?? 'all';
    const branchId = opts.branchId;

    // Admin General
    if (role === 'Admin General') return true;

    // Admin Sucursal: requiere branchId dentro de alcance
    if (role === 'Admin Sucursal') {
      if (allowed === 'all') return true;
      if (branchId && Array.isArray(allowed)) {
        if (!allowed.includes(branchId)) return false;
      }
      // si no pasa la rama, false
      if (Array.isArray(allowed) && branchId && !allowed.includes(branchId)) return false;
      return true; // permisos funcionales todos ON por definición de este rol
    }

    // Personal: mira flags
    return !!user?.clientePerms?.[permKey];
  };

  // API unificada
  const hasFeature = (featureKey, opts = {}) => {
    // Map de features UI -> permisos declarativos
    // Empresa
    const empresaMap = {
      '/panel': 'Tickets',             // ejemplo: panel apoya tickets (ajústalo a tu gusto)
      '/cuentas': 'Cuentas',
      '/estadisticas': 'Personal',     // o crea otro mapeo si tu panel de estadísticas no depende de "Personal"
      'Tickets': 'Tickets',
      'Cuentas': 'Cuentas',
      'Personal': 'Personal',
    };

    // Cliente
    const clienteMap = {
      '/calendarios': 'Ver Citas',       // ej: calendario = recursos/espacios
      '/caja': 'Ver Caja',
      '/productos': 'Ver Productos',
      '/stock': 'Ver Stock',
      '/usuarios': 'Ver Usuarios',
      '/espacios': 'Ver Espacios',
      '/informes': 'Ver todos los informes',
      '/perfil': 'Gestionar Personal',      // ajusta si solo lectura
      '/negocio': 'Gestionar Negocio',
      '/personal': 'Gestionar Personal',
      '/schedule': 'Gestionar Horario',
      '/facturacion': 'Facturación',
      // acciones de gestión:
      'Gestionar Caja': 'Gestionar Caja',
      'Gestionar Productos': 'Gestionar Productos',
      'Gestionar stock': 'Gestionar stock',
      'Gestionar Usuarios': 'Gestionar Usuarios',
      'Gestionar Espacios': 'Gestionar Espacios',
      'Ver todos los informes': 'Ver todos los informes',
    };
 
    if (isEmpresa) {
      const perm = empresaMap[featureKey] ?? featureKey;
      return hasEmpresaPerm(perm);
    }
    if (isCliente) {
      const perm = clienteMap[featureKey] ?? featureKey;
      return hasClientePerm(perm, opts);
    }
    return false;
  };

  const value = useMemo(
    () => ({ user, login, logout, isEmpresa, isCliente, hasEmpresaPerm, hasClientePerm, hasFeature }),
    [user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
