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
  { id: 'st-2', name: 'Lucía'  },
  { id: 'st-3', name: 'Sergio' },
  { id: 'st-4', name: 'Paula'  },
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
function generateWeekAppointments() {
  const days = ['2025-08-18','2025-08-19','2025-08-20','2025-08-21','2025-08-22']; // L-V
  const blocks = [
    { start: '08:00', end: '14:00' },
    { start: '15:00', end: '19:00' },
  ];

  // malla base de 15 minutos
  const slotBaseMinutes = 15;
  const minSlots = 2;   // 2*15 = 30 min
  const maxSlots = 6;   // 6*15 = 90 min (1h30)

  // semilla determinista para “aleatorio”
  let seed = 42;
  const rand = () => (seed = (seed * 1664525 + 1013904223) % 2**32) / 2**32;

  const staffIds = ['st-1','st-2','st-3','st-4'];
  const calIds   = ['cal-1','cal-2','cal-3'];

  const titlesByCal = {
    'cal-1': ['Corte - Juan','Corte - Marta','Corte - Luis','Corte - Ana','Corte - Sofía','Corte - Leo'],
    'cal-2': ['Barba - Pedro','Barba - Álvaro','Barba - Hugo','Barba - Nico'],
    'cal-3': ['Color - Laura','Color - Sara','Color - Paula','Color - Irene','Color - Eva'],
  };

  const out = [];
  let counter = 1;

  const toIso = (d, hh, mm) => `${d}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`;

  for (let di = 0; di < days.length; di++) {
    const day = days[di];

    for (const block of blocks) {
      const [sH,sM] = block.start.split(':').map(Number);
      const [eH,eM] = block.end.split(':').map(Number);
      const blockStart = sH*60 + sM;
      const blockEnd   = eH*60 + eM;

      // total de slots de 15 min en el bloque
      const totalSlots = Math.floor((blockEnd - blockStart) / slotBaseMinutes);

      // deja 2 huecos “libres” pseudo-aleatorios por bloque
      const gaps = new Set();
      for (let g = 0; g < 2; g++) {
        gaps.add(Math.floor(rand() * totalSlots));
      }

      for (let slotIdx = 0; slotIdx < totalSlots; slotIdx++) {
        if (gaps.has(slotIdx)) continue; // dejamos un hueco

        // concurrencia 1..4 alternando y variando por día
        const concurrency = 1 + ((slotIdx + di) % 4);
        const selectedStaff = staffIds.slice(0, concurrency);

        // hora de inicio en minutos
        const startMinutes = blockStart + slotIdx * slotBaseMinutes;

        // elegimos duración en múltiplos de 15 (entre 30 y 90 min)
        const durSlots = Math.floor(rand() * (maxSlots - minSlots + 1)) + minSlots;
        let endMinutes = startMinutes + durSlots * slotBaseMinutes;

        // no pasar del final del bloque; si se pasa, se recorta al borde (sigue múltiplo de 15)
        if (endMinutes > blockEnd) endMinutes = blockEnd;

        const sh = Math.floor(startMinutes/60), sm = startMinutes%60;
        const eh = Math.floor(endMinutes/60),   em = endMinutes%60;

        const startIso = toIso(day, sh, sm);
        const endIso   = toIso(day, eh, em);

        for (let si = 0; si < selectedStaff.length; si++) {
          const staffId = selectedStaff[(si + di) % staffIds.length];
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
