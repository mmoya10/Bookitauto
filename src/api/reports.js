// src/api/reports.js
import { addDays, eachDayOfInterval, endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from "date-fns";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dfmt = (d) => format(d, "yyyy-MM-dd");

// ===== Catálogos (mock) =====
const categories = [
  { id: "cat-1", name: "Corte" },
  { id: "cat-2", name: "Color" },
  { id: "cat-3", name: "Uñas" },
];

const calendars = [
  { id: "cal-1", name: "Cortes" , categoryId: "cat-1" },
  { id: "cal-2", name: "Color Básico", categoryId: "cat-2" },
  { id: "cal-3", name: "Color Avanzado", categoryId: "cat-2" },
  { id: "cal-4", name: "Uñas Gel", categoryId: "cat-3" },
  { id: "cal-5", name: "Barber" , categoryId: "cat-1" },
];

const staff = [
  { id: "st-1", name: "Marcos" },
  { id: "st-2", name: "Lucía" },
  { id: "st-3", name: "Ana" },
  { id: "st-4", name: "Pedro" },
  { id: "st-5", name: "Sofía" },
  { id: "st-6", name: "Javi" },
];

// ===== Datos simulados base =====
/**
 * appointments: cita u ausencia por día/hora
 * {
 *   id, date:'YYYY-MM-DD', type:'appointment'|'absence',
 *   paid:'online'|'store'|'none', firstVisit:boolean,
 *   staffId, calendarId, categoryId, amount (si cita)
 * }
 */
let appointments = [];
let cashMovs = []; // ingresos/gastos
let stockMovs = []; // qty por producto categ (simple)
let users = []; // {id, firstSeen: ISO, lastSeen: ISO}

(function seed() {
  const today = new Date("2025-08-20T10:00:00Z");
  const from = subMonths(today, 6);
  let id = 1, cid = 1, uid = 1;

  const days = eachDayOfInterval({ start: from, end: today });
  for (const d of days) {
    // Citas del día (laborables más actividad)
    const weekday = d.getUTCDay(); // 0=Dom
    const base = [1,2,3,4,5].includes(weekday) ? 8 : weekday === 6 ? 5 : 2;
    const count = base + Math.floor(Math.random() * 5); // 8-12 laborables, 5-9 sáb, 2-6 dom

    for (let i = 0; i < count; i++) {
      const cal = calendars[Math.floor(Math.random() * calendars.length)];
      const st = staff[Math.floor(Math.random() * staff.length)];
      const type = Math.random() < 0.12 ? "absence" : "appointment"; // ~12% ausencias
      const paid = type === "absence" ? "none" : Math.random() < 0.35 ? "online" : "store";
      const amount = type === "appointment" ? (20 + Math.floor(Math.random() * 50)) : 0;
      appointments.push({
        id: `a-${id++}`,
        date: dfmt(d),
        type,
        paid,
        firstVisit: Math.random() < 0.18,
        staffId: st.id,
        calendarId: cal.id,
        categoryId: cal.categoryId,
        amount,
      });

      if (type === "appointment") {
        cashMovs.push({
          id: `c-${cid++}`,
          date: dfmt(d),
          kind: "ingreso",
          amount,
          source: paid, // online / store
        });
      }
    }

    // Gastos fijos variables
    if (Math.random() < 0.45) {
      const g = 10 + Math.floor(Math.random() * 50);
      cashMovs.push({ id: `c-${cid++}`, date: dfmt(d), kind: "gasto", amount: g, source: "compra" });
    }

    // Movs de stock simplificados
    stockMovs.push({
      id: `s-${cid++}`, date: dfmt(d),
      inQty: Math.floor(Math.random() * 5), outQty: Math.floor(Math.random() * 7)
    });

    // Usuarios “nuevos” y actividad
    if (Math.random() < 0.2) {
      const created = dfmt(d);
      users.push({ id: `u-${uid++}`, firstSeen: created, lastSeen: created });
    }
    // algunos usuarios repiten
    if (users.length && Math.random() < 0.35) {
      const u = users[Math.floor(Math.random() * users.length)];
      u.lastSeen = dfmt(d);
    }
  }
})();

// ===== Helpers =====
function parseRange({ start, end }) {
  const s = start ? new Date(start) : startOfMonth(new Date());
  const e = end ? new Date(end) : endOfMonth(new Date());
  return { s, e };
}
function within(d, s, e) {
  const dt = new Date(d + "T00:00:00Z");
  return isWithinInterval(dt, { start: s, end: e });
}
function groupBy(arr, key) {
  return arr.reduce((acc, it) => {
    const k = typeof key === "function" ? key(it) : it[key];
    acc[k] = acc[k] || [];
    acc[k].push(it);
    return acc;
  }, {});
}
function daysSeries(s, e) {
  return eachDayOfInterval({ start: s, end: e }).map((d) => dfmt(d));
}

// ===== API: opciones de filtro =====
export async function fetchReportOptions() {
  await sleep(50);
  return {
    calendars: calendars.map((c) => ({ id: c.id, name: c.name, categoryId: c.categoryId })),
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    staff: staff.map((s) => ({ id: s.id, name: s.name })),
  };
}

// ===== API: Calendarios =====
export async function fetchCalendarReport({ start, end, calendarIds, staffIds, categoryIds } = {}) {
  await sleep(120);
  const { s, e } = parseRange({ start, end });

  let rows = appointments.filter((a) => within(a.date, s, e));
  if (calendarIds?.length) rows = rows.filter((a) => calendarIds.includes(a.calendarId));
  if (staffIds?.length) rows = rows.filter((a) => staffIds.includes(a.staffId));
  if (categoryIds?.length) rows = rows.filter((a) => categoryIds.includes(a.categoryId));

  // periodo previo para % vs mes anterior (misma longitud)
  const daysCount = eachDayOfInterval({ start: s, end: e }).length;
  const prevStart = addDays(s, -daysCount);
  const prevEnd = addDays(e, -daysCount);
  const prev = appointments.filter((a) => within(a.date, prevStart, prevEnd));

  const total = rows.filter((r) => r.type === "appointment").length;
  const online = rows.filter((r) => r.type === "appointment" && r.paid === "online").length;
  const store = rows.filter((r) => r.type === "appointment" && r.paid === "store").length;
  const absences = rows.filter((r) => r.type === "absence").length;
  const firsts = rows.filter((r) => r.firstVisit && r.type === "appointment").length;

  const prevTotal = prev.filter((r) => r.type === "appointment").length;
  const vsPrev = prevTotal === 0 ? 0 : Math.round(((total - prevTotal) / prevTotal) * 100);

  const seriesDays = daysSeries(s, e).map((d) => {
    const dayRows = rows.filter((r) => r.date === d);
    return {
      date: d.slice(5), // MM-DD
      citas: dayRows.filter((r) => r.type === "appointment").length,
      online: dayRows.filter((r) => r.type === "appointment" && r.paid === "online").length,
      tienda: dayRows.filter((r) => r.type === "appointment" && r.paid === "store").length,
      ausencias: dayRows.filter((r) => r.type === "absence").length,
    };
  });

  const byStaff = Object.entries(groupBy(rows.filter(r=>r.type==="appointment"), "staffId"))
    .map(([k, list]) => ({ name: (staff.find(s=>s.id===k)?.name)||k, citas: list.length }));

  const byCalendar = Object.entries(groupBy(rows.filter(r=>r.type==="appointment"), "calendarId"))
    .map(([k, list]) => ({ name: (calendars.find(c=>c.id===k)?.name)||k, citas: list.length }));

  const byCategory = Object.entries(groupBy(rows.filter(r=>r.type==="appointment"), "categoryId"))
    .map(([k, list]) => ({ name: (categories.find(c=>c.id===k)?.name)||k, citas: list.length }));

  return {
    summary: { total, online, store, absences, firsts, vsPrev },
    seriesDays,
    byStaff,
    byCalendar,
    byCategory,
  };
}

// ===== API: Caja (ingresos/gastos) =====
export async function fetchCashReport({ start, end } = {}) {
  await sleep(100);
  const { s, e } = parseRange({ start, end });
  const rows = cashMovs.filter((m) => within(m.date, s, e));
  const series = daysSeries(s, e).map((d) => {
    const day = rows.filter((r) => r.date === d);
    const ingresos = day.filter((x) => x.kind === "ingreso").reduce((a, b) => a + b.amount, 0);
    const gastos = day.filter((x) => x.kind === "gasto").reduce((a, b) => a + b.amount, 0);
    return { date: d.slice(5), ingresos, gastos, neto: ingresos - gastos };
  });
  const totalIngresos = series.reduce((a,b)=>a+b.ingresos,0);
  const totalGastos = series.reduce((a,b)=>a+b.gastos,0);
  return { series, totalIngresos, totalGastos, neto: totalIngresos - totalGastos };
}

// ===== API: Stock =====
export async function fetchStockReport({ start, end } = {}) {
  await sleep(80);
  const { s, e } = parseRange({ start, end });
  const rows = stockMovs.filter((m) => within(m.date, s, e));
  const series = daysSeries(s, e).map((d) => {
    const day = rows.filter((r) => r.date === d);
    const entradas = day.reduce((a,b)=>a + (b.inQty||0), 0);
    const salidas = day.reduce((a,b)=>a + (b.outQty||0), 0);
    return { date: d.slice(5), entradas, salidas };
  });
  // top “productos” abstracto por categorías (mock simple)
  const top = categories.map((c)=>({
    name: c.name,
    movs: Math.floor(Math.random()*120)+30
  }));
  return { series, top };
}

// ===== API: Personal =====
export async function fetchStaffReport({ start, end } = {}) {
  await sleep(90);
  const { s, e } = parseRange({ start, end });
  const rows = appointments.filter((a)=> within(a.date, s, e));
  const byStaff = Object.entries(groupBy(rows, "staffId")).map(([k, list])=>({
    name: (staff.find(x=>x.id===k)?.name)||k,
    citas: list.filter(x=>x.type==="appointment").length,
    ausencias: list.filter(x=>x.type==="absence").length,
    online: list.filter(x=>x.type==="appointment" && x.paid==="online").length,
    tienda: list.filter(x=>x.type==="appointment" && x.paid==="store").length,
  }));
  return { byStaff };
}

// ===== API: Usuarios =====
export async function fetchUsersReport({ start, end } = {}) {
  await sleep(70);
  const { s, e } = parseRange({ start, end });
  const series = daysSeries(s, e).map((d)=>{
    const news = users.filter(u=> u.firstSeen===d).length;
    const actives = users.filter(u=> u.lastSeen===d).length;
    return { date: d.slice(5), nuevos: news, activos: actives };
  });
  const nuevosMes = users.filter(u=> within(u.firstSeen, s, e)).length;
  const activosMes = users.filter(u=> within(u.lastSeen, s, e)).length;
  return { series, nuevosMes, activosMes };
}

// ===== API: Ingresos/Gastos (resumen P&L) =====
export async function fetchIncomeExpenseReport({ start, end } = {}) {
  await sleep(80);
  const c = await fetchCashReport({ start, end });
  return c; // mismo formato: series + totals
}
