// src/api/calendars.js
// Mock unificado: catálogos (categorías/calendarios/staff/sites) + citas/ausencias

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));
const rid = () => Math.random().toString(36).slice(2, 10);

/* ================= Catálogos ================= */

let memCategories = [
  { id: "cat_cut", name: "Cortes" },
  { id: "cat_color", name: "Color" },
  { id: "cat_spa", name: "Spa" },
];

let memStaff = [
  {
    id: "stf_1",
    name: "Laura",
    imageUrl: "https://placehold.co/200x140?text=Laura",
    bio: "Especialista en color y tratamientos.",
    color: "#820096",
  },
  {
    id: "stf_2",
    name: "Carlos",
    imageUrl: "https://placehold.co/200x140?text=Carlos",
    bio: "Cortes modernos y barbería.",
    color: "#965F00",
  },
  {
    id: "stf_3",
    name: "Julia",
    imageUrl: "https://placehold.co/200x140?text=Julia",
    bio: "Spa y cuidado facial.",
    color: "#000D96",
  },
];

let memCalendars = [
  // ==== CORTES ====
  {
    id: "cal_cut_1",
    type: "main",
    name: "Corte Premium",
    description: "Corte con asesoría personalizada",
    imageUrl:
      "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWYyZjBiNzU4ODE5MTkyNzdlNGVjNjE1OGZkMzU6ZmlsZV8wMDAwMDAwMDI4MDA2MjJmOGVjMmFhYjFhMzUyZWEzYSIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6ImE3MDg2OGI1ZTQzYzJkOGI3ODY2NWE1NmY4MmNmMTUzYjc1ZTg3ZDRjNzgwMzQ5Nzc2MzM1YTk2ODI3N2NjYWQiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    categoryId: "cat_cut",
    price: 24.9,
    duration: 45,
    bufferBefore: 5,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_1", "cal_extra_2"],
    staffIds: ["stf_1", "stf_2"],
    status: "active",
  },
  {
    id: "cal_cut_2",
    type: "main",
    name: "Corte Infantil",
    description: "Corte para niños hasta 12 años",
    imageUrl:
      "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWYzMmZlMzk4ODE5MWIzOTY2Y2M1YWY5MzFjOGQ6ZmlsZV8wMDAwMDAwMGMxOGM2MjJmOTA1OGI5YjllNDUwNjY3YyIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6ImJlMzFjMjBkNGE4ZjVhNDc3MmU5MDliZDUzMTNkYjAwODI0MTczYzEyZGMwMjkzYTY2YTY4MTcwNjViOGNmMWQiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    categoryId: "cat_cut",
    price: 14.9,
    duration: 30,
    bufferBefore: 0,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_1"],
    staffIds: ["stf_1", "stf_3"],
    status: "active",
  },
  {
    id: "cal_cut_3",
    type: "main",
    name: "Corte Caballero",
    description: "Clásico o moderno",
    imageUrl:
      "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWYzYjc3MmU0ODE5MWE1Y2E3NTkzYzM4NGUxYTM6ZmlsZV8wMDAwMDAwMGQ0MTQ2MWZkYmU5NWMwZWU5OTIzMjc3YSIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6IjU3M2I3YjlmMmY1YmQxZDU1NjY4ZGY1MGQyOTA0OGMzYjhmOTcwOTA3ZjU5ZjZjZDkwNDAwYTUwNGViOWYyZGMiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    categoryId: "cat_cut",
    price: 19.9,
    duration: 40,
    bufferBefore: 0,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_2"],
    staffIds: ["stf_2"],
    status: "active",
  },
  {
    id: "cal_cut_4",
    type: "main",
    name: "Corte Señora",
    description: "Incluye lavado y peinado básico",
    imageUrl:
      "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWY0MTIxMWQ0ODE5MWI4M2EzZmNiMmJhMjFlNWI6ZmlsZV8wMDAwMDAwMGU0ZjQ2MWY3YjZjNDQ1ZjAyNDU3ZWNkMSIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6IjE5YmY4NWY2M2JjNDY4ZjBkODQ5ZTU0MGEwNTY1NWQ3MTQ3Yjg0Nzc5NmNjYzJmNDQ3M2JhYWUxNGQ2ODIyOTUiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    categoryId: "cat_cut",
    price: 29.9,
    duration: 50,
    bufferBefore: 5,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_1", "cal_extra_2"],
    staffIds: ["stf_1", "stf_2", "stf_3"],
    status: "active",
  },

  // ==== COLOR ====
  {
    id: "cal_color_1",
    type: "main",
    name: "Coloración Raíz",
    description: "Color solo en raíz",
    imageUrl: "https://placehold.co/640x360?text=Color+Raiz",
    categoryId: "cat_color",
    price: 39.9,
    duration: 60,
    bufferBefore: 0,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_3"],
    staffIds: ["stf_2", "stf_3"],
    status: "active",
  },
  {
    id: "cal_color_2",
    type: "main",
    name: "Color Completo",
    description: "Color uniforme en todo el cabello",
    imageUrl: "https://placehold.co/640x360?text=Color+Completo",
    categoryId: "cat_color",
    price: 54.9,
    duration: 90,
    bufferBefore: 10,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_3"],
    staffIds: ["stf_1", "stf_3"],
    status: "active",
  },
  {
    id: "cal_color_3",
    type: "main",
    name: "Mechas Babylights",
    description: "Mechas finas y naturales",
    imageUrl: "https://placehold.co/640x360?text=Mechas+Babylights",
    categoryId: "cat_color",
    price: 89.0,
    duration: 120,
    bufferBefore: 10,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_3"],
    staffIds: ["stf_2"],
    status: "active",
  },
  {
    id: "cal_color_4",
    type: "main",
    name: "Balayage",
    description: "Degradado natural",
    imageUrl: "https://placehold.co/640x360?text=Balayage",
    categoryId: "cat_color",
    price: 99.0,
    duration: 150,
    bufferBefore: 15,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_3"],
    staffIds: ["stf_1", "stf_2"],
    status: "active",
  },

  // ==== SPA ====
  {
    id: "cal_spa_1",
    type: "main",
    name: "Masaje Relajante",
    description: "Masaje de cuerpo completo",
    imageUrl: "https://placehold.co/640x360?text=Masaje+Relajante",
    categoryId: "cat_spa",
    price: 49.9,
    duration: 60,
    bufferBefore: 5,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_4"],
    staffIds: ["stf_3"],
    status: "active",
  },
  {
    id: "cal_spa_2",
    type: "main",
    name: "Masaje Descontracturante",
    description: "Masaje terapéutico",
    imageUrl: "https://placehold.co/640x360?text=Masaje+Descontracturante",
    categoryId: "cat_spa",
    price: 59.9,
    duration: 70,
    bufferBefore: 5,
    bufferAfter: 10,
    extrasSupported: ["cal_extra_4"],
    staffIds: ["stf_2"],
    status: "active",
  },
  {
    id: "cal_spa_3",
    type: "main",
    name: "Tratamiento Facial",
    description: "Limpieza profunda e hidratación",
    imageUrl: "https://placehold.co/640x360?text=Facial",
    categoryId: "cat_spa",
    price: 39.9,
    duration: 50,
    bufferBefore: 5,
    bufferAfter: 5,
    extrasSupported: ["cal_extra_3", "cal_extra_4"],
    staffIds: ["stf_1", "stf_3"],
    status: "active",
  },
  {
    id: "cal_spa_4",
    type: "main",
    name: "Circuito Spa",
    description: "Sauna + jacuzzi + ducha sensorial",
    imageUrl: "https://placehold.co/640x360?text=Circuito+Spa",
    categoryId: "cat_spa",
    price: 69.9,
    duration: 120,
    bufferBefore: 15,
    bufferAfter: 15,
    extrasSupported: ["cal_extra_4"],
    staffIds: ["stf_1", "stf_2"],
    status: "active",
  },

  // ==== EXTRAS ====
  {
    id: "cal_extra_1",
    type: "extra",
    name: "Lavado",
    description: "Lavado básico",
    imageUrl:
      "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWZhMDUzNDQwODE5MTg5NmQ5YjkwYjM4OTVhMWY6ZmlsZV8wMDAwMDAwMDg5OTA2MjQzODYwNDIxNzFiNWQyNzVjNCIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6Ijg0NzkwMTUxZThhMTQyOTgyMDI2Y2QxMDM0MTIzZWQwODI5Y2Q0ODgzYjI5ZWQxMDAzNTI1YTBjMmRlNWMyNzMiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    price: 4.5,
    duration: 10,
    staffIds: [],
    status: "active",
  },
  {
    id: "cal_extra_2",
    type: "extra",
    name: "Peinado Exprés",
    description: "Secado y peinado rápido",
    imageUrl:
      "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWZhMjQ2ODIwODE5MTk1YTUxOTdkMjQ4ZDZkMGM6ZmlsZV8wMDAwMDAwMGU4NDQ2MjQzOTQzMGRmNmJkMDAxYjFkZSIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6IjY3ZmY0OWMwZmI1NTBiN2JjY2Y3ODFkMzUzMzcwODIwYWYwZGM3ZDczNDZkNGJiYTg0YzUzYzE5OWM4YTk2YTgiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    price: 7.9,
    duration: 15,
    staffIds: [],
    status: "active",
  },
  {
    id: "cal_extra_3",
    type: "extra",
    name: "Tratamiento Hidratante",
    description: "Mascarilla y masaje",
    imageUrl:
      "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWZhYTk3ZDM0ODE5MWE5MDA2ZmZjN2Y1Nzk5ZjY6ZmlsZV8wMDAwMDAwMGJhOTA2MjQzYjY2Y2Q2MTE4MTI5YTE0MyIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6ImQzNTgyMzZiYzhmODY0NTRiYjE5NmM5YjcxNTA3ZGVhZjk0YzlkYWQwNTI3Nzk2MmE0YTA4MTQ3YTIzNDA0ZDEiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    price: 9.9,
    duration: 20,
    staffIds: [],
    status: "active",
  },
  {
    id: "cal_extra_4",
    type: "extra",
    name: "Masaje de pies",
    description: "Relajación extra al final del servicio",
    imageUrl:
      "https://chatgpt.com/backend-api/public_content/enc/eyJpZCI6Im1fNjhhYWZiYzhhNWFjODE5MTk5MzE5NDAwYjY0M2E2MTY6ZmlsZV8wMDAwMDAwMGYxZTg2MjQzODZmZDhhODMwNTlhNTk1YiIsInRzIjoiNDg3Nzg3IiwicCI6InB5aSIsInNpZyI6ImEwMDI2OGI2ZjBkNzk0YjQzNGE1ZjM1MTcyMDY4MGNiYWMzZjU3NzczNThiYjI3YWYyZjg2NzYwY2ZhYzE5OTYiLCJ2IjoiMCIsImdpem1vX2lkIjpudWxsfQ==",
    price: 12.9,
    duration: 15,
    staffIds: [],
    status: "active",
  },
];

let memBookingSites = [
  {
    id: "site_main",
    name: "Sitio Web Principal",
    categoryIds: memCategories.map((c) => c.id),
    calendarIds: memCalendars.map((c) => c.id),
  },
  {
    id: "site_spa",
    name: "Landing Spa",
    categoryIds: ["cat_spa"],
    calendarIds: memCalendars
      .filter((c) => c.categoryId === "cat_spa" || c.type === "extra")
      .map((c) => c.id),
  },
];
let activeBookingSiteId = memBookingSites[0]?.id || null;

/* ============ Horario negocio / festivos (compat) ============ */

let businessHours = [
  { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "14:00" },
  { daysOfWeek: [1, 2, 3, 4, 5], startTime: "15:00", endTime: "19:00" },
];
let holidays = [
  {
    start: "2025-12-25",
    end: "2025-12-26",
    title: "Navidad",
    display: "background",
  },
  {
    start: "2026-01-01",
    end: "2026-01-02",
    title: "Año Nuevo",
    display: "background",
  },
];

// ====== Reglas de negocio citas ======
const MIN_APT_MIN = 30;
const MAX_APT_MIN = 90;

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const minutesOfDay = (d) => d.getHours() * 60 + d.getMinutes();
// Lunes=1 ... Domingo=7 (como FullCalendar)
const isoDow = (date) => ((date.getDay() + 6) % 7) + 1;

function isWithinBusinessHours(startISO, endISO) {
  const ds = new Date(startISO);
  const de = new Date(endISO);

  // Debe ser el mismo día
  if (ds.toDateString() !== de.toDateString()) return false;

  const dow = isoDow(ds);
  const spans = businessHours
    .filter((b) => (b.daysOfWeek || []).includes(dow))
    .map((b) => ({ s: toMinutes(b.startTime), e: toMinutes(b.endTime) }));

  if (!spans.length) return false;

  const sMin = minutesOfDay(ds);
  const eMin = minutesOfDay(de);

  // Debe caber COMPLETO en alguno de los tramos de ese día
  return spans.some((sp) => sMin >= sp.s && eMin <= sp.e);
}

function durationMinutes(startISO, endISO) {
  return Math.round((new Date(endISO) - new Date(startISO)) / 60000);
}

function overlaps(aStartISO, aEndISO, bStartISO, bEndISO) {
  const aS = +new Date(aStartISO);
  const aE = +new Date(aEndISO);
  const bS = +new Date(bStartISO);
  const bE = +new Date(bEndISO);
  return aS < bE && aE > bS;
}

function hasStaffConflict(staffId, startISO, endISO, ignoreId = null) {
  if (!staffId) return false;
  return memAppointments.some(
    (a) =>
      a.id !== ignoreId &&
      a.staffId === staffId &&
      (a.type === "cita" || a.type === "ausencia") &&
      overlaps(a.start, a.end, startISO, endISO)
  );
}

/* ================= Modelo de Citas (nuevo) ====================

  Cita/Ausencia:
  {
    id: string
    user: { name, surname, email, phone } | null
    staffId: string | null
    calendarId: string | null
    extraIds: string[]           // ids de calendarios type: 'extra'
    totalPrice: number           // precio total calculado
    start: ISOString
    end: ISOString
    type: 'cita' | 'ausencia'
    notes: string
    status: 'pendiente' | 'no_presentado' | 'completado'
    payment: 'online' | 'tienda'
    tiendapago?: 'efectivo' | 'tarjeta' | null  // solo si payment === 'tienda'
    propina?: number                            // EUR, >= 0
  }

=============================================================== */

function iso(day, hh, mm) {
  return `${day}T${String(hh).padStart(2, "0")}:${String(mm).padStart(
    2,
    "0"
  )}:00`;
}

// === Generación de citas de prueba (semana actual; si sábado/domingo, también la siguiente) ===

// Lunes=1 ... Domingo=7
function startOfISOWeek(d) {
  const dt = new Date(d);
  const dow = (dt.getDay() + 6) % 7; // L=0..D=6
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() - dow);
  return dt;
}
function fmtYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function weekDaysFrom(mondayDate) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    out.push(fmtYMD(d));
  }
  return out;
}
function daysToGenerate() {
  const now = new Date();
  const monday = startOfISOWeek(now);
  const thisWeek = weekDaysFrom(monday);
  const isWeekend = now.getDay() === 6 || now.getDay() === 0; // Sábado(6) o Domingo(0)
  if (!isWeekend) return thisWeek;
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const nextWeek = weekDaysFrom(nextMonday);
  return [...thisWeek, ...nextWeek];
}

function genWeekCitas() {
  const mains = memCalendars.filter((c) => c.type === "main");
  const calMap = buildCalMap(memCalendars);

  const activeStaff = memStaff.map((s) => s.id);
  const days = daysToGenerate();
  const out = [];
  let n = 1;

  // Conflicto por mismo staff, mirando solo lo ya generado en "out"
  const hasStaffConflictLocal = (staffId, startISO, endISO) => {
    return out.some(
      (a) =>
        a.staffId === staffId &&
        (a.type === "cita" || a.type === "ausencia") &&
        overlaps(a.start, a.end, startISO, endISO)
    );
  };

  for (const day of days) {
    const d = new Date(`${day}T00:00:00`);
    const dow = isoDow(d); // 1..7
    const spans = businessHours
      .filter((b) => (b.daysOfWeek || []).includes(dow))
      .map((b) => ({ s: toMinutes(b.startTime), e: toMinutes(b.endTime) }));

    for (const sp of spans) {
      let minute = sp.s;

      while (minute + MIN_APT_MIN <= sp.e) {
        // De vez en cuando dejamos huecos
        if (Math.random() < 0.22) {
          minute += 15;
          continue;
        }

        // Servicio principal
        const main = chooseOne(mains);

        // Duración forzada entre 30-90
        const baseDur = Number(main.duration || 30);
        const dur = Math.max(MIN_APT_MIN, Math.min(MAX_APT_MIN, baseDur));

        // Si no cabe, cortamos tramo
        if (minute + dur > sp.e) break;

        // Staff aleatorio
        const staffId = chooseOne(activeStaff);

        // Extras soportados (0-2)
        const extrasPool = (main.extrasSupported || []).slice();
        const extraIds = [];
        if (extrasPool.length && Math.random() > 0.6) {
          const howMany = Math.min(2, 1 + (Math.random() > 0.7 ? 1 : 0));
          for (let i = 0; i < howMany && extrasPool.length; i++) {
            const idx = Math.floor(Math.random() * extrasPool.length);
            extraIds.push(extrasPool.splice(idx, 1)[0]);
          }
        }

        const priceMain = Number(calMap.get(main.id)?.price || 0);
        const priceExtras = sumExtrasPrice(extraIds, calMap);
        const totalPrice = +(priceMain + priceExtras).toFixed(2);

        const start = iso(day, Math.floor(minute / 60), minute % 60);
        const endMin = minute + dur;
        const end = iso(day, Math.floor(endMin / 60), endMin % 60);

        // Validación estricta
        if (!isWithinBusinessHours(start, end)) {
          minute += 15;
          continue;
        }
        // Evitar solape por mismo staff
        if (hasStaffConflictLocal(staffId, start, end)) {
          minute += 15;
          continue;
        }

        // Pasado vs futuro -> status & payment
        const now = new Date();
        const isPast = new Date(end) <= now;

        let status,
          payment,
          tiendapago = null;
        if (isPast) {
          status = Math.random() < 0.5 ? "completado" : "no_presentado";
          payment = Math.random() < 0.5 ? "online" : "tienda";
          // Si no se presentó y pago en tienda => tiendapago vacío (null)
          if (status === "no_presentado" && payment === "tienda") {
            tiendapago = null;
          } else if (payment === "tienda") {
            tiendapago = Math.random() < 0.5 ? "efectivo" : "tarjeta";
          }
        } else {
          status = "pendiente";
          payment = Math.random() < 0.5 ? "online" : "tienda";
          tiendapago = null; // Futuro: nada en tiendapago
        }

        // Cita 1
        out.push({
          id: `apt_${n++}`,
          user: {
            name: "Cliente",
            surname: `#${n}`,
            email: `c${n}@demo.com`,
            phone: "600000000",
          },
          staffId,
          calendarId: main.id,
          extraIds,
          totalPrice,
          start,
          end,
          type: "cita",
          notes: "",
          status,
          payment,
          tiendapago,
        });

        // Opción: crear una segunda cita en el MISMO slot con OTRO staff (permitido)
        if (Math.random() < 0.35) {
          const otherStaff = activeStaff.filter((s) => s !== staffId);
          if (otherStaff.length) {
            const s2 = chooseOne(otherStaff);

            if (
              isWithinBusinessHours(start, end) &&
              !hasStaffConflictLocal(s2, start, end)
            ) {
              // Misma lógica de estado/pagos
              let st2 = status;
              let pay2 = payment;
              let tienda2 = tiendapago;

              // Recalcular estado/pagos para dar variedad
              if (isPast) {
                st2 = Math.random() < 0.5 ? "completado" : "no_presentado";
                pay2 = Math.random() < 0.5 ? "online" : "tienda";
                if (st2 === "no_presentado" && pay2 === "tienda") {
                  tienda2 = null;
                } else if (pay2 === "tienda") {
                  tienda2 = Math.random() < 0.5 ? "efectivo" : "tarjeta";
                } else {
                  tienda2 = null;
                }
              } else {
                st2 = "pendiente";
                pay2 = Math.random() < 0.5 ? "online" : "tienda";
                tienda2 = null;
              }

              out.push({
                id: `apt_${n++}`,
                user: {
                  name: "Cliente",
                  surname: `#${n}`,
                  email: `c${n}@demo.com`,
                  phone: "600000000",
                },
                staffId: s2,
                calendarId: main.id,
                extraIds,
                totalPrice,
                start,
                end,
                type: "cita",
                notes: "",
                status: st2,
                payment: pay2,
                tiendapago: tienda2,
              });
            }
          }
        }

        // Avanzamos cursor con pequeño hueco aleatorio
        minute = endMin + (Math.random() < 0.3 ? 15 : 0);
      }
    }
  }

  return out;
}

let memAppointments = genWeekCitas();

/* ======================== Fetch (catálogos) ======================== */

export async function fetchCategories() {
  await delay();
  return structuredClone(memCategories);
}
export async function fetchStaff() {
  await delay();
  return structuredClone(memStaff);
}
export async function fetchCalendars({
  q = "",
  categoryIds = [],
  staffIds = [],
  types = [],
  calendarIds = [],
} = {}) {
  await delay();
  const norm = (s) => (s || "").toLowerCase();
  const nq = norm(q);
  let list = [...memCalendars];

  if (nq)
    list = list.filter(
      (c) => norm(c.name).includes(nq) || norm(c.description).includes(nq)
    );
  if (categoryIds?.length)
    list = list.filter(
      (c) => !c.categoryId || categoryIds.includes(c.categoryId)
    );
  if (staffIds?.length)
    list = list.filter(
      (c) =>
        !c.staffIds?.length || c.staffIds.some((id) => staffIds.includes(id))
    );
  if (types?.length) list = list.filter((c) => types.includes(c.type)); // 'main' | 'extra'
  if (calendarIds?.length)
    list = list.filter((c) => calendarIds.includes(c.id));

  return structuredClone(list);
}

/* ==================== CRUD Calendarios ==================== */
// === Helpers para evitar callbacks dentro de bucles ===
function chooseOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildCalMap(list) {
  // Mapa id -> calendario para O(1)
  return new Map(list.map((c) => [c.id, c]));
}

function sumExtrasPrice(extraIds, calMap) {
  let total = 0;
  for (const id of extraIds) {
    const ex = calMap.get(id);
    if (ex && ex.price != null) total += Number(ex.price) || 0;
  }
  return total;
}

export async function createCalendar(payload) {
  await delay();
  const id = rid();
  const base = {
    id,
    type: payload.type, // 'main' | 'extra'
    name: payload.name?.trim() || "Sin nombre",
    description: payload.description || "",
    imageUrl: payload.imageUrl || "",
    status: payload.status || "active",
    staffIds: payload.staffIds || [],
  };

  if (payload.type === "main") {
    memCalendars.push({
      ...base,
      categoryId: payload.categoryId || null,
      price: Number(payload.price ?? 0),
      duration: Number(payload.duration ?? 0),
      bufferBefore: Number(payload.bufferBefore ?? 0),
      bufferAfter: Number(payload.bufferAfter ?? 0),
      extrasSupported: payload.extrasSupported || [],
    });
  } else {
    memCalendars.push({
      ...base,
      price: payload.price != null ? Number(payload.price) : undefined,
      duration: payload.duration != null ? Number(payload.duration) : undefined,
    });
  }
  return structuredClone(memCalendars.find((c) => c.id === id));
}

export async function updateCalendar(payload) {
  await delay();
  const idx = memCalendars.findIndex((c) => c.id === payload.id);
  if (idx === -1) throw new Error("Calendario no encontrado");

  const prev = memCalendars[idx];
  const next = { ...prev, ...payload };

  if (next.type === "main") {
    next.price = Number(next.price ?? 0);
    next.duration = Number(next.duration ?? 0);
    next.bufferBefore = Number(next.bufferBefore ?? 0);
    next.bufferAfter = Number(next.bufferAfter ?? 0);
    next.extrasSupported = Array.isArray(next.extrasSupported)
      ? next.extrasSupported
      : [];
  } else {
    next.price = next.price != null ? Number(next.price) : undefined;
    next.duration = next.duration != null ? Number(next.duration) : undefined;
  }

  memCalendars[idx] = next;
  return structuredClone(next);
}

export async function deleteCalendars(ids) {
  await delay();
  memCalendars = memCalendars.filter((c) => !ids.includes(c.id));
  // limpiar referencias en booking sites
  memBookingSites = memBookingSites.map((s) => ({
    ...s,
    calendarIds: s.calendarIds.filter((id) => !ids.includes(id)),
  }));
  // y en citas (las marcamos sin calendarId)
  memAppointments = memAppointments.map((a) =>
    ids.includes(a.calendarId) ? { ...a, calendarId: null } : a
  );
  return { ok: true };
}

/* ================== Booking Sites (compat) ================== */

export async function fetchBookingSites() {
  await delay();
  return memBookingSites.map((b) => ({
    ...b,
    active: b.id === activeBookingSiteId,
  }));
}
export async function setActiveBookingSite({ id }) {
  await delay();
  activeBookingSiteId = id;
  return structuredClone(memBookingSites.find((s) => s.id === id));
}
export async function updateBookingSite({ id, categoryIds, calendarIds }) {
  await delay();
  const idx = memBookingSites.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Booking site no encontrado");
  memBookingSites[idx] = {
    ...memBookingSites[idx],
    categoryIds: Array.isArray(categoryIds)
      ? categoryIds
      : memBookingSites[idx].categoryIds,
    calendarIds: Array.isArray(calendarIds)
      ? calendarIds
      : memBookingSites[idx].calendarIds,
  };
  return structuredClone(memBookingSites[idx]);
}
export async function deleteBookingSite(id) {
  await delay();
  const idx = memBookingSites.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Booking site no encontrado");
  const removed = memBookingSites.splice(idx, 1)[0];
  if (removed?.id === activeBookingSiteId) {
    activeBookingSiteId = memBookingSites[0]?.id ?? null;
  }
  return { ok: true };
}

/* ================== Horas/ Festivos (compat) ================= */

export async function fetchBusinessHours() {
  await delay(80);
  return structuredClone(businessHours);
}
export async function fetchHolidays() {
  await delay(80);
  return structuredClone(holidays);
}

/* ===================== Citas / Ausencias ===================== */

// Filtro flexible
export async function fetchAppointments({
  start,
  end,
  calendarIds,
  staffIds,
  type,
  status,
  payment,
  tiendapago,
  tipMin,
  tipMax,
} = {}) {
  await delay(120);
  const inRange = (e) => (!start || e.end >= start) && (!end || e.start < end);
  const byCal = (e) =>
    !calendarIds?.length ||
    (e.calendarId && calendarIds.includes(e.calendarId));
  const byStaff = (e) =>
    !staffIds?.length || (e.staffId && staffIds.includes(e.staffId));
  const byType = (e) => !type || type === "ambos" || e.type === type;
  const byStatus = (e) => !status?.length || status.includes(e.status);
  const byPayment = (e) => !payment?.length || payment.includes(e.payment);
  const byStorePay = (e) =>
    !tiendapago?.length || tiendapago.includes(e.tiendapago || "");
  const byTip = (e) =>
    (tipMin == null || (e.propina ?? 0) >= tipMin) &&
    (tipMax == null || (e.propina ?? 0) <= tipMax);
  return memAppointments.filter(
    (e) =>
      inRange(e) &&
      byCal(e) &&
      byStaff(e) &&
      byType(e) &&
      byStatus(e) &&
      byPayment(e) &&
      byStorePay(e) &&
      byTip(e)
  );
}

// atajo compat si lo usabas separado
export async function fetchAbsences({ start, end, staffIds } = {}) {
  return fetchAppointments({ start, end, staffIds, type: "ausencia" });
}

// Crear cita/ausencia (payload con shape del modelo de arriba; calculamos total si falta)
export async function createAppointment(payload) {
  await delay(120);

  const start = payload.start;
  const end = payload.end;

  // 1) Validar duración
  const dur = durationMinutes(start, end);
  if (dur < MIN_APT_MIN || dur > MAX_APT_MIN) {
    throw new Error(
      `La cita debe durar entre ${MIN_APT_MIN} y ${MAX_APT_MIN} minutos.`
    );
  }

  // 2) Validar horario laboral
  if (!isWithinBusinessHours(start, end)) {
    throw new Error(
      "La cita no puede estar fuera del horario laboral del negocio."
    );
  }

  // 3) Conflictos con el mismo staff
  if (payload.staffId && hasStaffConflict(payload.staffId, start, end)) {
    throw new Error(
      "El staff seleccionado ya tiene otra cita/ausencia en ese intervalo."
    );
  }

  const id = rid();
  const base = {
    id,
    user: payload.user ?? null,
    staffId: payload.staffId ?? null,
    calendarId: payload.calendarId ?? null,
    extraIds: Array.isArray(payload.extraIds) ? payload.extraIds : [],
    start,
    end,
    type: payload.type || "cita",
    notes: payload.notes || "",
    status: payload.status || "pendiente",
    payment: payload.payment || "tienda",
    tiendapago: payload.tiendapago ?? null, // 'efectivo' | 'tarjeta' | null
    propina: Number(payload.propina ?? 0), // >= 0
  };

  // calcular total si no viene
  let total = payload.totalPrice;
  if (total == null) {
    const main = memCalendars.find((c) => c.id === base.calendarId);
    total = Number(main?.price || 0);
    for (const exId of base.extraIds) {
      const ex = memCalendars.find((c) => c.id === exId);
      total += Number(ex?.price || 0);
    }
  }
  base.totalPrice = +Number(total).toFixed(2);

  memAppointments.push(base);
  return structuredClone(base);
}

// Solo mover fechas
export async function updateAppointmentDates({ id, start, end }) {
  await delay(80);
  const i = memAppointments.findIndex((a) => a.id === id);
  if (i === -1) throw new Error("Cita no encontrada");

  // Validar duración
  const dur = durationMinutes(start, end);
  if (dur < MIN_APT_MIN || dur > MAX_APT_MIN) {
    throw new Error(
      `La cita debe durar entre ${MIN_APT_MIN} y ${MAX_APT_MIN} minutos.`
    );
  }

  // Validar horario laboral
  if (!isWithinBusinessHours(start, end)) {
    throw new Error(
      "La cita no puede estar fuera del horario laboral del negocio."
    );
  }

  // Conflictos mismo staff
  const staffId = memAppointments[i].staffId;
  if (staffId && hasStaffConflict(staffId, start, end, id)) {
    throw new Error(
      "El staff seleccionado ya tiene otra cita/ausencia en ese intervalo."
    );
  }

  memAppointments[i] = { ...memAppointments[i], start, end };
  return structuredClone(memAppointments[i]);
}

// Actualización general
export async function updateAppointment(payload) {
  await delay(120);
  const i = memAppointments.findIndex((a) => a.id === payload.id);
  if (i === -1) throw new Error("Cita no encontrada");
  const prev = memAppointments[i];

  // Determinar nuevos valores provisionales
  const nextStart = payload.start ?? prev.start;
  const nextEnd = payload.end ?? prev.end;
  const nextStaff = payload.staffId ?? prev.staffId;

  // Si se tocan fechas o staff, validar
  if (payload.start != null || payload.end != null || payload.staffId != null) {
    const dur = durationMinutes(nextStart, nextEnd);
    if (dur < MIN_APT_MIN || dur > MAX_APT_MIN) {
      throw new Error(
        `La cita debe durar entre ${MIN_APT_MIN} y ${MAX_APT_MIN} minutos.`
      );
    }
    if (!isWithinBusinessHours(nextStart, nextEnd)) {
      throw new Error(
        "La cita no puede estar fuera del horario laboral del negocio."
      );
    }
    if (nextStaff && hasStaffConflict(nextStaff, nextStart, nextEnd, prev.id)) {
      throw new Error(
        "El staff seleccionado ya tiene otra cita/ausencia en ese intervalo."
      );
    }
  }

  // Recalcular total si cambian calendario/extras o si lo mandas explícito
  let nextTotal = payload.totalPrice ?? prev.totalPrice;
  if (payload.calendarId != null || payload.extraIds != null) {
    const calId = payload.calendarId ?? prev.calendarId;
    const extraIds = payload.extraIds ?? prev.extraIds;
    const main = memCalendars.find((c) => c.id === calId);
    let tot = Number(main?.price || 0);
    for (const exId of extraIds) {
      const ex = memCalendars.find((c) => c.id === exId);
      tot += Number(ex?.price || 0);
    }
    nextTotal = +tot.toFixed(2);
  }

  memAppointments[i] = {
    ...prev,
    ...payload,
    start: nextStart,
    end: nextEnd,
    staffId: nextStaff,
    totalPrice: +Number(nextTotal).toFixed(2),
    // normalizamos nuevos campos si vienen
    tiendapago: payload.tiendapago ?? prev.tiendapago ?? null,
    propina:
      payload.propina != null ? Number(payload.propina) : prev.propina ?? 0,
  };
  return structuredClone(memAppointments[i]);
}

export async function deleteAppointment(id) {
  await delay(80);
  memAppointments = memAppointments.filter((a) => a.id !== id);
  return { ok: true };
}
