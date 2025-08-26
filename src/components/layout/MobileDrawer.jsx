// src/components/layout/MobileDrawer.jsx
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { IcClose, IcGrid, IcGear, IcDoorOut } from "./Icons";
import Select from "../../components/common/Select";
import { useAuth } from "../../hooks/useAuth";

const glass =
  "border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

export default function MobileDrawer({
  open,
  onClose,
  menu,
  business,
  branchMode,
  branches,
  activeBranchId,
  setActiveBranchId,
  settingsMode,
  setSettingsMode,
}) {

  const { logout } = useAuth();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 md:hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
  className="absolute inset-0 bg-black/50"
  onClick={() => { setSettingsMode(false); onClose(); }}
/>


      {/* Drawer */}
      <div
        className={clsx(
          "absolute top-0 left-0 h-full w-[82vw] max-w-[320px] p-3",
          "flex flex-col", // <<— columna con altura completa
          glass
        )}
      >
        {/* Header (no scroll) */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="grid overflow-hidden border rounded-lg size-9 place-items-center border-white/10 bg-white/5">
              {business?.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt="Logo"
                  className="object-cover w-full h-full"
                />
              ) : (
                <IcGrid />
              )}
            </div>
            <div className="text-sm font-semibold leading-4">
              {business?.nombre ?? "Mi Negocio"}
            </div>
          </div>
          <button
            onClick={() => { setSettingsMode(false); onClose(); }}

            className="grid border rounded-lg size-9 place-items-center border-white/10 bg-white/10"
            aria-label="Cerrar menú"
            title="Cerrar menú"
          >
            <IcClose />
          </button>
        </div>

        {/* Selector de sucursal (no scroll) */}
        {branchMode && (
          <label className="grid gap-1 mb-3 shrink-0">
            <span className="text-[11px] text-slate-300">Sucursal</span>
            <Select
              size="sm"
              value={activeBranchId || ""}
              onChange={(v) => setActiveBranchId(v)}
              options={(branches ?? []).map((b) => ({
                value: b.id,
                label: b.nombre,
              }))}
            />
          </label>
        )}

        {/* NAV (scroll vertical) */}
        <nav
          className="mt-1 overflow-y-auto no-scrollbar flex-1 -mr-1 pr-1 pb-[env(safe-area-inset-bottom)]"
          style={{ WebkitOverflowScrolling: "touch" }} // inercia iOS
        >
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
                  onClick={() => { setSettingsMode(false); onClose(); }}

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

        {/* Footer (no scroll) */}
{/* Footer (no scroll) */}
<div className="pt-2 mt-3 border-t border-white/10 shrink-0">
  <div className="flex items-center gap-2 w-full">
    {/* Ajustes / Cerrar */}
    <button
      onClick={() => setSettingsMode(v => !v)}
      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-2 text-sm text-zinc-100"
      aria-label={settingsMode ? "Cerrar ajustes" : "Ajustes"}
      title={settingsMode ? "Cerrar ajustes" : "Ajustes"}
    >
      {settingsMode ? <IcClose width={20} height={20}/> : <IcGear width={20} height={20}/>}
      <span className="truncate">{settingsMode ? "Cerrar" : "Ajustes"}</span>
    </button>

    {/* Salir */}
    <button
      onClick={() => { setSettingsMode(false); onClose(); logout(); }}
      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-600/80 hover:bg-red-600 px-3 py-2 text-sm text-white"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      <IcDoorOut width={20} height={20}/>
      <span className="truncate">Salir</span>
    </button>
  </div>
</div>

      </div>
    </div>
  );
}
