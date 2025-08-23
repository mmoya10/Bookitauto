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
  { id: 'st-2', name: 'Lucía'  }
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

/* ====== Generador de citas semana 18–22 Agosto 2025 ====== */
/* ====== Generador de citas semana 18–22 Agosto 2025 (capado a 2 staff y 3 simultáneas) ====== */
function generateWeekAppointments() {
  const days = ['2025-08-18','2025-08-19','2025-08-20','2025-08-21','2025-08-22']; // L-V
  const blocks = [
    { start: '08:00', end: '14:00' },
    { start: '15:00', end: '19:00' },
  ];

  // malla base de 15 minutos
  const slotBaseMinutes = 15;
  const minSlots = 2;   // 30 min
  const maxSlots = 6;   // 90 min

  // semilla determinista para “aleatorio”
  let seed = 42;
  const rand = () => (seed = (seed * 1664525 + 1013904223) % 2**32) / 2**32;

  // --- SOLO 2 TRABAJADORES ACTIVOS ---
  // Si quieres escoger otros 2, cambia el slice o el orden del array staff.
  const activeStaffIds = staff.slice(0, 2).map(s => s.id);

  const calIds   = ['cal-1','cal-2','cal-3'];
  const titlesByCal = {
    'cal-1': ['Corte - Juan','Corte - Marta','Corte - Luis','Corte - Ana','Corte - Sofía','Corte - Leo'],
    'cal-2': ['Barba - Pedro','Barba - Álvaro','Barba - Hugo','Barba - Nico'],
    'cal-3': ['Color - Laura','Color - Sara','Color - Paula','Color - Irene','Color - Eva'],
  };

  const out = [];
  let counter = 1;

  const toIso = (d, hh, mm) => `${d}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`;

  // helper: cuenta cuántas citas están “vivas” en un instante (para limitar a 3)
  const countConcurrent = (list, day, minute) => {
    const timeIso = toIso(day, Math.floor(minute/60), minute%60);
    return list.reduce((acc, a) => {
      if (a.start < timeIso && a.end > timeIso) acc++;
      return acc;
    }, 0);
  };

  for (let di = 0; di < days.length; di++) {
    const day = days[di];

    for (const block of blocks) {
      const [sH,sM] = block.start.split(':').map(Number);
      const [eH,eM] = block.end.split(':').map(Number);
      const blockStart = sH*60 + sM;
      const blockEnd   = eH*60 + eM;

      // total de slots de 15 min en el bloque
      const totalSlots = Math.floor((blockEnd - blockStart) / slotBaseMinutes);

      // deja 2 huecos “libres” pseudo-aleatorios por bloque (asegurados)
      const gaps = new Set();
      while (gaps.size < 2) {
        gaps.add(Math.floor(rand() * totalSlots));
      }

      // disponibilidad por trabajador: minuto en que queda libre
      const freeAt = Object.fromEntries(activeStaffIds.map(id => [id, blockStart]));

      for (let slotIdx = 0; slotIdx < totalSlots; slotIdx++) {
        if (gaps.has(slotIdx)) continue; // hueco libre

        const startMinutes = blockStart + slotIdx * slotBaseMinutes;

        // 1) Limitar concurrencia global a 3
        const concurrentNow = countConcurrent(out, day, startMinutes);
        if (concurrentNow >= 3) continue;

        // 2) Trabajadores libres en este instante
        const availableStaff = activeStaffIds.filter(id => freeAt[id] <= startMinutes);
        if (availableStaff.length === 0) continue;

        // 3) Decide si arrancar 0, 1 o 2 citas nuevas aquí (pero sin pasar de 3 concurrentes)
        //    — Reducimos volumen: probabilidad de 50% de NO crear nada.
        if (rand() < 0.5) continue;

        // Máximo que puedo iniciar sin pasar de 3
        const maxToStart = Math.min(3 - concurrentNow, availableStaff.length);
        // No abras demasiadas: 1 ó 2 como mucho, según disponibilidad real
        const targetToStart = Math.min(maxToStart, 1 + (rand() < 0.25 ? 1 : 0)); // 75% abre 1, 25% abre 2

        for (let k = 0; k < targetToStart; k++) {
          if (availableStaff.length === 0) break;

          const staffId = availableStaff.shift(); // toma uno y lo retira para no duplicar
          const durSlots = Math.floor(rand() * (maxSlots - minSlots + 1)) + minSlots;
          let endMinutes = startMinutes + durSlots * slotBaseMinutes;
          if (endMinutes > blockEnd) endMinutes = blockEnd;

          // Marca al staff ocupado hasta endMinutes (evita solapes)
          freeAt[staffId] = endMinutes;

          const sh = Math.floor(startMinutes/60), sm = startMinutes%60;
          const eh = Math.floor(endMinutes/60),   em = endMinutes%60;
          const startIso = toIso(day, sh, sm);
          const endIso   = toIso(day, eh, em);

          const calId = calIds[Math.floor(rand() * calIds.length)];
          const titlePool = titlesByCal[calId];
          const title = titlePool[Math.floor(rand() * titlePool.length)];
          const paid = rand() > 0.5;

          out.push({
            id: `apt-${counter++}`,
            calendarId: calId,
            staffId,
            title,
            start: startIso,
            end: endIso,
            type: 'cita',
            paid,
          });
        }
      }
    }
  }

  return out;
}


// Citas generadas para esa semana
let appointments = generateWeekAppointments();


let absences = [
  // un ejemplo de ausencia para que también se vea
  {
    id: 'abs-1',
    staffId: 'st-1',
    title: 'Asuntos propios',
    start: '2025-08-20T12:00:00',
    end:   '2025-08-20T13:00:00',
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

export async function updateAppointmentDates({ id, start, end }){
  await sleep(80);
  const i = appointments.findIndex(a=>a.id===id);
  if (i>=0){ appointments[i] = { ...appointments[i], start, end }; }
  return { ok:true };
}

export async function updateAppointment(payload){
  await sleep(100);
  const i = appointments.findIndex(a=>a.id===payload.id);
  if (i>=0){ appointments[i] = { ...appointments[i], ...payload }; }
  return { ok:true };
}
