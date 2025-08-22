// src/api/stock.js
import { fetchProducts } from "./products";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Estado inventario (stock actual y mínimo de aviso por producto)
let stockById = {
  "p-1": 8,  "p-2": 25, "p-3": 5,  "p-4": 12, "p-5": 3,
  "p-6": 40, "p-7": 18, "p-8": 50, "p-9": 9,  "p-10": 30,
};
let minAlertById = {
  "p-1": 10, "p-2": 8,  "p-3": 6,  "p-4": 8,  "p-5": 5,
  "p-6": 8,  "p-7": 6,  "p-8": 10, "p-9": 10, "p-10": 8,
};

// Movimientos de ejemplo
let movements = [
  { id: "m-1", productId: "p-1", qty: -2, reason: "venta",  kind: "gasto",   date: "2025-08-18T10:10:00Z" },
  { id: "m-2", productId: "p-3", qty: +10, reason: "compra", kind: "ingreso", date: "2025-08-17T09:00:00Z" },
  { id: "m-3", productId: "p-5", qty: -1, reason: "venta",  kind: "gasto",   date: "2025-08-16T18:30:00Z" },
  { id: "m-4", productId: "p-9", qty: -3, reason: "venta",  kind: "gasto",   date: "2025-08-12T12:00:00Z" },
  { id: "m-5", productId: "p-2", qty: +12, reason: "compra", kind: "ingreso", date: "2025-08-05T08:15:00Z" },
];

// ===== Helpers
function sortByDateDesc(a, b) { return new Date(b.date) - new Date(a.date); }
function withinRange(e, start, end) {
  const d = new Date(e.date).getTime();
  return (!start || d >= new Date(start).getTime()) && (!end || d < new Date(end).getTime());
}

// ===== API
export async function fetchInventory() {
  await sleep(100);
  const prods = await fetchProducts();
  return prods.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl,
    stock: stockById[p.id] ?? 0,
    minAlert: minAlertById[p.id] ?? 0,
  }));
}

export async function fetchLowStock() {
  const inv = await fetchInventory();
  return inv.filter((x) => x.stock < x.minAlert);
}

export async function fetchMovements({ start, end, productId, limit = 0 }) {
  await sleep(100);
  let list = movements
    .filter((m) => (!productId || m.productId === productId) && withinRange(m, start, end))
    .sort(sortByDateDesc);
  if (!start && !end && !productId && limit) list = list.slice(0, limit);
  return list;
}

export async function createMovement(payload) {
  await sleep(120);
  const id = `m-${Math.random().toString(36).slice(2, 8)}`;
  const qty = Number(payload.qty || 0);
  const kind = payload.kind || (payload.reason === "venta" ? "gasto" : "ingreso");
  const date = payload.date || new Date().toISOString();
  const productId = payload.productId;
  movements.push({ id, productId, qty, reason: payload.reason, kind, date });
  // aplica al stock
  stockById[productId] = (stockById[productId] ?? 0) + qty;
  return { ok: true, id };
}

export async function updateMovement(payload) {
  await sleep(120);
  const i = movements.findIndex((m) => m.id === payload.id);
  if (i < 0) return { ok: false };
  const prev = movements[i];
  // revertir efecto previo
  stockById[prev.productId] = (stockById[prev.productId] ?? 0) - prev.qty;
  // aplicar nuevo
  const next = {
    ...prev,
    productId: payload.productId ?? prev.productId,
    qty: Number(payload.qty ?? prev.qty),
    reason: payload.reason ?? prev.reason,
    kind: payload.kind ?? prev.kind,
    date: payload.date ?? prev.date,
  };
  movements[i] = next;
  stockById[next.productId] = (stockById[next.productId] ?? 0) + next.qty;
  return { ok: true };
}

export async function deleteMovement(id) {
  await sleep(100);
  const i = movements.findIndex((m) => m.id === id);
  if (i < 0) return { ok: false };
  // revertir stock
  const mv = movements[i];
  stockById[mv.productId] = (stockById[mv.productId] ?? 0) - mv.qty;
  movements.splice(i, 1);
  return { ok: true };
}
