// src/api/spaces.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let featureEnabled = false;

let spaces = [
  {
    id: "sp-1",
    name: "Sala Principal",
    description: "Espacio amplio para cortes y color.",
    capacity: 6,
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "sp-2",
    name: "Cabina 1",
    description: "Tratamientos individuales.",
    capacity: 1,
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: "sp-3",
    name: "Cabina 2",
    description: "Uñas y manicura.",
    capacity: 2,
    imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: "sp-4",
    name: "Zona Barber",
    description: "Barbería especializada.",
    capacity: 3,
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=900&auto=format&fit=crop",
  },
];

export async function fetchSpacesEnabled() {
  await sleep(100);
  return { enabled: featureEnabled };
}

export async function setSpacesEnabled({ enabled }) {
  await sleep(150);
  featureEnabled = !!enabled;
  return { ok: true, enabled: featureEnabled };
}

export async function fetchSpaces({ q } = {}) {
  await sleep(120);
  const text = (q || "").trim().toLowerCase();
  const list = spaces.slice();
  return text ? list.filter((s) => s.name.toLowerCase().includes(text)) : list;
}

export async function createSpace({ name, description, capacity, imageUrl }) {
  await sleep(200);
  const id = `sp-${Math.random().toString(36).slice(2, 8)}`;
  const n = { id, name, description, capacity: Number(capacity || 0), imageUrl };
  spaces.unshift(n);
  return { ok: true, space: n };
}

export async function updateSpace({ id, name, description, capacity, imageUrl }) {
  await sleep(200);
  const i = spaces.findIndex((s) => s.id === id);
  if (i === -1) throw new Error("Espacio no encontrado");
  spaces[i] = { ...spaces[i], name, description, capacity: Number(capacity || 0), imageUrl };
  return { ok: true, space: spaces[i] };
}

export async function deleteSpaces(ids = []) {
  await sleep(180);
  spaces = spaces.filter((s) => !ids.includes(s.id));
  return { ok: true };
}
