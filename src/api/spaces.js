// src/api/spaces.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let featureEnabled = false;
let spaces = [
  {
    id: "sp-1",
    name: "Equipo de láser depilación",
    description: "Máquina profesional para depilación láser.",
    capacity: 1,
    imageUrl: "https://tienda.fisaude.com/imagemagic.php?img=images/maquina-depilacion-laser-trionda.jpg&page=prod_info&w=600&h=600",
  },
  {
    id: "sp-2",
    name: "Sala",
    description: "Espacio privado para tratamientos individuales.",
    capacity: 4,
    imageUrl: "https://cncentrosdenegocios.com/wp-content/uploads/2024/04/Sala-Premium-1.jpg",
  },
  {
    id: "sp-3",
    name: "Camas de masaje",
    description: "Camillas cómodas para masajes y terapias.",
    capacity: 2,
    imageUrl: "https://m.media-amazon.com/images/I/61uZH5YM8qL._UF1000,1000_QL80_.jpg",
  },
  {
    id: "sp-4",
    name: "Máquina de rizos",
    description: "Equipo automático para rizos y peinados.",
    capacity: 1,
    imageUrl: "https://cremaslaniquerena.com/cdn/shop/products/Automatic-Hair-Curler-Auto-Hair-Curling-Iron-Ceramic-Rotating-Air-Curler20Air-Spin-Wand-Styler-Curl_2_1080x.jpg?v=1676652751",
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
