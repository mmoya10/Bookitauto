// src/api/client.js
import axios from 'axios';
import { ENDPOINTS } from './endpoints';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
});

// --- MOCK SIMPLE (elimínalo cuando tengas backend real) ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const mockDB = {
  session: {
    token: 'demo-token',
    user: { name: 'Marc', businessName: 'Mi Pelu', role: 'admin' }
  },
  motivation: { text: 'Cada corte, una sonrisa ✂️' },
  stats: [
    { key: 'hoy', label: 'Citas hoy', value: 7 },
    { key: 'mes', label: 'Citas mes', value: 123 },
    { key: 'clientes', label: 'Clientes', value: 456 },
    { key: 'ingresos', label: 'Ingresos (€)', value: 3420 },
  ],
};

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Mocks básicos: GET/POST
const realGet = api.get.bind(api);
const realPost = api.post.bind(api);

api.get = async (url, config) => {
  await sleep(150);
  if (url === ENDPOINTS.auth.me) {
    const raw = localStorage.getItem('session');
    if (!raw) throw new Error('No session');
    return { data: JSON.parse(raw) };
  }
  if (url === ENDPOINTS.business.motivation) return { data: mockDB.motivation };
  if (url === ENDPOINTS.business.stats) return { data: mockDB.stats };
  // por defecto
  return { data: [] };
};

api.post = async (url, body, config) => {
  await sleep(150);
  if (url === ENDPOINTS.auth.login) {
    const session = {
      token: mockDB.session.token,
      nombreUsuario: mockDB.session.user.name,
      negocio: mockDB.session.user.businessName,
      rol: mockDB.session.user.role,
    };
    return {
      data: {
        token: session.token,
        user: { name: session.nombreUsuario, businessName: session.negocio, role: session.rol }
      }
    };
  }
  return { data: { ok: true } };
};

export default api;
