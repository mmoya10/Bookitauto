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
  { id: "stf_1", name: "Laura", imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWY1NzAyMjdjODE5MTliNjc2ZWJmYzM3NTQzNzc6ZmlsZV8wMDAwMDAwMDY2ZjQ2MWY3YTMxNWVjODY0ZGY1YjNlMyIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6IjcwMGQzZmJmYjBmYmFjMTdiN2E1Mzc3OGUyMjQ1ZTBiN2UzZDY5ZWZjMDUxNWQ1MDBmNzU3MjEzN2MxZTc3YTAiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==", bio: "Especialista en color y tratamientos." },
  { id: "stf_2", name: "Carlos", imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWY0ZWZiMGU4ODE5MWFiZDVmNzhlOTNhMDRjMjc6ZmlsZV8wMDAwMDAwMDNmOWM2MWY4YTI1NDkzOGRlZWYzMjEzNiIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6IjNiMWUxNDExNzFhOGE4YzhlZGEzNGI4YTNhNzA4NzUwOWNlNjcwZGJiZThkNDE1MGMwNDQ0M2Y4YTllMTk2MjUiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==", bio: "Cortes modernos y barbería." },
  { id: "stf_3", name: "Julia", imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWY1ZWE2MjhjODE5MWIwZmYyNTFlZmZiMjQzZWM6ZmlsZV8wMDAwMDAwMGJkZTg2MjQzOWY4YWU5YWM3MjY5M2Y3MiIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6IjFhODFmYmE3ZWE0ZWVmMTIzM2NkZmFlMjUwZTYxZTk2ZTcxM2E5YjkxZTdmMzUwNDg2YmQ5OGExZTczZmZjYzgiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==", bio: "Spa y cuidado facial." },
];


let memCalendars = [
  // ==== CORTES ====
  {
    id: "cal_cut_1",
    type: "main",
    name: "Corte Premium",
    description: "Corte con asesoría personalizada",
    imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWYyZjBiNzU4ODE5MTkyNzdlNGVjNjE1OGZkMzU6ZmlsZV8wMDAwMDAwMDI4MDA2MjJmOGVjMmFhYjFhMzUyZWEzYSIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6ImE3MDg2OGI1ZTQzYzJkOGI3ODY2NWE1NmY4MmNmMTUzYjc1ZTg3ZDRjNzgwMzQ5Nzc2MzM1YTk2ODI3N2NjYWQiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    categoryId: "cat_cut",
    price: 24.9,
    duration: 45,
    bufferBefore: 5,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_1", "cal_extra_2"],
    staffIds: ["stf_1", "stf_2"],
    status: "active",
  },
  {
    id: "cal_cut_2",
    type: "main",
    name: "Corte Infantil",
    description: "Corte para niños hasta 12 años",
    imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWYzMmZlMzk4ODE5MWIzOTY2Y2M1YWY5MzFjOGQ6ZmlsZV8wMDAwMDAwMGMxOGM2MjJmOTA1OGI5YjllNDUwNjY3YyIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6ImJlMzFjMjBkNGE4ZjVhNDc3MmU5MDliZDUzMTNkYjAwODI0MTczYzEyZGMwMjkzYTY2YTY4MTcwNjViOGNmMWQiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    categoryId: "cat_cut",
    price: 14.9,
    duration: 30,
    bufferBefore: 0,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_1"],
    staffIds: ["stf_1", "stf_3"],
    status: "active",
  },
  {
    id: "cal_cut_3",
    type: "main",
    name: "Corte Caballero",
    description: "Clásico o moderno",
    imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWYzYjc3MmU0ODE5MWE1Y2E3NTkzYzM4NGUxYTM6ZmlsZV8wMDAwMDAwMGQ0MTQ2MWZkYmU5NWMwZWU5OTIzMjc3YSIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6IjU3M2I3YjlmMmY1YmQxZDU1NjY4ZGY1MGQyOTA0OGMzYjhmOTcwOTA3ZjU5ZjZjZDkwNDAwYTUwNGViOWYyZGMiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    categoryId: "cat_cut",
    price: 19.9,
    duration: 40,
    bufferBefore: 0,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_2"],
    staffIds: ["stf_2"],
    status: "active",
  },
  {
    id: "cal_cut_4",
    type: "main",
    name: "Corte Señora",
    description: "Incluye lavado y peinado básico",
    imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWY0MTIxMWQ0ODE5MWI4M2EzZmNiMmJhMjFlNWI6ZmlsZV8wMDAwMDAwMGU0ZjQ2MWY3YjZjNDQ1ZjAyNDU3ZWNkMSIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6IjE5YmY4NWY2M2JjNDY4ZjBkODQ5ZTU0MGEwNTY1NWQ3MTQ3Yjg0Nzc5NmNjYzJmNDQ3M2JhYWUxNGQ2ODIyOTUiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    categoryId: "cat_cut",
    price: 29.9,
    duration: 50,
    bufferBefore: 5,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_1", "cal_extra_2"],
    staffIds: ["stf_1", "stf_2", "stf_3"],
    status: "active",
  },

  // ==== COLOR ====
  {
    id: "cal_color_1",
    type: "main",
    name: "Coloración Raíz",
    description: "Color solo en raíz",
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
  {
    id: "cal_color_2",
    type: "main",
    name: "Color Completo",
    description: "Color uniforme en todo el cabello",
    imageUrl: "https://placehold.co/640x360?text=Color+Completo",
    categoryId: "cat_color",
    price: 54.9,
    duration: 90,
    bufferBefore: 10,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_3"],
    staffIds: ["stf_1", "stf_3"],
    status: "active",
  },
  {
    id: "cal_color_3",
    type: "main",
    name: "Mechas Babylights",
    description: "Mechas finas y naturales",
    imageUrl: "https://placehold.co/640x360?text=Mechas+Babylights",
    categoryId: "cat_color",
    price: 89.0,
    duration: 120,
    bufferBefore: 10,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_3"],
    staffIds: ["stf_2"],
    status: "active",
  },
  {
    id: "cal_color_4",
    type: "main",
    name: "Balayage",
    description: "Degradado natural",
    imageUrl: "https://placehold.co/640x360?text=Balayage",
    categoryId: "cat_color",
    price: 99.0,
    duration: 150,
    bufferBefore: 15,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_3"],
    staffIds: ["stf_1", "stf_2"],
    status: "active",
  },

  // ==== SPA ====
  {
    id: "cal_spa_1",
    type: "main",
    name: "Masaje Relajante",
    description: "Masaje de cuerpo completo",
    imageUrl: "https://placehold.co/640x360?text=Masaje+Relajante",
    categoryId: "cat_spa",
    price: 49.9,
    duration: 60,
    bufferBefore: 5,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_4"],
    staffIds: ["stf_3"],
    status: "active",
  },
  {
    id: "cal_spa_2",
    type: "main",
    name: "Masaje Descontracturante",
    description: "Masaje terapéutico",
    imageUrl: "https://placehold.co/640x360?text=Masaje+Descontracturante",
    categoryId: "cat_spa",
    price: 59.9,
    duration: 70,
    bufferBefore: 5,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_4"],
    staffIds: ["stf_2"],
    status: "active",
  },
  {
    id: "cal_spa_3",
    type: "main",
    name: "Tratamiento Facial",
    description: "Limpieza profunda e hidratación",
    imageUrl: "https://placehold.co/640x360?text=Facial",
    categoryId: "cat_spa",
    price: 39.9,
    duration: 50,
    bufferBefore: 5,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_3", "cal_extra_4"],
    staffIds: ["stf_1", "stf_3"],
    status: "active",
  },
  {
    id: "cal_spa_4",
    type: "main",
    name: "Circuito Spa",
    description: "Sauna + jacuzzi + ducha sensorial",
    imageUrl: "https://placehold.co/640x360?text=Circuito+Spa",
    categoryId: "cat_spa",
    price: 69.9,
    duration: 120,
    bufferBefore: 15,
    bufferAfter: 15,
    extrasSupported: ["cal_extra_4"],
    staffIds: ["stf_1", "stf_2"],
    status: "active",
  },

  // ==== EXTRAS ====
  {
    id: "cal_extra_1",
    type: "extra",
    name: "Lavado",
    description: "Lavado básico",
    imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWZhMDUzNDQwODE5MTg5NmQ5YjkwYjM4OTVhMWY6ZmlsZV8wMDAwMDAwMDg5OTA2MjQzODYwNDIxNzFiNWQyNzVjNCIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6Ijg0NzkwMTUxZThhMTQyOTgyMDI2Y2QxMDM0MTIzZWQwODI5Y2Q0ODgzYjI5ZWQxMDAzNTI1YTBjMmRlNWMyNzMiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    price: 4.5,
    duration: 10,
    staffIds: [],
    status: "active",
  },
  {
    id: "cal_extra_2",
    type: "extra",
    name: "Peinado Exprés",
    description: "Secado y peinado rápido",
    imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWZhMjQ2ODIwODE5MTk1YTUxOTdkMjQ4ZDZkMGM6ZmlsZV8wMDAwMDAwMGU4NDQ2MjQzOTQzMGRmNmJkMDAxYjFkZSIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6IjY3ZmY0OWMwZmI1NTBiN2JjY2Y3ODFkMzUzMzcwODIwYWYwZGM3ZDczNDZkNGJiYTg0YzUzYzE5OWM4YTk2YTgiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    price: 7.9,
    duration: 15,
    staffIds: [],
    status: "active",
  },
  {
    id: "cal_extra_3",
    type: "extra",
    name: "Tratamiento Hidratante",
    description: "Mascarilla y masaje",
    imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWZhYTk3ZDM0ODE5MWE5MDA2ZmZjN2Y1Nzk5ZjY6ZmlsZV8wMDAwMDAwMGJhOTA2MjQzYjY2Y2Q2MTE4MTI5YTE0MyIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6ImQzNTgyMzZiYzhmODY0NTRiYjE5NmM5YjcxNTA3ZGVhZjk0YzlkYWQwNTI3Nzk2MmE0YTA4MTQ3YTIzNDA0ZDEiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    price: 9.9,
    duration: 20,
    staffIds: [],
    status: "active",
  },
  {
    id: "cal_extra_4",
    type: "extra",
    name: "Masaje de pies",
    description: "Relajación extra al final del servicio",
    imageUrl: "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWZiYzhhNWFjODE5MTk5MzE5NDAwYjY0M2E2MTY6ZmlsZV8wMDAwMDAwMGYxZTg2MjQzODZmZDhhODMwNTlhNTk1YiIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6ImEwMDI2OGI2ZjBkNzk0YjQzNGE1ZjM1MTcyMDY4MGNiYWMzZjU3NzczNThiYjI3YWYyZjg2NzYwY2ZhYzE5OTYiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    price: 12.9,
    duration: 15,
    staffIds: [],
    status: "active",
  },
];
let memBookingSites = [
  {
    id: "site_main",
    name: "Sitio Web Principal",
    categoryIds: ["cat_cut", "cat_color", "cat_spa"],
    calendarIds: memCalendars.map((c) => c.id),
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

