// src/api/marketing.js
// API mock con persistencia en localStorage (+ fallback en memoria)

const LS = (typeof window !== "undefined" && window.localStorage) ? window.localStorage : null;

// --- Utils ---
const delay = (ms = 350) => new Promise(r => setTimeout(r, ms));
const rid = () => Math.random().toString(36).slice(2, 10);
const nowIso = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const K_SETTINGS = "mk:settings";
const K_COUPONS  = "mk:coupons";
const K_PACKS    = "mk:packs";

const mem = {
  [K_SETTINGS]: { marketingEnabled: true, couponsEnabled: true, packsEnabled: true },
  [K_COUPONS]: [
    {
      id: rid(),
      name: "WELCOME10",
      discountType: "percent", // "percent" | "value"
      amount: 10,
      validFrom: nowIso(),
      validTo: null,
      users: "__all__",        // "__all__" | string[]
    },
  ],
  [K_PACKS]: [
    {
      id: rid(),
      name: "PACK-BALAYAGE",
      discountType: "value",   // "percent" | "value" | "service"
      amount: 15,
      validFrom: nowIso(),
      validTo: null,
      users: "__all__",
    },
  ],
};

function read(key) {
  if (LS) {
    const raw = LS.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  return mem[key] ?? null;
}
function write(key, val) {
  if (LS) LS.setItem(key, JSON.stringify(val));
  else mem[key] = val;
}
function ensureInit() {
  if (!read(K_SETTINGS)) write(K_SETTINGS, mem[K_SETTINGS]);
  if (!read(K_COUPONS))  write(K_COUPONS,  mem[K_COUPONS]);
  if (!read(K_PACKS))    write(K_PACKS,    mem[K_PACKS]);
}
ensureInit();

// --- Tipos (referencia)
/**
 * Coupon = {
 *  id: string, name: string,
 *  discountType: "percent"|"value",
 *  amount: number,
 *  validFrom?: string|null, validTo?: string|null,
 *  users: "__all__"|string[]
 * }
 *
 * Pack = {
 *  id: string, name: string,
 *  discountType: "percent"|"value"|"service",
 *  amount?: number|null,
 *  validFrom?: string|null, validTo?: string|null,
 *  users: "__all__"|string[]
 * }
 *
 * MarketingSettings = {
 *  marketingEnabled: boolean, couponsEnabled: boolean, packsEnabled: boolean
 * }
 */

// ========== SETTINGS ==========
export async function fetchMarketing() {
  await delay();
  return read(K_SETTINGS);
}
export async function setMarketingEnabled(enabled) {
  await delay(200);
  const s = read(K_SETTINGS) ?? {};
  s.marketingEnabled = !!enabled;
  write(K_SETTINGS, s);
  return { ok: true };
}
export async function setCouponsEnabled(enabled) {
  await delay(200);
  const s = read(K_SETTINGS) ?? {};
  s.couponsEnabled = !!enabled;
  write(K_SETTINGS, s);
  return { ok: true };
}
export async function setPacksEnabled(enabled) {
  await delay(200);
  const s = read(K_SETTINGS) ?? {};
  s.packsEnabled = !!enabled;
  write(K_SETTINGS, s);
  return { ok: true };
}

// ========== COUPONS ==========
export async function fetchCoupons() {
  await delay();
  return read(K_COUPONS) ?? [];
}
export async function createCoupon(payload) {
  await delay(300);
  const list = read(K_COUPONS) ?? [];
  const item = normalizeCoupon({ id: rid(), ...payload });
  list.push(item);
  write(K_COUPONS, list);
  return item;
}
export async function updateCoupon({ id, ...payload }) {
  await delay(300);
  const list = read(K_COUPONS) ?? [];
  const idx = list.findIndex(c => c.id === id);
  if (idx === -1) throw new Error("Cupón no encontrado");
  list[idx] = normalizeCoupon({ ...list[idx], ...payload, id });
  write(K_COUPONS, list);
  return list[idx];
}
export async function deleteCoupon(id) {
  await delay(250);
  let list = read(K_COUPONS) ?? [];
  const before = list.length;
  list = list.filter(c => c.id !== id);
  if (list.length === before) throw new Error("Cupón no encontrado");
  write(K_COUPONS, list);
  return { ok: true };
}

function normalizeCoupon(c) {
  return {
    id: c.id ?? rid(),
    name: String(c.name ?? "").trim(),
    discountType: c.discountType === "value" ? "value" : "percent",
    amount: Number(c.amount ?? 0),
    validFrom: c.validFrom || null,
    validTo: c.validTo || null,
    users: normalizeUsers(c.users),
  };
}

// ========== PACKS ==========
export async function fetchPacks() {
  await delay();
  return read(K_PACKS) ?? [];
}
export async function createPack(payload) {
  await delay(300);
  const list = read(K_PACKS) ?? [];
  const item = normalizePack({ id: rid(), ...payload });
  list.push(item);
  write(K_PACKS, list);
  return item;
}
export async function updatePack({ id, ...payload }) {
  await delay(300);
  const list = read(K_PACKS) ?? [];
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Pack no encontrado");
  list[idx] = normalizePack({ ...list[idx], ...payload, id });
  write(K_PACKS, list);
  return list[idx];
}
export async function deletePack(id) {
  await delay(250);
  let list = read(K_PACKS) ?? [];
  const before = list.length;
  list = list.filter(p => p.id !== id);
  if (list.length === before) throw new Error("Pack no encontrado");
  write(K_PACKS, list);
  return { ok: true };
}

function normalizePack(p) {
  const type = (p.discountType === "value" || p.discountType === "service") ? p.discountType : "percent";
  return {
    id: p.id ?? rid(),
    name: String(p.name ?? "").trim(),
    discountType: type,                     // "percent" | "value" | "service"
    amount: type === "service" ? null : Number(p.amount ?? 0),
    validFrom: p.validFrom || null,
    validTo: p.validTo || null,
    users: normalizeUsers(p.users),
  };
}

// ========== Helpers ==========
function normalizeUsers(u) {
  if (u === "__all__" || u == null) return "__all__";
  if (Array.isArray(u)) return u.map(String);
  // permitir CSV desde formularios
  return String(u)
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
}
