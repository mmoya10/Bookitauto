import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Portal from "./Portal";

const sizes = {
  md: { px: "px-3", py: "py-2", text: "text-sm", h: "h-10" },
  sm: { px: "px-2", py: "py-1.5", text: "text-sm", h: "h-9" },
};

const IcChevron = (p)=>(
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

function normalize(str="") {
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Select headless estilo glass
 * Props:
 * - options: Array<{ value: string|number, label: string }>
 * - value: string|number|null
 * - onChange: (value) => void
 * - size?: "md" | "sm"
 * - placeholder?: string
 * - disabled?: boolean
 * - className?: string
 * - maxHeight?: number (px)
 * - searchable?: boolean
 * - searchPlaceholder?: string
 */
export default function Select({
  options = [],
  value,
  onChange,
  size = "sm",
  placeholder = "Selecciona…",
  disabled = false,
  className,
  maxHeight = 280,
  searchable = false,
  searchPlaceholder = "Buscar…",
  ...rest
}) {
  const S = sizes[size] ?? sizes.sm;
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [hi, setHi] = useState(-1);
  const [q, setQ] = useState("");

  const labelFromValue = useMemo(() => {
    const i = options.findIndex(o => String(o.value) === String(value ?? ""));
    return i >= 0 ? options[i].label : "";
  }, [options, value]);

  const filtered = useMemo(() => {
    if (!searchable || !q) return options;
    const nq = normalize(q);
    return options.filter(o => normalize(o.label).includes(nq));
  }, [options, q, searchable]);

  const hiBound = filtered.length ? Math.max(0, Math.min(hi, filtered.length - 1)) : -1;

  function toggle() {
    if (disabled) return;
    setOpen(v => !v);
  }

  function updatePosition() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  useEffect(() => {
    if (open) {
      updatePosition();
      // resalta opción actual si está visible en filtrado, si no, primera
      const idx = filtered.findIndex(o => String(o.value) === String(value ?? ""));
      setHi(idx >= 0 ? idx : 0);

      const onResizeScroll = () => updatePosition();
      const onClickAway = (e) => {
        if (!btnRef.current) return;
        if (btnRef.current.contains(e.target) || listRef.current?.contains(e.target)) return;
        setOpen(false);
      };
      window.addEventListener("resize", onResizeScroll);
      window.addEventListener("scroll", onResizeScroll, true);
      window.addEventListener("pointerdown", onClickAway, true);

      // focus al input si hay buscador
      if (searchable) {
        // leve delay para asegurar que se monta
        setTimeout(() => inputRef.current?.focus(), 0);
      }

      return () => {
        window.removeEventListener("resize", onResizeScroll);
        window.removeEventListener("scroll", onResizeScroll, true);
        window.removeEventListener("pointerdown", onClickAway, true);
      };
    } else {
      // al cerrar limpiamos query para no dejar el select “filtrado”
      setQ("");
    }
  }, [open, filtered, searchable, value]);

  useEffect(() => {
    // si cambia el filtro, resalta la primera
    if (open) setHi(filtered.length ? 0 : -1);
  }, [q]); // eslint-disable-line

  function onKeyDown(e) {
    // si el foco está en el input de búsqueda, no interceptamos navegación
    if (e.target === inputRef.current) return;

    if (!open) {
      if ((e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi(i => Math.min(filtered.length - 1, (i < 0 ? 0 : i + 1)));
      scrollIntoView(listRef.current, Math.min(filtered.length - 1, (hi < 0 ? 0 : hi + 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi(i => Math.max(0, (i <= 0 ? 0 : i - 1)));
      scrollIntoView(listRef.current, Math.max(0, (hi <= 0 ? 0 : hi - 1)));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHi(0);
      scrollIntoView(listRef.current, 0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHi(filtered.length - 1);
      scrollIntoView(listRef.current, filtered.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (hiBound >= 0 && filtered[hiBound]) {
        onChange?.(filtered[hiBound].value);
        setOpen(false);
        btnRef.current?.focus();
      }
    }
  }

  function onWheel(e) {
    if (!open) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    setHi((i) => {
      const cur = i < 0 ? 0 : i;
      const next = Math.min(filtered.length - 1, Math.max(0, cur + dir));
      requestAnimationFrame(() => scrollIntoView(listRef.current, next));
      return next;
    });
  }

  function selectAt(i) {
    const opt = filtered[i];
    if (!opt) return;
    onChange?.(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx(
          "group inline-flex items-center justify-between w-full rounded-lg border border-white/10 bg-white/10",
          S.px, S.py, S.text, S.h,
          "focus:outline-none focus:ring-2 focus:ring-white/20",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
        {...rest}
      >
        <span className={clsx("truncate", labelFromValue ? "text-white" : "text-slate-400")}>
          {labelFromValue || placeholder}
        </span>
        <IcChevron className={clsx("text-white transition-transform", open && "rotate-180")} />
      </button>

     {open && (
  <Portal>
    <style>{`
      /* Estilo de scrollbar */
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.15);
        border-radius: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.25);
      }
      /* Firefox */
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.25) transparent;
      }
    `}</style>

    {/* capa a pantalla completa para asegurar z-index y aislamiento */}
    <div className="fixed inset-0 z-[3000] pointer-events-none">
      <div
        className="absolute pointer-events-auto"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
      >
        <div
          ref={listRef}
          role="listbox"
          className={clsx(
            "custom-scrollbar overflow-auto rounded-xl border border-white/10",
            "bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl p-1"
          )}
          style={{ maxHeight }}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          onWheel={onWheel}
        >
          {searchable && (
            <div className="p-1">
              <input
                ref={inputRef}
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder={searchPlaceholder}
                className={clsx(
                  "w-full rounded-lg border border-white/10 bg-white/10 px-2 py-2",
                  "text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/15"
                )}
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="px-2 py-2 text-sm text-slate-300">Sin resultados</div>
          ) : (
            filtered.map((o, i) => {
              const selected = String(o.value) === String(value ?? "");
              const highlighted = i === hiBound;
              return (
                <div
                  key={o.value}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => selectAt(i)}
                  className={clsx(
                    "flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer",
                    "text-sm",
                    highlighted ? "bg-white/10 text-zinc-100" : "text-slate-200 hover:bg-white/10",
                    selected && "ring-1 ring-white/15"
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {selected && <span className="text-[10px] text-slate-300">●</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  </Portal>
)}

    </>
  );
}

function scrollIntoView(container, index) {
  if (!container) return;
  const el = container.children[index + 1] || container.children[index]; // +1 si hay input arriba
  if (!el) return;
  const cTop = container.scrollTop;
  const cBottom = cTop + container.clientHeight;
  const eTop = el.offsetTop;
  const eBottom = eTop + el.offsetHeight;
  if (eTop < cTop) container.scrollTop = eTop;
  else if (eBottom > cBottom) container.scrollTop = eBottom - container.clientHeight;
}
