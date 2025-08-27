// src/api/staff.js
import { fetchCalendars, fetchAbsences } from "./calendars";
import Staff1 from "../Images/Staff1.png";
import Staff2 from "../Images/Staff2.png";
import Staff3 from "../Images/Staff3.png";


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let staff = [
  {
    id: "st-1",
    name: "Marcos",
    description: "Especialista en corte clásico y degradados.",
    imageUrl: Staff1,
    calendarIds: ["cal-1", "cal-2"],
  },
  {
    id: "st-2",
    name: "Lucía",
    description: "Colorista creativa, balayage y mechas.",
    imageUrl: Staff2,
    calendarIds: ["cal-3"],
  },
  {
    id: "st-3",
    name: "Irene",
    description: "Cortes modernos y peinados de evento.",
    imageUrl: Staff3,
    calendarIds: ["cal-1"],
  },
];

export async function fetchStaffList() {
  await sleep(120);
  // devolver ordenado por nombre
  return staff.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function createStaff(payload) {
  await sleep(140);
  const id = `st-${Math.random().toString(36).slice(2, 8)}`;
  const item = {
    id,
    name: payload.name?.trim() || "Personal",
    description: payload.description?.trim() || "",
    imageUrl:
      payload.imageUrl?.trim() ||
      `https://picsum.photos/seed/${id}/480/320`,
    calendarIds: [], // por defecto vacío (se edita en gestión avanzada)
  };
  staff.push(item);
  return { ok: true, id };
}

export async function updateStaff(payload) {
  await sleep(140);
  const i = staff.findIndex((s) => s.id === payload.id);
  if (i >= 0) {
    staff[i] = {
      ...staff[i],
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl,
      // calendarIds se gestiona en otra pantalla (si lo quieres aquí, lo añadimos)
    };
  }
  return { ok: true };
}

export async function deleteStaff(ids) {
  await sleep(120);
  const set = new Set(ids);
  staff = staff.filter((s) => !set.has(s.id));
  return { ok: true, deleted: ids.length };
}

/** Calendarios activos para un miembro de personal */
export async function fetchStaffCalendars(staffId) {
  await sleep(100);
  const s = staff.find((x) => x.id === staffId);
  const all = await fetchCalendars();
  const map = new Map(all.map((c) => [c.id, c]));
  return (s?.calendarIds ?? []).map((id) => map.get(id)).filter(Boolean);
}

/** Ausencias del mes para un miembro (usa API de calendarios) */
export async function fetchStaffAbsencesMonth(staffId, year, monthIndex0) {
  // monthIndex0: 0-enero ... 11-diciembre
  await sleep(120);
  const start = new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 1, 0, 0, 0));
  const res = await fetchAbsences({
    start: start.toISOString(),
    end: end.toISOString(),
    staffIds: [staffId],
  });
  return res;
}
