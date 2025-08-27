// src/components/common/OptionSwitch.jsx
import { useState, useMemo } from "react";
import clsx from "clsx";
import Button from "./Button";

export default function OptionSwitch({
  options = [],
  value,
  onChange,
  defaultValue,
  className,
  size = "md",
  pill = true,
  hidePanel = false,
}) {
  const isControlled = value !== undefined;
  const initial = defaultValue ?? options[0]?.value ?? "";
  const [inner, setInner] = useState(initial);
  const current = isControlled ? value : inner;

  const set = (v) => {
    if (!isControlled) setInner(v);
    onChange?.(v);
  };

  const paddings = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const radius = pill ? "rounded-full" : "rounded-xl";

  // ✅ Calcular SIEMPRE con useMemo (no condicional)
  const activeContent = useMemo(() => {
    return options.find((o) => o.value === current)?.content ?? null;
  }, [options, current]);

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Cabecera de opciones */}
      <div className={clsx("flex items-center gap-2 flex-wrap")}>
        {options.map((opt) => {
          const active = current === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              variant="ghost"
              className={clsx(
                paddings,
                radius,
                "border-white/10",
                active
                  ? "ring-2 ring-cyan-400/40 bg-white/10"
                  : "hover:bg-white/10"
              )}
              onClick={() => set(opt.value)}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>

      {/* Contenido (opcional) */}
      {!hidePanel && (
        <div className="border border-white/10 bg-white/5 p-4 rounded-2xl">
          {activeContent}
        </div>
      )}
    </div>
  );
}
