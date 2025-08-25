// src/components/layout/TopbarMobile.jsx
import clsx from "clsx";
import { IcMenu, IcGrid } from "./Icons";
import Select from "../../components/common/Select";
import { useNavigate } from "react-router-dom";

const glass = "border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

export default function TopbarMobile({
  onOpenMenu,
  business,
  branchMode,
  branches,
  activeBranchId,
  setActiveBranchId,
}) {
  const navigate = useNavigate();

  return (
    <header className={clsx("md:hidden sticky top-0 z-30 flex items-center justify-between px-3 py-2", glass)}>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMenu}
          className="grid border rounded-lg size-9 place-items-center border-white/10 bg-white/10 active:translate-y-px"
          aria-label="Abrir menú"
          title="Abrir menú"
        >
          <IcMenu />
        </button>

        <button
          type="button"
          className="flex items-center gap-2"
          title="Ir a Negocio"
        >
          <div className="grid overflow-hidden border rounded-lg size-9 place-items-center border-white/10 bg-white/5">
            {business?.logoUrl ? (
              <img src={business.logoUrl} alt="Logo" className="object-cover w-full h-full" />
            ) : (
              <IcGrid />
            )}
          </div>
          <div className="text-sm font-semibold leading-4 truncate max-w-[40vw]">
            {business?.nombre ?? "Mi Negocio"}
          </div>
        </button>
      </div>

      {branchMode && (
        <div className="min-w-[40%]">
          <Select
            size="sm"
            value={activeBranchId || ""}
            onChange={(v) => setActiveBranchId(v)}
            options={(branches ?? []).map(b => ({ value: b.id, label: b.nombre }))}
          />
        </div>
      )}
    </header>
  );
}
