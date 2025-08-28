// src/api/business.js
// Mock en memoria con datos de prueba y "latencia" artificial

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
export const BUSINESS_TYPES = [
  { value: "peluqueria", label: "Peluquería" },
  { value: "fisioterapia", label: "Fisioterapia" },
  { value: "estetica", label: "Estética" },
  { value: "barberia", label: "Barbería" },
  { value: "spa", label: "Spa" },
];

export const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
];

export const CURRENCIES = [
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
  { value: "GBP", label: "GBP (£)" },
];

export const TIMEZONES = [
  "Europe/Madrid",
  "UTC",
  "Europe/Lisbon",
  "Europe/Paris",
  "America/Bogota",
  "America/Mexico_City",
  "America/Argentina/Buenos_Aires",
];

const rid = () => Math.random().toString(36).slice(2, 10);

let memBusiness = {
  id: "biz_1",
  logoUrl: "https://placehold.co/64x64?text=LOGO",
  nombre: "Peluquería Glam",
  razonSocial: "Peluquería Glam SL",
  cif: "B12345678",
  email: "info@glam.com",
  telefono: "+34 600 123 123",

  // ✅ NUEVOS CAMPOS
  web: "https://glam.com",
  tipo: "peluqueria",     // value de BUSINESS_TYPES
  idioma: "es",           // value de LANGUAGES
  currency: "EUR",        // value de CURRENCIES
  timezone: "Europe/Madrid",

  branchMode: true,
};

// ====== (1) Estado inicial: añade un campo schedule al negocio ======
memBusiness = {
  ...memBusiness,
  schedule: {
    mon: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    tue: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    wed: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    thu: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    fri: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    sat: { off: true,  slots: [] },
    sun: { off: true,  slots: [] },
    specialDays: [
      // { date: '2025-12-24', off: false, slots: [{ start:"09:00", end:"13:00" }] },
      // { date: '2025-12-25', off: true,  slots: [] },
    ],
  },
};
// ====== (2) Endpoints de horario de negocio ======
export async function fetchBusinessSchedule() {
  await delay();
  // devuelve {} si aún no hay nada para que el componente normalice
  return structuredClone(memBusiness.schedule || {});
}

export async function updateBusinessSchedule(payload) {
  await delay(250);
  // guardamos tal cual lo que envía el componente
  memBusiness.schedule = structuredClone(payload || {});
  return { ok: true, schedule: structuredClone(memBusiness.schedule) };
}

let memBranches = [
  {
    id: "branch_1",
    nombre: "Sucursal Centro",
    direccion: "Calle Mayor 123",
    cp: "28001",
    ciudad: "Madrid",
    email: "centro@glam.com",
    telefono: "+34 611 222 333",
  },
  {
    id: "branch_2",
    nombre: "Sucursal Norte",
    direccion: "Av. Libertad 45",
    cp: "28050",
    ciudad: "Madrid",
    email: "norte@glam.com",
    telefono: "+34 644 555 666",
  },
];

// ====== API NEGOCIO ======
export async function fetchBusiness() {
  await delay();
  return structuredClone(memBusiness);
}

export async function updateBusiness(payload) {
  await delay(200);

  // Merge profundo para notifications
  if (payload && typeof payload === "object" && "notifications" in payload) {
    const cur = memBusiness.notifications ?? {};
    const inc = payload.notifications || {};

    const next = {
      ...cur,
      channels: { ...(cur.channels || {}), ...(inc.channels || {}) },
      events: { ...(cur.events || {}), ...(inc.events || {}) },
      // si envías reminders, reemplazamos la lista completa (ya validada en UI)
      reminders: Array.isArray(inc.reminders) ? inc.reminders : (cur.reminders || []),
      review: { ...(cur.review || {}), ...(inc.review || {}) },
    };

    memBusiness = { ...memBusiness, ...payload, notifications: next };
  } else {
    memBusiness = { ...memBusiness, ...payload };
  } 

  return structuredClone(memBusiness);
}

// ====== API SUCURSALES ======
export async function fetchBranches() {
  await delay();
  return structuredClone(memBranches);
}

export async function createBranch(payload) {
  await delay(250);
  const item = { id: rid(), ...payload };
  memBranches.push(item);
  return structuredClone(item);
}

export async function updateBranch({ id, ...payload }) {
  await delay(250);
  const idx = memBranches.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Sucursal no encontrada");
  memBranches[idx] = { ...memBranches[idx], ...payload };
  return structuredClone(memBranches[idx]);
}

export async function deleteBranch(id) {
  await delay(200);
  const before = memBranches.length;
  memBranches = memBranches.filter((b) => b.id !== id);
  if (memBranches.length === before) throw new Error("Sucursal no encontrada");
  return { ok: true };
}
