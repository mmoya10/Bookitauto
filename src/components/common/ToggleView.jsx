import clsx from "clsx";

/* Iconos inline */
function IcTable(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" opacity="0.15" />
      <path d="M3 9h18M8 4v16M16 4v16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IcCards(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * ToggleView — selector Tabla/Tarjetas (icon-only)
 * props:
 *  - value: "table" | "cards"
 *  - onChange: (next) => void
 *  - className?: string
 */
export default function ToggleView({ value, onChange, className }) {
  const btnBase =
    "inline-flex items-center justify-center rounded-xl border transition p-2 " +
    "focus:outline-none focus:ring-1";

  const btnGhost =
    "border-white/10 bg-white/10 text-slate-200 hover:bg-white/15 focus:ring-white/20";
  const btnActive =
    "border-transparent text-white bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] " +
    "shadow-[0_8px_24px_rgba(124,58,237,0.35)] focus:ring-white/30";

  const isTable = value === "table";
  const isCards = value === "cards";

  return (
    <div className={clsx("inline-flex gap-2", className)}>
      <button
        type="button"
        aria-label="Vista tabla"
        title="Vista tabla"
        className={clsx(btnBase, isTable ? btnActive : btnGhost)}
        onClick={() => onChange("table")}
      >
        <IcTable />
      </button>
      <button
        type="button"
        aria-label="Vista tarjetas"
        title="Vista tarjetas"
        className={clsx(btnBase, isCards ? btnActive : btnGhost)}
        onClick={() => onChange("cards")}
      >
        <IcCards />
      </button>
    </div>
  );
}
