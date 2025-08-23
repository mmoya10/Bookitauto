import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { createPortal } from "react-dom";

export default function MultiSelect({
  items,                // [{ id, label }]
  values,               // array de ids seleccionados
  onChange,             // (nextIds[]) => void
  placeholder = "Selecciona…",
  className,
  selectAllLabel = "Todos",
  showSelectAll = true,
  searchable = true,
  maxHeight = 220,
  disabled = false,
  portal = true,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef(null);
  const [popRect, setPopRect] = useState(null); // {left, top, width, bottom}

  const popRef = useRef(null);

  const allIds = useMemo(() => items.map(i => i.id), [items]);
  const allChecked = values.length === allIds.length && allIds.length > 0;
  const someChecked = values.length > 0 && !allChecked;

  const filtered = useMemo(() => {
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"");
    const nq = norm(q);
    return !q ? items : items.filter(i => norm(i.label).includes(nq));
  }, [q, items]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (btnRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

    useEffect(() => {
    if (!open) return;
    const updatePos = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      setPopRect({
        left: r.left,
        top: r.bottom + 8,  // 8px separación
        width: r.width,
      });
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  // Toggle 1 id
  const toggleId = (id) => {
    if (values.includes(id)) onChange(values.filter(v => v !== id));
    else onChange([...values, id]);
  };

  const setAll = (check) => onChange(check ? allIds : []);

  // Etiqueta del botón
  const label = useMemo(() => {
    if (!items.length) return "Sin opciones";
    if (allChecked) return `${selectAllLabel} (${items.length})`;
    if (values.length === 0) return placeholder;
    if (values.length <= 2) {
      const map = new Map(items.map(i => [i.id, i.label]));
      return values.map(v => map.get(v) ?? v).join(", ");
    }
    return `${values.length} seleccionados`;
  }, [allChecked, items, placeholder, selectAllLabel, values]);

  return (
    <div className={clsx("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={clsx(
          "w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl",
          "border border-white/10 bg-white/10 text-zinc-100",
          "hover:bg-white/15 focus:outline-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={clsx("truncate text-sm", values.length ? "text-zinc-100" : "text-slate-300")}>
          {label}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80" fill="currentColor" aria-hidden>
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

     {open && (portal
        ? createPortal(
            <div
              ref={popRef}
              className={clsx(
                "rounded-xl border border-white/10 bg-[#0b1020]/95 backdrop-blur",
                "shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
              )}
              role="listbox"
              style={{
                position: "fixed",
                zIndex: 9999,
                left: popRect?.left ?? 0,
                top: popRect?.top ?? 0,
                width: popRect?.width ?? "auto",
              }}
            >
          {searchable && (
            <div className="p-2 border-b border-white/10">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white/5 text-slate-100 placeholder:text-slate-400 border-white/10 focus:outline-none"
              />
            </div>
          )}

          {showSelectAll && !!items.length && (
            <label className="flex items-center gap-2 px-3 py-2 text-sm border-b cursor-pointer text-slate-200 border-white/10">
              <input
                type="checkbox"
                className="rounded size-4 border-white/20 bg-white/10"
                checked={allChecked}
                ref={(el) => el && (el.indeterminate = someChecked)}
                onChange={(e) => setAll(e.target.checked)}
              />
              {selectAllLabel}
              <span className="ml-auto text-xs text-slate-400">{items.length}</span>
            </label>
          )}

          <div
            className="overflow-auto"
            style={{ maxHeight }}
          >
            {filtered.length ? filtered.map(it => (
              <label
                key={it.id}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer text-slate-200 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  className="rounded size-4 border-white/20 bg-white/10"
                  checked={values.includes(it.id)}
                  onChange={() => toggleId(it.id)}
                />
                <span className="truncate">{it.label}</span>
              </label>
            )) : (
              <div className="px-3 py-2 text-sm text-slate-400">Sin resultados</div>
            )}
          </div>

          {/* Footer chips/acciones */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-white/10">
            {!!values.length && (
              <>
                <span className="text-xs text-slate-400">Seleccionados:</span>
                <Chips items={items} values={values} onRemove={(id)=>onChange(values.filter(v=>v!==id))} />
                <button
                  type="button"
                  className="ml-auto text-xs underline text-slate-300 hover:text-slate-100"
                  onClick={() => onChange([])}
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  className="text-xs underline text-slate-300 hover:text-slate-100"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </button>
              </>
            )}
            {!values.length && (
              <button
                type="button"
                className="ml-auto text-xs underline text-slate-300 hover:text-slate-100"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            )}
          </div>
       </div>,
            document.body
          )
        : (
          <div
            ref={popRef}
            className={clsx(
              "absolute z-[9999] mt-2 w-full rounded-xl border border-white/10 bg-[#0b1020]/95 backdrop-blur",
              "shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            )}
            role="listbox"
          >
            {/* (contenido idéntico al de arriba si algún día desactivas portal) */}
          </div>
        )
      )}
    </div>
  );
}

function Chips({ items, values, onRemove }) {
  const labelById = useMemo(() => Object.fromEntries(items.map(i => [i.id, i.label])), [items]);
  return (
    <>
      {values.slice(0, 3).map(id => (
        <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-full bg-white/10 border-white/15">
          {labelById[id] ?? id}
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="opacity-70 hover:opacity-100"
            aria-label="Quitar"
            title="Quitar"
          >
            ×
          </button>
        </span>
      ))}
      {values.length > 3 && (
        <span className="text-xs text-slate-400">+{values.length - 3} más</span>
      )}
    </>
  );
}
