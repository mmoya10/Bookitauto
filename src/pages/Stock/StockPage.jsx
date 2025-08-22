import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInventory,
  fetchLowStock,
  fetchMovements,
  createMovement,
  updateMovement,
  deleteMovement,
} from "../../api/stock";
import { fetchProducts } from "../../api/products";
import Button from "../../components/common/Button";
import { Input, Select } from "../../components/common/Input";
import Portal from "../../components/common/Portal";
import clsx from "clsx";
import { addMonths, startOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

/* Iconos */
const IcChevronL = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
);
const IcChevronR = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
);
const IcTick = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
);

/* ===== Componente ===== */
export default function StockPage() {
  const qc = useQueryClient();

  // Inventario + productos base
  const { data: inventory } = useQuery({ queryKey: ["inventory"], queryFn: fetchInventory });
  const { data: lowStock } = useQuery({ queryKey: ["low-stock"], queryFn: fetchLowStock });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  // Selección de producto (para ver movimientos del mes)
  const [selectedId, setSelectedId] = useState(null);

  // Buscador (carrusel 2)
  const [q, setQ] = useState("");

  // Mes visible en movimientos (si hay producto seleccionado)
  const [cursor, setCursor] = useState(() => new Date());
  const monthLabel = format(cursor, "LLLL yyyy", { locale: es });
  const periodStart = startOfMonth(cursor);
  const periodEnd = addMonths(periodStart, 1); // semiabierto [start, end)

  // Movimientos: si hay producto seleccionado → del mes; si no, últimos 20
  const { data: movements } = useQuery({
    queryKey: ["stock-moves", selectedId, periodStart.toISOString(), periodEnd.toISOString()],
    queryFn: () =>
      selectedId
        ? fetchMovements({ start: periodStart, end: periodEnd, productId: selectedId })
        : fetchMovements({ limit: 20 }),
  });

  // ---- estado modal (FIX) ----
  const [modal, setModal] = useState(null);
  // -----------------------------

  // Mutaciones
  const mCreate = useMutation({
    mutationFn: createMovement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-moves"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setModal(null);
    },
  });
  const mUpdate = useMutation({
    mutationFn: updateMovement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-moves"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setModal(null);
    },
  });
  const mDelete = useMutation({
    mutationFn: deleteMovement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-moves"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  // Filtros en carrusel de productos
  const filteredInv = useMemo(() => {
    const list = inventory ?? [];
    const text = q.trim().toLowerCase();
    if (!text) return list;
    return list.filter((p) => p.name.toLowerCase().includes(text));
  }, [inventory, q]);

  // ====== UI ======
  return (
    <div className="space-y-5 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Stock</h1>
        <p className="text-sm text-slate-300">
          Control de alertas, consulta de movimientos y actualización de existencias.
        </p>
      </header>

      {/* 1) Alertas de stock */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="mb-2">
          <h2 className="text-base font-semibold">Alertas de bajo stock</h2>
          <p className="text-xs text-slate-300">Productos por debajo del mínimo de aviso.</p>
        </div>

        {lowStock && lowStock.length ? (
          <HScroll>
            {lowStock.map((p) => (
              <div key={p.id} className="min-w-[240px] rounded-xl border border-red-400/30 bg-red-500/10 p-3">
                <div className="flex items-center gap-3">
                  <img src={p.imageUrl} alt="" className="h-12 w-16 rounded-lg object-cover border border-white/10" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-slate-300">
                      Stock <b>{p.stock}</b> / Mín. <b>{p.minAlert}</b>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </HScroll>
        ) : (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 flex items-center gap-3">
            <div className="grid place-items-center rounded-lg border border-white/10 bg-white/10 w-8 h-8">
              <IcTick />
            </div>
            <div>
              <div className="font-medium">Todo correcto</div>
              <div className="text-xs text-slate-300">No hay productos por debajo del mínimo.</div>
            </div>
          </div>
        )}
      </section>

      {/* 2) Carrusel de productos + buscador */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Productos</h2>
            <p className="text-xs text-slate-300">Selecciona un producto para ver sus movimientos.</p>
          </div>
          <div className="w-[min(100%,320px)]">
            <Input placeholder="Buscar producto…" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>
        </div>

        <HScroll>
          {(filteredInv ?? []).map((p) => {
            const selected = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(selected ? null : p.id)}
                className={clsx(
                  "min-w-[240px] text-left rounded-xl border p-3 transition",
                  selected
                    ? "border-transparent text-white bg-[linear-gradient(90deg,#7c3aed,#22d3ee)]"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <img src={p.imageUrl} alt="" className="h-12 w-16 rounded-lg object-cover border border-white/10" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-slate-200">Stock: <b>{p.stock}</b></div>
                    <div className="text-[11px] text-slate-300">Mín.: {p.minAlert}</div>
                  </div>
                </div>
              </button>
            );
          })}
          {!filteredInv?.length && (
            <div className="min-w-[240px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
              No hay resultados para la búsqueda.
            </div>
          )}
        </HScroll>
      </section>

      {/* 3) Movimientos */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">
              {selectedId ? "Movimientos del mes" : "Últimos movimientos"}
            </h2>
            <p className="text-xs text-slate-300">
              {selectedId
                ? `Producto seleccionado · ${monthLabel}`
                : "Muestra los movimientos más recientes"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedId && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setCursor(d => addMonths(d, -1))}>
                  ← Mes anterior
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCursor(d => addMonths(d, +1))}>
                  Mes siguiente →
                </Button>
              </>
            )}
            <Button
              variant="primary"
              onClick={() =>
                setModal({
                  mode: "create",
                  movement: {
                    productId: selectedId || (inventory?.[0]?.id ?? ""),
                    qty: 0,
                    reason: "venta",
                    kind: "gasto",
                    date: toLocalInput(new Date()),
                  },
                })
              }
            >
              + Añadir movimiento
            </Button>
          </div>
        </div>

        <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Motivo</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(movements ?? []).map((m) => (
                <MovementRow
                  key={m.id}
                  mv={m}
                  products={products ?? []}
                  onEdit={() =>
                    setModal({
                      mode: "edit",
                      movement: {
                        id: m.id,
                        productId: m.productId,
                        qty: m.qty,
                        reason: m.reason,
                        kind: m.kind,
                        date: toLocalInput(m.date),
                      },
                    })
                  }
                  onDelete={() => mDelete.mutate(m.id)}
                />
              ))}

              {!movements?.length && (
                <tr>
                  <td className="px-3 py-3 text-slate-300" colSpan={6}>
                    No hay movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal crear/editar movimiento */}
      {modal && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,640px)] p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  {modal.mode === "edit" ? "Editar movimiento" : "Nuevo movimiento"}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cerrar</Button>
              </div>
              <MovementForm
                movement={modal.movement}
                products={inventory ?? []}
                submitting={mCreate.isPending || mUpdate.isPending}
                onSubmit={(payload) => {
                  if (modal.mode === "edit") mUpdate.mutate(payload);
                  else mCreate.mutate(payload);
                }}
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

/* =================== Subcomponentes =================== */
function MovementRow({ mv, products, onEdit, onDelete }) {
  const p = products.find((x) => x.id === mv.productId);
  const name = p?.name ?? mv.productId;
  const positive = Number(mv.qty) >= 0;
  return (
    <tr className="border-t border-white/10">
      <td className="px-3 py-2">{formatDateTime(mv.date)}</td>
      <td className="px-3 py-2">{name}</td>
      <td className="px-3 py-2 capitalize">{mv.reason}</td>
      <td className="px-3 py-2">
        <span
          className={clsx(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
            mv.kind === "ingreso"
              ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
              : "border-rose-400/40 bg-rose-500/20 text-rose-100"
          )}
        >
          {mv.kind}
        </span>
      </td>
      <td className={clsx("px-3 py-2 font-medium", positive ? "text-emerald-200" : "text-rose-200")}>
        {positive ? `+${mv.qty}` : mv.qty}
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>
          <Button variant="danger" size="sm" onClick={onDelete}>Eliminar</Button>
        </div>
      </td>
    </tr>
  );
}

function MovementForm({ movement, products, onSubmit, submitting }) {
  const [form, setForm] = useState({ ...movement });

  useEffect(() => { setForm({ ...movement }); }, [movement]);

  // sincroniza tipo con motivo por defecto (editable)
  useEffect(() => {
    if (form.reason === "venta" && form.kind !== "gasto") setForm((f) => ({ ...f, kind: "gasto" }));
    if (form.reason === "compra" && form.kind !== "ingreso") setForm((f) => ({ ...f, kind: "ingreso" }));
  }, [form.reason]); // eslint-disable-line

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          id: form.id,
          productId: form.productId,
          qty: Number(form.qty),
          reason: form.reason,
          kind: form.kind,
          date: new Date(form.date).toISOString(),
        };
        onSubmit(payload);
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Producto</span>
          <Select value={form.productId} onChange={(e)=>setForm(f=>({ ...f, productId: e.target.value }))}>
            {products.map((p)=>(
              <option key={p.id} value={p.id}>{p.name} · stock {p.stock}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Cantidad</span>
          <Input
            type="number"
            step="1"
            value={form.qty}
            onChange={(e)=>setForm(f=>({ ...f, qty: e.target.value }))}
          />
          <div className="text-[11px] text-slate-400">
            Compra = positivo (ingresa stock) · Venta = negativo (sale stock)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Motivo</span>
          <Select value={form.reason} onChange={(e)=>setForm(f=>({ ...f, reason: e.target.value }))}>
            <option value="venta">Venta</option>
            <option value="compra">Compra</option>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Tipo</span>
          <Select value={form.kind} onChange={(e)=>setForm(f=>({ ...f, kind: e.target.value }))}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Fecha</span>
        <Input
          type="datetime-local"
          value={form.date}
          onChange={(e)=>setForm(f=>({ ...f, date: e.target.value }))}
        />
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : form.id ? "Guardar cambios" : "Crear movimiento"}
        </Button>
      </div>
    </form>
  );
}

/* ===== Carousel reutilizable con flechas ===== */
function HScroll({ children }) {
  const ref = useRef(null);
  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.9), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 pr-1 snap-x">
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center rounded-full border border-white/10 bg-white/10 w-8 h-8 hover:bg-white/20"
        aria-label="Scroll left"
        title="Anterior"
      >
        <IcChevronL />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center rounded-full border border-white/10 bg-white/10 w-8 h-8 hover:bg-white/20"
        aria-label="Scroll right"
        title="Siguiente"
      >
        <IcChevronR />
      </button>
    </div>
  );
}

/* ===== Utils fecha ===== */
function toLocalInput(d) {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0,16);
}
function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    });
  } catch { return ""; }
}
