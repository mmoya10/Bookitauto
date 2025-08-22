// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import useLocalStorage from "../../hooks/useLocalStorage";
import { useAuth } from "../../hooks/useAuth";
import { IcChevron, IcGrid } from "./Icons";
import Select from "../../components/common/Select";

const glass = "border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

export default function Sidebar({
  menu,
  business,
  branches,
  branchMode,
  activeBranchId,
  setActiveBranchId,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useLocalStorage("sidebar:expanded", true);

  return (
    <aside
      className={clsx(
        "hidden md:flex sticky top-0 h-screen flex-col",
        glass,
        "transition-[width] duration-300",
        expanded ? "w-64" : "w-[84px]"
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between gap-2 px-3 py-3 shrink-0">
        <button type="button" onClick={() => navigate("/negocio")} className="flex items-center gap-2">
          <div className="grid overflow-hidden border size-10 place-items-center rounded-xl border-white/10 bg-white/5">
            {business?.logoUrl ? (
              <img src={business.logoUrl} alt="Logo" className="object-cover w-full h-full" />
            ) : (
              <IcGrid />
            )}
          </div>
          <div className={clsx("transition-all duration-200 text-left",
            expanded ? "opacity-100" : "opacity-0 w-0 pointer-events-none")}>
            <div className="text-sm font-semibold leading-4">
              {business?.nombre ?? user?.negocio ?? "Mi Negocio"}
            </div>
            <div className="text-[11px] text-slate-400">Panel</div>
          </div>
        </button>

        <button
          onClick={() => setExpanded(e => !e)}
          className="grid border rounded-lg size-8 place-items-center border-white/10 bg-white/10 hover:bg-white/15"
          title={expanded ? "Colapsar" : "Expandir"}
        >
          <IcChevron className={clsx("transition-transform", expanded ? "" : "rotate-180")} />
        </button>
      </div>

      {/* Branch selector */}
      {branchMode && (
        <div className={clsx("px-3", expanded ? "block" : "hidden")}>
          <label className="grid gap-1 mb-2">
            <span className="text-[11px] text-slate-300">Sucursal</span>
            <Select
              size="sm"
              value={activeBranchId || ""}
              onChange={(v) => setActiveBranchId(v)}
              options={(branches ?? []).map(b => ({ value: b.id, label: b.nombre }))}
              placeholder="Selecciona sucursal"
            />
          </label>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 mt-2 overflow-y-auto no-scrollbar">
        <ul className="grid gap-1">
          {menu.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => clsx(
                  "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-slate-300",
                  "hover:text-zinc-100 hover:bg-white/5",
                  isActive && "text-white bg-white/10 ring-1 ring-white/10"
                )}
              >
                <span className="grid size-6 place-items-center"><Icon /></span>
                <span className={clsx(
                  "whitespace-nowrap transition-[opacity,transform,width] duration-200",
                  expanded ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                )}>
                  {label}
                </span>

                {!expanded && (
                  <span className={clsx(
                    "pointer-events-none absolute left-[78px] z-10 rounded-md border border-white/10 bg-[#111827]/90 px-2 py-1 text-xs text-zinc-100 shadow-lg",
                    "opacity-0 translate-x-[-6px] group-hover:opacity-100 group-hover:translate-x-0"
                  )}>
                    {label}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className={clsx("text-xs text-slate-400 transition-all",
            expanded ? "opacity-100" : "opacity-0 w-0 pointer-events-none")}>
            {user?.nombreUsuario ?? "Admin"} · {user?.rol ?? "admin"}
          </div>
          <button
            onClick={() => logout()}
            className="px-2 py-1 text-xs border rounded-lg border-white/10 bg-white/10 hover:bg-white/15"
          >
            Salir
          </button>
        </div>
      </div>
    </aside>
  );
}
