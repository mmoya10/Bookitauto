// src/api/calendarManagement.js
// Mock en memoria + latencia artificial

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const rid = () => Math.random().toString(36).slice(2, 10);

let memCategories = [
  { id: "cat_cut", label: "Cortes" },
  { id: "cat_color", label: "Color" },
  { id: "cat_spa", label: "Spa" },
];

let memStaff = [
  { id: "stf_1", name: "Laura" },
  { id: "stf_2", name: "Carlos" },
  { id: "stf_3", name: "Julia" },
];

let memCalendars = [
  // PRINCIPALES
  {
    id: "cal_main_1",
    type: "main", // 'main' | 'extra'
    name: "Corte Premium",
    description: "Corte con asesoría",
    imageUrl: "https://placehold.co/640x360?text=Corte+Premium",
    categoryId: "cat_cut",
    price: 24.9,
    duration: 45, // minutos
    bufferBefore: 5,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_1", "cal_extra_2"],
    staffIds: ["stf_1", "stf_2"],
    status: "active", // 'active' | 'draft' | 'archived'
  },
  {
    id: "cal_main_2",
    type: "main",
    name: "Coloración Raíz",
    description: "Color en raíz",
    imageUrl: "https://placehold.co/640x360?text=Color+Raiz",
    categoryId: "cat_color",
    price: 39.9,
    duration: 60,
    bufferBefore: 0,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_3"],
    staffIds: ["stf_2", "stf_3"],
    status: "active",
  },
  // EXTRAS
  {
    id: "cal_extra_1",
    type: "extra",
    name: "Lavado",
    description: "Lavado básico",
    imageUrl: "https://placehold.co/640x360?text=Lavado",
    price: 4.5,        // opcional en extra
    duration: 10,      // opcional en extra
    staffIds: [],
    status: "active",
  },
  {
    id: "cal_extra_2",
    type: "extra",
    name: "Peinado Exprés",
    description: "Secado y peinado rápido",
    imageUrl: "https://placehold.co/640x360?text=Peinado+Express",
    price: 7.9,
    duration: 15,
    staffIds: [],
    status: "draft",
  },
  {
    id: "cal_extra_3",
    type: "extra",
    name: "Tratamiento Hidratante",
    description: "Mascarilla y masaje",
    imageUrl: "https://placehold.co/640x360?text=Hidratante",
    // sin precio/duración = opcionales
    staffIds: [],
    status: "active",
  },
];
let memBookingSites = [
  {
    id: "site_main",
    name: "Sitio Web Principal",
    categoryIds: ["cat_cut", "cat_color"],
    calendarIds: ["cal_main_1", "cal_main_2", "cal_extra_1", "cal_extra_3"],
  },
  {
    id: "site_spa",
    name: "Landing Spa",
    categoryIds: ["cat_spa"],
    calendarIds: [],
  },
];

let activeBookingSiteId = memBookingSites[0]?.id || null;


/* ================= API ================= */
export async function fetchCategories() {
  await delay();
  return structuredClone(memCategories);
}
export async function fetchStaff() {
  await delay();
  return structuredClone(memStaff);
}
export async function fetchBookingSites() {
  await delay();
  return memBookingSites.map((b) => ({ ...b, active: b.id === activeBookingSiteId }));
}
export async function setActiveBookingSite({ id }) {
  await delay();
  memBookingSites = memBookingSites.map((s) => ({ ...s, active: s.id === id }));
  return structuredClone(memBookingSites.find((s) => s.id === id));
}
export async function updateBookingSite({ id, categoryIds, calendarIds }) {
  await delay();
  const idx = memBookingSites.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Booking site no encontrado");
  memBookingSites[idx] = {
    ...memBookingSites[idx],
    categoryIds: Array.isArray(categoryIds) ? categoryIds : memBookingSites[idx].categoryIds,
    calendarIds: Array.isArray(calendarIds) ? calendarIds : memBookingSites[idx].calendarIds,
  };
  return structuredClone(memBookingSites[idx]);
}



export async function deleteBookingSite(id) {
  await delay();
  const idx = memBookingSites.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Booking site no encontrado");
  const removed = memBookingSites.splice(idx, 1)[0];

  // si el que eliminamos estaba activo, desactiva todos o activa el primero si existe
  if (removed?.active) {
    memBookingSites = memBookingSites.map((s, i) => ({ ...s, active: i === 0 }));
  }
  return { ok: true };
}


export async function fetchCalendars({ q = "", categoryIds = [], staffIds = [], types = [], calendarIds = [] } = {}) {
  await delay();
  const norm = (s) => (s || "").toLowerCase();
  const nq = norm(q);
  let list = [...memCalendars];

  if (nq) list = list.filter((c) => norm(c.name).includes(nq) || norm(c.description).includes(nq));
  if (categoryIds?.length) list = list.filter((c) => !c.categoryId || categoryIds.includes(c.categoryId));
  if (staffIds?.length) list = list.filter((c) => !c.staffIds?.length || c.staffIds.some((id) => staffIds.includes(id)));
  if (types?.length) list = list.filter((c) => types.includes(c.type)); // 'main' | 'extra'
  if (calendarIds?.length) list = list.filter((c) => calendarIds.includes(c.id));

  return list;
}

export async function createCalendar(payload) {
  await delay();
  const id = rid();
  const base = {
    id,
    type: payload.type, // 'main' | 'extra'
    name: payload.name?.trim() || "Sin nombre",
    description: payload.description || "",
    imageUrl: payload.imageUrl || "",
    status: payload.status || "active",
    staffIds: payload.staffIds || [],
  };

  if (payload.type === "main") {
    memCalendars.push({
      ...base,
      categoryId: payload.categoryId || null,
      price: Number(payload.price ?? 0),
      duration: Number(payload.duration ?? 0),
      bufferBefore: Number(payload.bufferBefore ?? 0),
      bufferAfter: Number(payload.bufferAfter ?? 0),
      extrasSupported: payload.extrasSupported || [],
    });
  } else {
    memCalendars.push({
      ...base,
      // opcionales
      price: payload.price != null ? Number(payload.price) : undefined,
      duration: payload.duration != null ? Number(payload.duration) : undefined,
    });
  }
  return structuredClone(memCalendars.find((c) => c.id === id));
}

export async function updateCalendar(payload) {
  await delay();
  const idx = memCalendars.findIndex((c) => c.id === payload.id);
  if (idx === -1) throw new Error("Calendario no encontrado");

  const prev = memCalendars[idx];
  const next = { ...prev, ...payload };

  // normalización rápida
  if (next.type === "main") {
    next.price = Number(next.price ?? 0);
    next.duration = Number(next.duration ?? 0);
    next.bufferBefore = Number(next.bufferBefore ?? 0);
    next.bufferAfter = Number(next.bufferAfter ?? 0);
    next.extrasSupported = Array.isArray(next.extrasSupported) ? next.extrasSupported : [];
  } else {
    next.price = next.price != null ? Number(next.price) : undefined;
    next.duration = next.duration != null ? Number(next.duration) : undefined;
  }

  memCalendars[idx] = next;
  return structuredClone(next);
}

export async function deleteCalendars(ids) {
  await delay();
  memCalendars = memCalendars.filter((c) => !ids.includes(c.id));
  // limpiar referencias en booking sites
  memBookingSites = memBookingSites.map((s) => ({
    ...s,
    calendarIds: s.calendarIds.filter((id) => !ids.includes(id)),
  }));
  return { ok: true };
}

