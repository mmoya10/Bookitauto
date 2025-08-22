// src/api/cash.js
import { format } from "date-fns";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isoDay = (d) => format(new Date(d), "yyyy-MM-dd");

// ===== Estado en memoria =====
/** Estructura:
 * cash[date] = {
 *   date: 'YYYY-MM-DD',
 *   isOpen: boolean,
 *   isClosed: boolean,
 *   openingBalance: number,
 *   closingBalance?: number,
 *   openingNote?: string,
 *   closingNote?: string,
 *   movements: [{ id, amount, kind: 'ingreso'|'gasto', reason, note, atISO }]
 * }
 */
let cash = {};

// Semillas (3 días previos y hoy no abierta)
(() => {
  const today = isoDay(new Date());
  const d1 = isoDay(new Date(Date.now() - 86400000)); // ayer
  const d2 = isoDay(new Date(Date.now() - 2 * 86400000));
  const d3 = isoDay(new Date(Date.now() - 3 * 86400000));

  cash[d3] = {
    date: d3,
    isOpen: true,
    isClosed: true,
    openingBalance: 100,
    closingBalance: 240,
    openingNote: "Apertura auto",
    closingNote: "Cuadre OK",
    movements: [
      mv("m-1", 50, "ingreso", "venta", d3 + "T10:00:00Z"),
      mv("m-2", -10, "gasto", "cambio", d3 + "T12:00:00Z"),
      mv("m-3", 100, "ingreso", "compra online pagada en tienda", d3 + "T17:00:00Z"),
    ],
  };

  cash[d2] = {
    date: d2,
    isOpen: true,
    isClosed: true,
    openingBalance: cash[d3].closingBalance,
    closingBalance: 300,
    openingNote: "Auto desde cierre anterior",
    closingNote: "OK",
    movements: [
      mv("m-4", -20, "gasto", "retirada caja", d2 + "T09:10:00Z"),
      mv("m-5", 120, "ingreso", "ventas día", d2 + "T18:40:00Z"),
    ],
  };

  cash[d1] = {
    date: d1,
    isOpen: true,
    isClosed: true,
    openingBalance: cash[d2].closingBalance,
    closingBalance: 260,
    openingNote: "Auto",
    closingNote: "OK",
    movements: [
      mv("m-6", 40, "ingreso", "ventas", d1 + "T11:10:00Z"),
      mv("m-7", -80, "gasto", "proveedor", d1 + "T16:20:00Z"),
      mv("m-8", 60, "ingreso", "ventas tarde", d1 + "T19:00:00Z"),
    ],
  };

  // Hoy: sin abrir (para ver el flujo de apertura)
  if (!cash[today]) {
    cash[today] = {
      date: today,
      isOpen: false,
      isClosed: false,
      openingBalance: null,
      movements: [],
    };
  }
})();

function mv(id, amount, kind, reason, atISO) {
  return { id, amount, kind, reason, atISO, note: "" };
}
function lastClosedBefore(dateISO) {
  const target = new Date(dateISO + "T00:00:00Z").getTime();
  const days = Object.keys(cash)
    .filter((d) => new Date(d + "T00:00:00Z").getTime() < target)
    .sort((a, b) => new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z"));
  for (const d of days) {
    const c = cash[d];
    if (c?.isClosed) return { date: d, closingBalance: c.closingBalance ?? 0 };
  }
  return null;
}
function sumMovements(movs) {
  return (movs ?? []).reduce((acc, m) => acc + Number(m.amount || 0), 0);
}

// ===== API
export async function fetchCashDay(dateISO) {
  await sleep(120);
  const day = isoDay(dateISO);
  const box = cash[day] ?? {
    date: day,
    isOpen: false,
    isClosed: false,
    openingBalance: null,
    movements: [],
  };
  const suggest = lastClosedBefore(day);
  return {
    ...box,
    suggestedOpening: suggest?.closingBalance ?? 0,
    suggestedFromDate: suggest?.date ?? null,
  };
}

export async function fetchCashMovements(dateISO) {
  await sleep(100);
  const day = isoDay(dateISO);
  return cash[day]?.movements?.slice().sort((a, b) => new Date(b.atISO) - new Date(a.atISO)) ?? [];
}

export async function openCashDay({ dateISO, openingBalance, note = "" }) {
  await sleep(120);
  const day = isoDay(dateISO);
  if (!cash[day]) cash[day] = { date: day, movements: [] };
  cash[day].isOpen = true;
  cash[day].isClosed = false;
  cash[day].openingBalance = Number(openingBalance || 0);
  cash[day].openingNote = note;
  // limpiar cierre si lo hubiera
  delete cash[day].closingBalance;
  delete cash[day].closingNote;
  return { ok: true };
}

export async function closeCashDay({ dateISO, closingBalance, note }) {
  await sleep(120);
  const day = isoDay(dateISO);
  if (!cash[day]) throw new Error("Caja inexistente");
  cash[day].isClosed = true;
  cash[day].isOpen = true;
  cash[day].closingBalance = Number(closingBalance ?? (cash[day].openingBalance + sumMovements(cash[day].movements)));
  cash[day].closingNote = note ?? "";
  return { ok: true };
}

export async function reopenCashDay({ dateISO }) {
  await sleep(100);
  const day = isoDay(dateISO);
  if (!cash[day]) throw new Error("Caja inexistente");
  cash[day].isClosed = false;
  // mantenemos isOpen = true
  return { ok: true };
}

export async function createCashMovement({ dateISO, movement }) {
  await sleep(120);
  const day = isoDay(dateISO);
  if (!cash[day]) throw new Error("Caja inexistente");
  const id = `mv-${Math.random().toString(36).slice(2, 9)}`;
  const amt = Number(movement.amount || 0);
  const kind = movement.kind || (amt >= 0 ? "ingreso" : "gasto");
  cash[day].movements.push({
    id,
    amount: amt,
    kind,
    reason: movement.reason || "",
    note: movement.note || "",
    atISO: movement.atISO || new Date().toISOString(),
  });
  return { ok: true, id };
}

export async function updateCashMovement({ dateISO, movement }) {
  await sleep(120);
  const day = isoDay(dateISO);
  const list = cash[day]?.movements || [];
  const i = list.findIndex((m) => m.id === movement.id);
  if (i < 0) throw new Error("Movimiento no encontrado");
  const amt = Number(movement.amount);
  list[i] = {
    ...list[i],
    amount: amt,
    kind: movement.kind || (amt >= 0 ? "ingreso" : "gasto"),
    reason: movement.reason ?? list[i].reason,
    note: movement.note ?? list[i].note,
    atISO: movement.atISO ?? list[i].atISO,
  };
  return { ok: true };
}

export async function deleteCashMovement({ dateISO, id }) {
  await sleep(100);
  const day = isoDay(dateISO);
  const list = cash[day]?.movements || [];
  const i = list.findIndex((m) => m.id === id);
  if (i >= 0) list.splice(i, 1);
  return { ok: true };
}
