// src/components/layout/AppLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import useLocalStorage from "../../hooks/useLocalStorage";
import { useAuth } from "../../hooks/useAuth";
import NotifyBell from "../notifications/NotifyBell";
import { fetchBusiness, fetchBranches } from "../../api/business";
import Select from "../../components/common/Select";

/* ====== ICONOS SVG (inline) ====== */
const IcUser = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0" />
  </svg>
);
const IcChart = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-7" />
  </svg>
);
const IcCalendar = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>
  </svg>
);
const IcCredit = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
  </svg>
);
const IcWallet = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M3 7h14a3 3 0 0 1 3 3v7a1 1 0 0 1-1 1H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/>
    <path d="M17 11h5v6h-5a2 2 0 0 1 0-6Z"/>
  </svg>
);
const IcBoxes = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M3 8l9-5 9 5-9 5-9-5Z"/><path d="M3 16l9 5 9-5"/><path d="M3 8v8M21 8v8"/>
  </svg>
);
const IcTag = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M20.59 13.41 12 22l-9-9 8.59-8.59A2 2 0 0 1 13.83 4H20v6.17a2 2 0 0 1-.59 1.41Z"/>
    <circle cx="7.5" cy="7.5" r="1.5"/>
  </svg>
);
const IcUsers = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcList = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3" cy="6" r="1.5"/><circle cx="3" cy="12" r="1.5"/><circle cx="3" cy="18" r="1.5"/>
  </svg>
);
const IcGrid = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IcMail = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
  </svg>
);
const IcChevron = (p)=>(
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);
const IcMegaphone = (p)=>(
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M3 11v2a2 2 0 0 0 2 2h2l7 4V5L7 9H5a2 2 0 0 0-2 2Z"/>
    <path d="M14 8a4 4 0 0 1 0 8"/>
  </svg>
);
const IcMenu = (p)=>(
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M3 6h18M3 12h18M3 18h18"/>
  </svg>
);
const IcClose = (p)=>(
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M6 6l12 12M6 18L18 6"/>
  </svg>
);

/* ====== Menú ====== */
const menu = [
  { to: "/perfil", label: "Mi Perfil", icon: IcUser },
  { to: "/informes", label: "Informes", icon: IcChart },
  { to: "/calendarios", label: "Calendarios", icon: IcCalendar },
  { to: "/facturacion", label: "Facturación", icon: IcCredit },
  { to: "/caja", label: "Caja", icon: IcWallet },
  { to: "/stock", label: "Stock", icon: IcBoxes },
  { to: "/productos", label: "Productos", icon: IcTag },
  { to: "/personal", label: "Personal", icon: IcUsers },
  { to: "/usuarios", label: "Usuarios", icon: IcList },
  { to: "/espacios", label: "Espacios", icon: IcGrid },
  { to: "/contacto", label: "Contacto", icon: IcMail },
  { to: "/marketing", label: "Marketing", icon: IcMegaphone },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Datos de negocio y sucursales
  const { data: business } = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const { data: branches } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches, enabled: !!business });

  // Sucursal activa
  const [activeBranchId, setActiveBranchId] = useLocalStorage("branch:active", null);

  // UI estado
  const [expanded, setExpanded] = useLocalStorage("sidebar:expanded", true); // desktop colapsable
  const [mobileOpen, setMobileOpen] = useState(false); // drawer móvil

  // Sucursal por defecto si no hay seleccionada
  const resolvedActiveBranch = useMemo(() => {
    if (!branches?.length) return null;
    const found = branches.find(b => b.id === activeBranchId);
    return found || branches[0];
  }, [branches, activeBranchId]);

  const glass =
    "border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

  return (
    <div
      className="min-h-screen grid md:grid-cols-[auto_1fr] text-zinc-100
      bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(124,58,237,0.20),transparent_40%),radial-gradient(1200px_600px_at_90%_90%,rgba(34,211,238,0.20),transparent_40%),linear-gradient(120deg,#0f172a,#1e293b)]"
    >
      {/* ===== Sidebar (desktop) ===== */}
      <aside
        className={clsx(
          "hidden md:flex sticky top-0 h-screen flex-col",
          glass,
          "transition-[width] duration-300",
          expanded ? "w-64" : "w-[84px]"
        )}
      >
        {/* Header con logo clicable a /negocio */}
        <div className="flex items-center justify-between gap-2 px-3 py-3 shrink-0">
          <button 
          type="button"
          onClick={() => navigate("/negocio")}
          className="flex items-center gap-2"
          >
            <div className="grid size-10 place-items-center rounded-xl border border-white/10 overflow-hidden bg-white/5">
              {business?.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt="Logo negocio"
                  className="w-full h-full object-cover"
                />
              ) : (
                <IcGrid />
              )}
            </div>
            <div
              className={clsx(
                "transition-all duration-200 text-left",
                expanded ? "opacity-100" : "opacity-0 w-0 pointer-events-none"
              )}
            >
              <div className="text-sm font-semibold leading-4">
                {business?.nombre ?? user?.negocio ?? "Mi Negocio"}
              </div>
              <div className="text-[11px] text-slate-400">Panel</div>
            </div>
          </button>

          <button
            onClick={() => setExpanded((e) => !e)}
            className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/10 hover:bg-white/15"
            title={expanded ? "Colapsar" : "Expandir"}
          >
            <IcChevron className={clsx("transition-transform", expanded ? "" : "rotate-180")} />
          </button>
        </div>

        {/* Selector de sucursal (si branchMode) */}
       {business?.branchMode && (
  <div className={clsx("px-3", expanded ? "block" : "hidden")}>
    <label className="grid gap-1 mb-2">
      <span className="text-[11px] text-slate-300">Sucursal</span>
      <Select
        size="sm"
        value={resolvedActiveBranch?.id || ""}
        onChange={(v) => setActiveBranchId(v)}
        options={(branches ?? []).map(b => ({ value: b.id, label: b.nombre }))}
        placeholder="Selecciona sucursal"
      />
    </label>
  </div>
)}


        {/* NAV */}
        <nav className="mt-2 px-2 flex-1 overflow-y-auto no-scrollbar">
          <ul className="grid gap-1">
            {menu.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    clsx(
                      "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-slate-300",
                      "hover:text-zinc-100 hover:bg-white/5",
                      isActive && "text-white bg-white/10 ring-1 ring-white/10"
                    )
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="grid size-6 place-items-center">
                    <Icon />
                  </span>
                  <span
                    className={clsx(
                      "whitespace-nowrap transition-[opacity,transform,width] duration-200",
                      expanded ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                    )}
                  >
                    {label}
                  </span>

                  {/* Tooltip cuando está colapsado */}
                  {!expanded && (
                    <span
                      className={clsx(
                        "pointer-events-none absolute left-[78px] z-10 rounded-md border border-white/10 bg-[#111827]/90 px-2 py-1 text-xs text-zinc-100 shadow-lg",
                        "opacity-0 translate-x-[-6px] group-hover:opacity-100 group-hover:translate-x-0"
                      )}
                    >
                      {label}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-3 py-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div
              className={clsx(
                "text-xs text-slate-400 transition-all",
                expanded ? "opacity-100" : "opacity-0 w-0 pointer-events-none"
              )}
            >
              {user?.nombreUsuario ?? "Admin"} · {user?.rol ?? "admin"}
            </div>
            <button
              onClick={() => logout()}
              className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Topbar móvil ===== */}
      <header
        className={clsx(
          "md:hidden sticky top-0 z-30 flex items-center justify-between px-3 py-2",
          glass
        )}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/10 active:translate-y-px"
            aria-label="Abrir menú"
            title="Abrir menú"
          >
            <IcMenu />
          </button>

        <button
          type="button"
          onClick={() => navigate("/negocio")}
          className="flex items-center gap-2"
          title="Ir a Negocio"
        >
          <div className="grid size-9 place-items-center rounded-lg border border-white/10 overflow-hidden bg-white/5">
            {business?.logoUrl ? (
              <img src={business.logoUrl} alt="Logo negocio" className="w-full h-full object-cover" />
            ) : (
              <IcGrid />
            )}
          </div>
          <div className="text-sm font-semibold leading-4 truncate max-w-[40vw]">
            {business?.nombre ?? user?.negocio ?? "Mi Negocio"}
          </div>
        </button>
        </div>

        {/* Selector sucursal móvil */}
        {business?.branchMode && (
  <div className="min-w-[40%]">
    <Select
      size="sm"
      value={resolvedActiveBranch?.id || ""}
      onChange={(v) => setActiveBranchId(v)}
      options={(branches ?? []).map(b => ({ value: b.id, label: b.nombre }))}
    />
  </div>
)}

      </header>

      {/* ===== Drawer lateral móvil ===== */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={clsx(
              "absolute top-0 left-0 h-full w-[82vw] max-w-[320px] p-3",
              glass,
              "animate-[slideIn_.2s_ease-out]"
            )}
            style={{
              // keyframes inline para no depender de config
              animationName:
                "{from{transform:translateX(-8%);opacity:.6}to{transform:translateX(0);opacity:1}}",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => navigate("/Negocio")}
                className="flex items-center gap-2"
              >
                <div className="grid size-9 place-items-center rounded-lg border border-white/10 overflow-hidden bg-white/5">
                  {business?.logoUrl ? (
                    <img src={business.logoUrl} alt="Logo negocio" className="w-full h-full object-cover" />
                  ) : (
                    <IcGrid />
                  )}
                </div>
                <div className="text-sm font-semibold leading-4">
                  {business?.nombre ?? "Mi Negocio"}
                </div>
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/10"
                aria-label="Cerrar menú"
                title="Cerrar menú"
              >
                <IcClose />
              </button>
            </div>

           {business?.branchMode && (
  <label className="grid gap-1 mb-3">
    <span className="text-[11px] text-slate-300">Sucursal</span>
    <Select
      size="sm"
      value={resolvedActiveBranch?.id || ""}
      onChange={(v) => setActiveBranchId(v)}
      options={(branches ?? []).map(b => ({ value: b.id, label: b.nombre }))}
    />
  </label>
)}


            <nav className="mt-1 overflow-y-auto no-scrollbar">
              <ul className="grid gap-1">
                {menu.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm",
                          "text-slate-300 hover:text-zinc-100 hover:bg-white/5",
                          isActive && "text-white bg-white/10 ring-1 ring-white/10"
                        )
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="grid size-6 place-items-center">
                        <Icon />
                      </span>
                      <span className="whitespace-nowrap">{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-3 border-t border-white/10 pt-2">
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Main ===== */}
      <div className="min-w-0">
        {/* padding-off: ya no hay bottom bar móvil */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Notificaciones flotantes */}
      <NotifyBell/>
    </div>
  );
}
