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

/**
 * Select headless estilo glass
 * Props:
 * - options: Array<{ value: string, label: string }>
 * - value: string | null
 * - onChange: (value: string) => void
 * - size?: "md" | "sm"
 * - placeholder?: string
 * - disabled?: boolean
 * - className?: string
 * - maxHeight?: number (px)
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
  ...rest
}) {
  const S = sizes[size] ?? sizes.sm;
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [hi, setHi] = useState(-1);

  const idxByValue = useMemo(
    () => options.findIndex(o => String(o.value) === String(value ?? "")),
    [options, value]
  );

  const label = idxByValue >= 0 ? options[idxByValue].label : "";

  function toggle() {
    if (disabled) return;
    setOpen(v => !v);
  }

  // Recalcular posición del popover
  function updatePosition() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  // Abrir: set highlight en opción actual y posicionar
  useEffect(() => {
    if (open) {
      updatePosition();
      setHi(idxByValue >= 0 ? idxByValue : 0);

      const onResizeScroll = () => updatePosition();
      const onClickAway = (e) => {
        if (!btnRef.current) return;
        if (btnRef.current.contains(e.target) || listRef.current?.contains(e.target)) return;
        setOpen(false);
      };
      window.addEventListener("resize", onResizeScroll);
      window.addEventListener("scroll", onResizeScroll, true);
      window.addEventListener("pointerdown", onClickAway, true);
      return () => {
        window.removeEventListener("resize", onResizeScroll);
        window.removeEventListener("scroll", onResizeScroll, true);
        window.removeEventListener("pointerdown", onClickAway, true);
      };
    }
  }, [open, idxByValue]);

  // Teclado
  function onKeyDown(e) {
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
      setHi(i => Math.min(options.length - 1, (i < 0 ? 0 : i + 1)));
      scrollIntoView(listRef.current, hi + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi(i => Math.max(0, (i <= 0 ? 0 : i - 1)));
      scrollIntoView(listRef.current, Math.max(0, hi - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHi(0);
      scrollIntoView(listRef.current, 0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHi(options.length - 1);
      scrollIntoView(listRef.current, options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (hi >= 0 && options[hi]) {
        onChange?.(options[hi].value);
        setOpen(false);
        btnRef.current?.focus();
      }
    }
  }

  function selectAt(i) {
    const opt = options[i];
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
        <span className={clsx("truncate", !label && "text-slate-400")}>
          {label || placeholder}
        </span>
        <IcChevron className={clsx("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <Portal>
          <div
            className="fixed z-[1300]"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div
              ref={listRef}
              role="listbox"
              className={clsx(
                "max-h-[280px] overflow-auto rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl p-1",
              )}
              style={{ maxHeight }}
              tabIndex={-1}
              onKeyDown={onKeyDown}
            >
              {options.map((o, i) => {
                const selected = String(o.value) === String(value ?? "");
                const highlighted = i === hi;
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
              })}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

function scrollIntoView(container, index) {
  if (!container) return;
  const el = container.children[index];
  if (!el) return;
  const cTop = container.scrollTop;
  const cBottom = cTop + container.clientHeight;
  const eTop = el.offsetTop;
  const eBottom = eTop + el.offsetHeight;
  if (eTop < cTop) container.scrollTop = eTop;
  else if (eBottom > cBottom) container.scrollTop = eBottom - container.clientHeight;
}
