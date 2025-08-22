// src/api/calendars.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const categories = [
  { id: 'cat-1', name: 'Cortes' },
  { id: 'cat-2', name: 'Color' },
];

export const calendars = [
  { id: 'cal-1', name: 'Corte de pelo', categoryId: 'cat-1' },
  { id: 'cal-2', name: 'Barba',         categoryId: 'cat-1' },
  { id: 'cal-3', name: 'Coloración',    categoryId: 'cat-2' },
];

export const staff = [
  { id: 'st-1', name: 'Marcos' },
  { id: 'st-2', name: 'Lucía' },
];

// Horario negocio (L-V 08-14 / 15-19)
export const businessHours = [
  { daysOfWeek: [1,2,3,4,5], startTime: '08:00', endTime: '14:00' },
  { daysOfWeek: [1,2,3,4,5], startTime: '15:00', endTime: '19:00' },
];

// Festivos (background)
export const holidays = [
  { start: '2025-12-25', end: '2025-12-26', title: 'Navidad', display: 'background' },
  { start: '2026-01-01', end: '2026-01-02', title: 'Año Nuevo', display: 'background' },
];

// Citas (añado paid)
let appointments = [
  {
    id: 'apt-1',
    calendarId: 'cal-1',
    staffId: 'st-1',
    title: 'Corte - Juan',
    start: '2025-08-20T10:00:00',
    end:   '2025-08-20T11:00:00',
    type: 'cita',
    paid: true,
  },
  {
    id: 'apt-2',
    calendarId: 'cal-3',
    staffId: 'st-2',
    title: 'Color - Ana',
    start: '2025-08-21T16:00:00',
    end:   '2025-08-21T17:30:00',
    type: 'cita',
    paid: false,
  },
];

let absences = [
  {
    id: 'abs-1',
    staffId: 'st-1',
    title: 'Asuntos propios',
    start: '2025-08-22T12:00:00',
    end:   '2025-08-22T14:00:00',
    type: 'ausencia',
  },
];

export async function fetchCalendarCategories(){ await sleep(100); return categories; }
export async function fetchCalendars(){ await sleep(100); return calendars; }
export async function fetchStaff(){ await sleep(100); return staff; }
export async function fetchBusinessHours(){ await sleep(60); return businessHours; }
export async function fetchHolidays(){ await sleep(60); return holidays; }

export async function fetchAppointments({ start, end, calendarIds, staffIds, type }){
  await sleep(100);
  const inRange = (e)=>(!start||e.end>=start)&&(!end||e.start<end);
  const byCal=(e)=>!calendarIds?.length||calendarIds.includes(e.calendarId);
  const byStaff=(e)=>!staffIds?.length||staffIds.includes(e.staffId);
  const byType=(e)=>type==='ambos'||e.type===type;
  return appointments.filter(e=>inRange(e)&&byCal(e)&&byStaff(e)&&byType(e));
}
export async function fetchAbsences({ start, end, staffIds }){
  await sleep(100);
  const inRange=(e)=>(!start||e.end>=start)&&(!end||e.start<end);
  const byStaff=(e)=>!staffIds?.length||staffIds.includes(e.staffId);
  return absences.filter(e=>inRange(e)&&byStaff(e));
}

export async function createAppointment(payload){
  await sleep(100);
  const id = `apt-${Math.random().toString(36).slice(2,8)}`;
  appointments.push({ id, type:'cita', paid:false, ...payload });
  return { ok:true, id };
}

// ✅ mover/resize
export async function updateAppointmentDates({ id, start, end }){
  await sleep(80);
  const i = appointments.findIndex(a=>a.id===id);
  if (i>=0){ appointments[i] = { ...appointments[i], start, end }; }
  return { ok:true };
}

// ✅ editar cita
export async function updateAppointment(payload){
  await sleep(100);
  const i = appointments.findIndex(a=>a.id===payload.id);
  if (i>=0){ appointments[i] = { ...appointments[i], ...payload }; }
  return { ok:true };
}

