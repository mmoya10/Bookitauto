// src/components/collection/SelectableGallery.jsx
import { useMemo, useState, useEffect } from "react";
import clsx from "clsx";
import Button from "../../components/common/Button";
import { GalleryVertical, TableProperties } from "lucide-react";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function SelectableGallery({
  items = [],
  view: controlledView, // "table" | "cards" (opcional controlado)
  onViewChange, // (v)=>void
  toCard, // (item)=>{ id,title,subtitle,priceNode?,imageUrl, onEdit? }
  toTable, // { columns: [{key,label,render:(item)=>node}], getId:(item)=>string, onEdit? }
  onDeleteSelected, // (ids)=>void
  className,
}) {
  // Vista (controlada o interna)
  const [view, setView] = useState(controlledView || "cards");
  useEffect(() => {
    if (controlledView) setView(controlledView);
  }, [controlledView]);
  const setViewSafe = (v) => {
    setView(v);
    onViewChange?.(v);
  };

  // Selección interna
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    setSelected([]);
  }, [items]); // reset al cambiar items
  const allIds = useMemo(
    () =>
      items.map((it) => (toTable?.getId ? toTable.getId(it) : toCard(it).id)),
    [items, toTable, toCard]
  );
  const allChecked = selected.length > 0 && selected.length === allIds.length;
  const toggleAll = () => setSelected(allChecked ? [] : allIds);
  const toggleOne = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  return (
    <section className={clsx(glassCard, "p-3", className)}>
      {/* Toolbar interna */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="text-sm text-slate-300">
          Seleccionados: <b>{selected.length}</b>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onDeleteSelected?.(selected)}
            disabled={!selected.length}
            title={
              selected.length
                ? `Eliminar ${selected.length} elemento(s)`
                : "Nada seleccionado"
            }
          >
            Eliminar seleccionados ({selected.length})
          </Button>
          <div className="flex items-center gap-1">
            <button
  type="button"
  onClick={() => setViewSafe("cards")}
  aria-label="Ver como tarjetas"
  aria-pressed={view === "cards"}
  className={clsx(
    "inline-flex items-center justify-center rounded-lg p-2",
    "border border-white/10 hover:bg-white/15 transition",
    view === "cards"
      ? "bg-violet-600 text-white border-violet-500"
      : "bg-white/10 text-slate-300"
  )}
  title="Tarjetas"
>
  <GalleryVertical className="w-5 h-5" />
</button>

<button
  type="button"
  onClick={() => setViewSafe("table")}
  aria-label="Ver como tabla"
  aria-pressed={view === "table"}
  className={clsx(
    "inline-flex items-center justify-center rounded-lg p-2",
    "border border-white/10 hover:bg-white/15 transition",
    view === "table"
      ? "bg-violet-600 text-white border-violet-500"
      : "bg-white/10 text-slate-300"
  )}
  title="Tabla"
>
  <TableProperties className="w-5 h-5" />
</button>

          </div>
        </div>
      </div>

      {/* Contenido */}
      {view === "table" ? (
        <TableView
          items={items}
          toTable={toTable}
          selected={selected}
          toggleAll={toggleAll}
          allChecked={allChecked}
          toggleOne={toggleOne}
        />
      ) : (
        <CardsView
          items={items}
          toCard={toCard}
          selected={selected}
          toggleOne={toggleOne}
        />
      )}

      {!items?.length && (
        <div className="px-3 py-8 text-sm text-center text-slate-400">
          No hay elementos que coincidan.
        </div>
      )}
    </section>
  );
}

/* ============ Vista Tabla ============ */
function TableView({
  items,
  toTable,
  selected,
  toggleAll,
  allChecked,
  toggleOne,
}) {
  const cols = toTable?.columns || [];
  const getId = toTable?.getId || ((it) => it.id);
  const onEdit = toTable?.onEdit;

  return (
    <div className="overflow-auto border rounded-xl border-white/10 bg-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-300">
            <th className="px-3 py-2">
              <input
                type="checkbox"
                className="rounded size-4 border-white/20 bg-white/10"
                checked={allChecked}
                onChange={toggleAll}
              />
            </th>
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2">
                {c.label}
              </th>
            ))}
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const id = getId(it);
            return (
              <tr key={id} className="border-t border-white/10">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    className="rounded size-4 border-white/20 bg-white/10"
                    checked={selected.includes(id)}
                    onChange={() => toggleOne(id)}
                  />
                </td>
                {cols.map((c) => (
                  <td key={c.key} className="px-3 py-2">
                    {c.render(it)}
                  </td>
                ))}
                <td className="px-3 py-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(it)}
                    >
                      Editar
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============ Vista Tarjetas ============ */
/* Imagen arriba visible COMPLETA; datos en panel sólido debajo + acciones extra opcionales */
function CardsView({ items, toCard, selected, toggleOne }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => {
        const {
          id,
          title,
          subtitle,
          priceNode,
          imageUrl,
          onEdit,
          actionsNode,
        } = toCard(it);
        return (
          <div
            key={id}
            className="overflow-hidden border rounded-2xl border-white/10 bg-white/5"
          >
            {/* Imagen arriba */}
            <div className="relative w-full h-48">
              <img
                src={imageUrl}
                alt=""
                className="absolute object-cover w-auto h-full -translate-x-1/2 -translate-y-1/2 select-none left-1/2 top-1/2 max-w-none"
                draggable={false}
              />
              {/* Checkbox selección */}
              <label className="absolute inline-flex items-center gap-2 px-2 py-1 text-xs border rounded-lg left-2 top-2 border-white/10 bg-black/35 backdrop-blur">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-white/20 bg-white/10"
                  checked={selected.includes(id)}
                  onChange={() => toggleOne(id)}
                />
                Seleccionar
              </label>
            </div>

            {/* Datos sólidos */}
            <div className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{title}</div>
                  {subtitle && (
                    <div className="text-xs text-slate-300 line-clamp-2">
                      {subtitle}
                    </div>
                  )}
                </div>
                {priceNode && <div className="shrink-0">{priceNode}</div>}
              </div>

              {(onEdit || actionsNode) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(it)}
                    >
                      Editar
                    </Button>
                  )}
                  {/* Acciones adicionales inyectadas por el llamador */}
                  {actionsNode}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
