// src/api/notifications.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Notificación:
 * { id, type:'vacation'|'schedule', title, message, createdAt:ISO,
 *   status:'pending'|'approved'|'rejected',
 *   seen:boolean,
 *   payload:{ ... }
 * }
 */
let seedAt = new Date();
let notifications = [
  {
    id: "n-1",
    type: "vacation",
    title: "Vacaciones — Marcos",
    message: "Solicitud del 02/09 al 05/09 (3 días laborables).",
    createdAt: new Date(seedAt.getTime() - 3 * 3600e3).toISOString(),
    status: "pending",
    seen: false,
    payload: {
      employee: "Marcos",
      from: "2025-09-02",
      to: "2025-09-05",
      days: 3,
      reason: "Vacaciones",
    },
  },
  {
    id: "n-2",
    type: "schedule",
    title: "Cambio de horario — Ana",
    message: "Miércoles: añadir 17:00–19:00 y quitar 12:00–13:00.",
    createdAt: new Date(seedAt.getTime() - 6 * 3600e3).toISOString(),
    status: "pending",
    seen: false,
    payload: {
      employee: "Ana",
      day: "Miércoles",
      add: [{ start: "17:00", end: "19:00" }],
      remove: [{ start: "12:00", end: "13:00" }],
      note: "Mayor demanda por la tarde",
    },
  },
  {
    id: "n-3",
    type: "vacation",
    title: "Ausencia — Pedro",
    message: "Asuntos propios 10/09 (4 horas).",
    createdAt: new Date(seedAt.getTime() - 26 * 3600e3).toISOString(),
    status: "pending",
    seen: true,
    payload: {
      employee: "Pedro",
      from: "2025-09-10",
      to: "2025-09-10",
      hours: 4,
      reason: "Asuntos propios",
    },
  },
];

export async function fetchNotifications() {
  await sleep(120);
  // más recientes primero
  return notifications.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markSeen(id) {
  await sleep(80);
  const i = notifications.findIndex((n) => n.id === id);
  if (i >= 0) notifications[i].seen = true;
  return { ok: true };
}

export async function approveNotification(id) {
  await sleep(160);
  const i = notifications.findIndex((n) => n.id === id);
  if (i >= 0) {
    notifications[i].status = "approved";
    notifications[i].seen = true;
  }
  return { ok: true };
}

export async function rejectNotification(id) {
  await sleep(160);
  const i = notifications.findIndex((n) => n.id === id);
  if (i >= 0) {
    notifications[i].status = "rejected";
    notifications[i].seen = true;
  }
  return { ok: true };
}
