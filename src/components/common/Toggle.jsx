import clsx from "clsx";

/**
 * Toggle (switch) con layout flex y padding interno.
 * Sin translate-X: robusto ante bordes y tamaños.
 */
const sizes = {
  md: {
    track: "h-6 w-11 p-0.5",
    thumb: "h-5 w-5",
    label: "text-sm",
    desc: "text-xs",
    gap: "gap-3",
  },
  sm: {
    track: "h-5 w-9 p-0.5",
    thumb: "h-4 w-4",
    label: "text-xs",
    desc: "text-[11px]",
    gap: "gap-2",
  },
};

const variants = {
  accent: {
    on:  "bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] border-transparent",
    off: "bg-white/10 border-white/15",
    thumb: "bg-white",
    ring: "focus-visible:ring-2 focus-visible:ring-white/30",
  },
  ghost: {
    on:  "bg-white/20 border-white/10",
    off: "bg-white/10 border-white/10",
    thumb: "bg-white",
    ring: "focus-visible:ring-2 focus-visible:ring-white/20",
  },
};

export default function Toggle({
  checked,
  onChange,
  disabled = false,
  size = "md",
  variant = "accent",
  className,
  label,
  description,
  align = "right",
  ...rest
}) {
  const S = sizes[size] ?? sizes.md;
  const V = variants[variant] ?? variants.accent;

  function handleToggle() {
    if (!disabled) onChange?.(!checked);
  }

  return (
    <div
      className={clsx(
        "inline-flex items-center",
        S.gap,
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {align === "left" && (label || description) && (
        <LabelBlock label={label} description={description} size={size} />
      )}

      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={handleToggle}
        disabled={disabled}
        className={clsx(
          "relative rounded-full border transition-colors select-none outline-none",
          "inline-flex items-center",                      // layout
          checked ? "justify-end" : "justify-start",       // posición del thumb
          V.ring,
          checked ? V.on : V.off,
          S.track
        )}
        {...rest}
      >
        <span
          className={clsx(
            "rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition-transform",
            V.thumb,
            S.thumb
          )}
        />
      </button>

      {align === "right" && (label || description) && (
        <LabelBlock label={label} description={description} size={size} />
      )}
    </div>
  );
}

function LabelBlock({ label, description, size }) {
  const S = sizes[size] ?? sizes.md;
  return (
    <div className="min-w-0">
      {label && <div className={clsx("font-medium text-zinc-100", S.label)}>{label}</div>}
      {description && <div className={clsx("text-slate-300", S.desc)}>{description}</div>}
    </div>
  );
}
