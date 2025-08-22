// src/api/business.js
// Mock en memoria con datos de prueba y "latencia" artificial

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const rid = () => Math.random().toString(36).slice(2, 10);

let memBusiness = {
  id: "biz_1",
  logoUrl: "https://placehold.co/64x64?text=LOGO",
  nombre: "Peluquería Glam",
  razonSocial: "Peluquería Glam SL",
  cif: "B12345678",
  email: "info@glam.com",
  telefono: "+34 600 123 123",
  branchMode: true,
  notifications: {
    channels: { email: true, sms: false, whatsapp: false },
    events: { confirmation: true, cancellation: true, rescheduled: true },
    // horas ANTES de la cita (positivas) -> 24h = 1 día, 3h = 3 horas
    reminders: [
      { id: rid(), hoursBefore: 24 },
      { id: rid(), hoursBefore: 3 },
    ],
    // horas DESPUÉS de la cita para pedir reseña
    review: { hoursAfter: 4, followup: true }, // followup = 2º correo si no hay reseña
  },
};

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
