// src/pages/Empresa/PanelPage.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import clsx from "clsx";

const glass =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

export default function PanelPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  // Datos mock (puedes sustituir por fetchers reales)
  const stats = useMemo(
    () => [
      { label: "Sub-cuentas activas", value: 128, hint: "+5 esta semana" },
      { label: "Tickets abiertos", value: 12, hint: "4 urgentes" },
      { label: "Disponibilidad API", value: "99.97%", hint: "Últimas 24h" },
      { label: "Nuevos registros", value: 23, hint: "Últimos 7 días" },
    ],
    []
  );

  const tickets = useMemo(
    () => [
      { id: "TCK-1042", cliente: "Belleza Nova", asunto: "Error al sincronizar agenda", prioridad: "Alta", estado: "En curso", hace: "hace 2h" },
      { id: "TCK-1041", cliente: "Barber Pro", asunto: "No se envían recordatorios", prioridad: "Media", estado: "Pendiente", hace: "hace 5h" },
      { id: "TCK-1038", cliente: "Spa Zen", asunto: "Fallo de cobro TPV", prioridad: "Crítica", estado: "En curso", hace: "hace 1d" },
      { id: "TCK-1032", cliente: "Pelu Art", asunto: "Importación de clientes", prioridad: "Baja", estado: "Resuelto", hace: "hace 2d" },
    ],
    []
  );

  const cuentas = useMemo(
    () => [
      { id: "CTA-2209", nombre: "Glow Studio", plan: "Pro", estado: "Activa", desde: "2024-03-10" },
      { id: "CTA-2212", nombre: "Look&Feel", plan: "Starter", estado: "Activa", desde: "2024-08-02" },
      { id: "CTA-2218", nombre: "HairLab", plan: "Pro", estado: "En revisión", desde: "2025-01-21" },
      { id: "CTA-2220", nombre: "Nails Hub", plan: "Trial", estado: "Pendiente", desde: "2025-08-24" },
    ],
    []
  );

  return (
    <div className="grid gap-6">
      {/* Encabezado */}
      <header className={clsx(glass, "p-4 md:p-6")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="m-0 text-xl md:text-2xl font-semibold">Panel de Empresa</h1>
            <p className="m-0 text-sm text-slate-300">
              Bienvenido{user?.nombreUsuario ? `, ${user.nombreUsuario}` : ""}. Rol: <strong>{user?.rol ?? "Administrativo"}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => nav("/cuentas")}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 active:translate-y-px"
              title="Ir a Cuentas"
            >
              Gestionar Cuentas
            </button>
            <button
              onClick={() => nav("/estadisticas")}
              className="rounded-xl bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] px-3 py-2 text-sm text-white font-medium active:translate-y-px"
              title="Ver Estadísticas"
            >
              Ver Estadísticas
            </button>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <article key={s.label} className={clsx(glass, "p-4")}>
            <div className="text-sm text-slate-300">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold">{s.value}</div>
            <div className="mt-1 text-xs text-slate-400">{s.hint}</div>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets recientes */}
        <section className={clsx(glass, "p-4 md:p-5 lg:col-span-2")}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold">Tickets recientes</h2>
            <button
              onClick={() => nav("/cuentas")}
              className="text-sm text-cyan-200 hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="mt-3 divide-y divide-white/10">
            {tickets.map((t) => (
              <div key={t.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/10 px-2 py-0.5">
                      <span className="text-[11px] text-slate-300">{t.id}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-200">{t.cliente}</span>
                  </div>
                  <div className="mt-0.5 text-sm font-medium">{t.asunto}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{t.hace}</div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <BadgePrioridad value={t.prioridad} />
                  <BadgeEstado value={t.estado} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Últimas cuentas / estado */}
        <aside className="grid gap-6">
          <section className={clsx(glass, "p-4 md:p-5")}>
            <h2 className="m-0 text-lg font-semibold">Últimas cuentas</h2>
            <ul className="mt-3 grid gap-3">
              {cuentas.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{c.nombre}</div>
                    <div className="text-xs text-slate-400">
                      {c.plan} • desde {c.desde}
                    </div>
                  </div>
                  <BadgeCuenta estado={c.estado} />
                </li>
              ))}
            </ul>
            <button
              onClick={() => nav("/cuentas")}
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 active:translate-y-px"
            >
              Ver cuentas
            </button>
          </section>

          <section className={clsx(glass, "p-4 md:p-5")}>
            <h2 className="m-0 text-lg font-semibold">Estado del sistema</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              <li className="flex items-center justify-between">
                <span>API Core</span>
                <span className="rounded-md bg-green-400/20 text-green-200 px-2 py-0.5 text-xs">Operativo</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Notificaciones</span>
                <span className="rounded-md bg-green-400/20 text-green-200 px-2 py-0.5 text-xs">Operativo</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Pagos</span>
                <span className="rounded-md bg-yellow-400/20 text-yellow-200 px-2 py-0.5 text-xs">Degradado</span>
              </li>
            </ul>
            <button
              onClick={() => nav("/estadisticas")}
              className="mt-3 w-full rounded-lg bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] px-3 py-2 text-sm text-white font-medium active:translate-y-px"
            >
              Métricas
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function BadgePrioridad({ value }) {
  const map = {
    "Crítica": "bg-red-500/20 text-red-200",
    "Alta": "bg-orange-500/20 text-orange-200",
    "Media": "bg-yellow-500/20 text-yellow-200",
    "Baja": "bg-slate-500/20 text-slate-200",
  };
  return (
    <span className={clsx("rounded-md px-2 py-0.5 text-xs", map[value] || "bg-slate-500/20 text-slate-200")}>
      {value}
    </span>
  );
}

function BadgeEstado({ value }) {
  const map = {
    "En curso": "bg-cyan-500/20 text-cyan-200",
    "Pendiente": "bg-slate-500/20 text-slate-200",
    "Resuelto": "bg-green-500/20 text-green-200",
  };
  return (
    <span className={clsx("rounded-md px-2 py-0.5 text-xs", map[value] || "bg-slate-500/20 text-slate-200")}>
      {value}
    </span>
  );
}

function BadgeCuenta({ estado }) {
  const map = {
    "Activa": "bg-green-500/20 text-green-200",
    "En revisión": "bg-yellow-500/20 text-yellow-200",
    "Pendiente": "bg-slate-500/20 text-slate-200",
  };
  return (
    <span className={clsx("rounded-md px-2 py-0.5 text-xs", map[estado] || "bg-slate-500/20 text-slate-200")}>
      {estado}
    </span>
  );
}
