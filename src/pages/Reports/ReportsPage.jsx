import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  fetchReportOptions,
  fetchCalendarReport,
  fetchCashReport,
  fetchStockReport,
  fetchStaffReport,
  fetchUsersReport,
  fetchIncomeExpenseReport,
} from "../../api/reports";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { startOfMonth, endOfMonth } from "date-fns";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

const tabs = [
  { key: "cal", label: "Calendarios" },
  { key: "cash", label: "Caja" },
  { key: "stock", label: "Stock" },
  { key: "staff", label: "Personal" },
  { key: "users", label: "Usuarios" },
  { key: "pnl", label: "Ingresos/Gastos" },
];

/* ===== Gradientes para columnas ===== */
function ChartGradients() {
  return (
    <defs>
      <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="gradRose" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb7185" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#fda4af" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#34d399" stopOpacity="0.75" />
      </linearGradient>
    </defs>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState("cal");

  // rango por defecto: mes actual
  const [from, setFrom] = useState(() => toInputDate(startOfMonth(new Date())));
  const [to, setTo] = useState(() => toInputDate(endOfMonth(new Date())));

  // opciones catálogos (para Calendarios)
  const { data: opts } = useQuery({ queryKey: ["report-opts"], queryFn: fetchReportOptions });

  // filtros multi (calendarios / categorías / personal)
  const [selCals, setSelCals] = useState([]);
  const [selCats, setSelCats] = useState([]);
  const [selStaff, setSelStaff] = useState([]);

  // cuando llegan opciones, marcamos todo por defecto
  useEffect(() => {
    if (opts) {
      setSelCals(opts.calendars.map((x) => x.id));
      setSelCats(opts.categories.map((x) => x.id));
      setSelStaff(opts.staff.map((x) => x.id));
    }
  }, [opts]);

  // ====== DATA QUERIES POR TAB ======
  const calQuery = useQuery({
    enabled: tab === "cal",
    queryKey: ["r-cal", from, to, selCals.sort().join(","), selCats.sort().join(","), selStaff.sort().join(",")],
    queryFn: () =>
      fetchCalendarReport({
        start: from,
        end: to,
        calendarIds: selCals,
        categoryIds: selCats,
        staffIds: selStaff,
      }),
  });

  const cashQuery = useQuery({
    enabled: tab === "cash",
    queryKey: ["r-cash", from, to],
    queryFn: () => fetchCashReport({ start: from, end: to }),
  });

  const stockQuery = useQuery({
    enabled: tab === "stock",
    queryKey: ["r-stock", from, to],
    queryFn: () => fetchStockReport({ start: from, end: to }),
  });

  const staffQuery = useQuery({
    enabled: tab === "staff",
    queryKey: ["r-staff", from, to],
    queryFn: () => fetchStaffReport({ start: from, end: to }),
  });

  const usersQuery = useQuery({
    enabled: tab === "users",
    queryKey: ["r-users", from, to],
    queryFn: () => fetchUsersReport({ start: from, end: to }),
  });

  const pnlQuery = useQuery({
    enabled: tab === "pnl",
    queryKey: ["r-pnl", from, to],
    queryFn: () => fetchIncomeExpenseReport({ start: from, end: to }),
  });

  return (
    <div className="space-y-6 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Informes</h1>
        <p className="text-sm text-slate-300">Análisis por módulos con filtros y gráficas.</p>
      </header>

      {/* Tabs */}
      <div className={clsx(glassCard, "p-2 flex gap-2 flex-wrap")}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "rounded-xl px-3 py-1.5 text-sm",
              tab === t.key
                ? "bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] text-[#0b1020] font-semibold"
                : "border border-white/10 bg-white/10 hover:bg-white/20"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtros base (rangos) */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Desde</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Hasta</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => {
              setFrom(toInputDate(startOfMonth(new Date())));
              setTo(toInputDate(endOfMonth(new Date())));
            }}>
              Mes actual
            </Button>
            <Button variant="ghost" onClick={() => {
              const d = new Date();
              const from30 = new Date(d.getTime() - 29 * 86400000);
              setFrom(toInputDate(from30));
              setTo(toInputDate(d));
            }}>
              Últimos 30 días
            </Button>
          </div>
        </div>
      </section>

      {/* FILTROS EXTRA por TAB */}
      {tab === "cal" && (
        <section className={clsx(glassCard, "p-4")}>
          <div className="grid gap-4 md:grid-cols-3">
            <MultiCheck
              title="Calendarios"
              items={(opts?.calendars ?? []).map((c) => ({ id: c.id, label: c.name }))}
              selected={selCals}
              onChange={setSelCals}
            />
            <MultiCheck
              title="Categorías"
              items={(opts?.categories ?? []).map((c) => ({ id: c.id, label: c.name }))}
              selected={selCats}
              onChange={setSelCats}
            />
            <MultiCheck
              title="Personal"
              items={(opts?.staff ?? []).map((s) => ({ id: s.id, label: s.name }))}
              selected={selStaff}
              onChange={setSelStaff}
            />
          </div>
        </section>
      )}

      {/* CONTENIDO POR TAB */}
      {tab === "cal" && <CalendarsReport data={calQuery.data} loading={calQuery.isLoading} />}
      {tab === "cash" && <CashReport data={cashQuery.data} loading={cashQuery.isLoading} />}
      {tab === "stock" && <StockReport data={stockQuery.data} loading={stockQuery.isLoading} />}
      {tab === "staff" && <StaffReport data={staffQuery.data} loading={staffQuery.isLoading} />}
      {tab === "users" && <UsersReport data={usersQuery.data} loading={usersQuery.isLoading} />}
      {tab === "pnl" && <PnlReport data={pnlQuery.data} loading={pnlQuery.isLoading} />}
    </div>
  );
}

/* =================== Subcomponentes =================== */

function CalendarsReport({ data, loading }) {
  if (loading) return <LoadingCard />;
  if (!data) return null;
  const { summary, seriesDays, byStaff, byCalendar, byCategory } = data;
  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total citas" value={summary.total} />
        <Stat label="Pagadas online / tienda" value={`${summary.online} / ${summary.store}`} />
        <Stat label="Ausencias / 1ª vez" value={`${summary.absences} / ${summary.firsts}`} />
        <Delta label="Vs periodo anterior" value={summary.vsPrev} />
      </section>

      <ChartCard title="Evolución diaria (citas / online / tienda / ausencias)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={seriesDays}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="citas" stroke="#a78bfa" />
            <Line type="monotone" dataKey="online" stroke="#22d3ee" />
            <Line type="monotone" dataKey="tienda" stroke="#60a5fa" />
            <Line type="monotone" dataKey="ausencias" stroke="#fca5a5" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Por personal">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byStaff}>
              <ChartGradients />
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="citas" fill="url(#gradPurple)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Por calendario">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCalendar}>
              <ChartGradients />
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="citas" fill="url(#gradPurple)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Por categoría">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCategory}>
              <ChartGradients />
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="citas" fill="url(#gradPurple)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function CashReport({ data, loading }) {
  if (loading) return <LoadingCard />;
  if (!data) return null;
  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Ingresos" value={eur(data.totalIngresos)} />
        <Stat label="Gastos" value={eur(data.totalGastos)} />
        <Stat label="Neto" value={eur(data.neto)} />
      </section>

      <ChartCard title="Ingresos vs Gastos (diario)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ingresos" stroke="#22d3ee" />
            <Line type="monotone" dataKey="gastos" stroke="#fca5a5" />
            <Line type="monotone" dataKey="neto" stroke="#a78bfa" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function StockReport({ data, loading }) {
  if (loading) return <LoadingCard />;
  if (!data) return null;
  return (
    <div className="grid gap-4">
      <ChartCard title="Movimientos de stock (entradas/salidas)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.series}>
            <ChartGradients />
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="entradas" fill="url(#gradCyan)" radius={[8,8,0,0]} />
            <Bar dataKey="salidas" fill="url(#gradRose)" radius={[8,8,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top movimiento por categoría (mock)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.top}>
            <ChartGradients />
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="movs" fill="url(#gradPurple)" radius={[8,8,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function StaffReport({ data, loading }) {
  if (loading) return <LoadingCard />;
  if (!data) return null;
  return (
    <div className="grid gap-4">
      <ChartCard title="Citas por personal">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.byStaff}>
            <ChartGradients />
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="citas" fill="url(#gradPurple)" radius={[8,8,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pagos (online/tienda) por personal">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.byStaff}>
              <ChartGradients />
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="online" fill="url(#gradCyan)" radius={[8,8,0,0]} />
              <Bar dataKey="tienda" fill="url(#gradBlue)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ausencias por personal">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.byStaff}>
              <ChartGradients />
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="ausencias" fill="url(#gradRose)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function UsersReport({ data, loading }) {
  if (loading) return <LoadingCard />;
  if (!data) return null;
  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-2">
        <Stat label="Nuevos (rango)" value={data.nuevosMes} />
        <Stat label="Activos (rango)" value={data.activosMes} />
      </section>

      <ChartCard title="Usuarios nuevos vs activos (diario)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="nuevos" stroke="#a78bfa" />
            <Line type="monotone" dataKey="activos" stroke="#22d3ee" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function PnlReport({ data, loading }) {
  if (loading) return <LoadingCard />;
  if (!data) return null;
  const total = [
    { name: "Ingresos", value: data.totalIngresos, color: "#22d3ee" },
    { name: "Gastos", value: data.totalGastos, color: "#fb7185" },
  ];
  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Ingresos" value={eur(data.totalIngresos)} />
        <Stat label="Gastos" value={eur(data.totalGastos)} />
        <Stat label="Neto" value={eur(data.neto)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Evolución (diaria)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ingresos" stroke="#22d3ee" />
              <Line type="monotone" dataKey="gastos" stroke="#fca5a5" />
              <Line type="monotone" dataKey="neto" stroke="#a78bfa" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribución">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={total} dataKey="value" nameKey="name" outerRadius={90} label>
                {total.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

/* ====== UI Helpers ====== */
function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
function Delta({ label, value }) {
  const up = Number(value) >= 0;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-slate-300">{label}</div>
      <div className={clsx("text-lg font-semibold", up ? "text-emerald-200" : "text-rose-200")}>
        {up ? "+" : ""}{value}%
      </div>
    </div>
  );
}
function ChartCard({ title, children }) {
  return (
    <section className={clsx(glassCard, "p-4")}>
      <div className="mb-2 text-sm font-semibold">{title}</div>
      <div className="h-[300px] max-h-[70vh]">{children}</div>
    </section>
  );
}
function LoadingCard() {
  return (
    <section className={clsx(glassCard, "p-6 text-sm text-slate-300")}>
      Cargando…
    </section>
  );
}

function MultiCheck({ title, items, selected, onChange }) {
  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const all = selected.length === allIds.length;
  const toggleAll = () => onChange(all ? [] : allIds);
  const toggle = (id) =>
    selected.includes(id)
      ? onChange(selected.filter((x) => x !== id))
      : onChange([...selected, id]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={all}
            onChange={toggleAll}
            className="size-4 rounded border-white/20 bg-white/10"
          />
          Marcar todo
        </label>
      </div>
      <div className="max-h-[140px] overflow-auto pr-1 space-y-2">
        {items.slice(0).map((it) => (
          <label key={it.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(it.id)}
              onChange={() => toggle(it.id)}
              className="size-4 rounded border-white/20 bg-white/10"
            />
            <span className="truncate">{it.label}</span>
          </label>
        ))}
        {!items.length && <div className="text-sm text-slate-400">Sin opciones.</div>}
      </div>
    </div>
  );
}

/* ====== Utils ====== */
function toInputDate(d) {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 10);
}
function eur(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(n || 0));
}
