// src/pages/Home/HomePage.jsx
import { useQuery } from "@tanstack/react-query";
import { startOfDay, endOfDay } from "date-fns";
import clsx from "clsx";
import { fetchAppointments } from "../../api/calendars";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

const IcCalendar = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>
  </svg>
);

export default function HomePage() {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  const { data: count, isLoading } = useQuery({
    queryKey: ["today-appointments", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      try {
        const list = await fetchAppointments({ start, end });
        return (list ?? []).length;
      } catch {
        return 0;
      }
    },
  });

  const fechaLabel = today.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  return (
    <div className="min-h-[65vh] grid place-items-center text-center text-zinc-100">
      <div className="px-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
          <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#7c3aed,#22d3ee)]">
            Bienvenido a Bookitauto
          </span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300">
          Tu gestor de citas y negocio
        </p>

        <div className={clsx(glassCard, "mt-6 inline-flex items-center gap-4 px-5 py-4")}>
          <div className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/10">
            <IcCalendar />
          </div>
          <div className="text-left">
            <div className="text-xs text-slate-300">Citas para hoy</div>
            <div className="text-3xl font-semibold leading-none">
              {isLoading ? "—" : count}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 capitalize">
              {fechaLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
