import { useEffect, useMemo, useState } from "react";
import Button from "../common/Button";
import { Input } from "../common/Input";
import Select from "../common/Select";
import MultiSelect from "../common/MultiSelect";

export default function CompleteForm({ event, products = [], calendars = [], onCancel, onSubmit }) {
  const [status, setStatus] = useState("completado"); // "no_presentado" | "completado"
  const payment   = event.extendedProps?.payment ?? "tienda";

  const [productsBought, setProductsBought] = useState([]);
  const [totalCobrado, setTotalCobrado] = useState(0);
  const [tiendapago, setTiendapago] = useState(event.extendedProps?.tiendapago || "efectivo");

  const canPaymentChoice = payment === "tienda";

  // ===== Servicio (calendario + extras) editables en Resolver =====
  const [calendarId, setCalendarId] = useState(event.extendedProps?.calendarId || calendars[0]?.id || "");
  const [extraIds, setExtraIds] = useState(event.extendedProps?.extraIds || []);

  const selectedCal = useMemo(
    () => (calendars || []).find((c) => c.id === calendarId),
    [calendars, calendarId]
  );

  const extrasOpts = useMemo(() => {
    const ids = selectedCal?.extrasSupported || [];
    return (calendars || [])
      .filter((c) => ids.includes(c.id))
      .map((e) => ({ id: e.id, label: e.name, price: Number(e.price || 0) }));
  }, [selectedCal, calendars]);

  const serviceTotal = useMemo(() => {
    const base = Number(selectedCal?.price || 0);
    const ex = extrasOpts
      .filter((x) => extraIds.includes(x.id))
      .reduce((a, x) => a + Number(x.price || 0), 0);
    return +(base + ex).toFixed(2);
  }, [selectedCal, extrasOpts, extraIds]);

  // ===== Productos =====
  const priceOf = (p) => Number(p?.salePrice ?? p?.price ?? 0);
  const productTotal = (productsBought ?? [])
    .map((id) => (products || []).find((p) => p.id === id))
    .filter(Boolean)
    .reduce((acc, p) => acc + priceOf(p), 0);

  // Mínimo a cobrar = servicio + productos
  const minDue = +(serviceTotal + productTotal).toFixed(2);

  // Inicializa totalCobrado como mínimo
  useEffect(() => {
    setTotalCobrado((t) => {
      const num = Number(t) || 0;
      return num < minDue ? minDue : num;
    });
  }, [minDue]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const productNames = (productsBought ?? [])
          .map((id) => (products || []).find((p) => p.id === id)?.name)
          .filter(Boolean)
          .join(", ");
        onSubmit?.({
          status,
          // Servicio actualizado
          calendarId,
          extraIds,
          serviceTotal,
          // Productos
          productsBought,
          productNames,
          productTotal,
          // Cobro
          totalCobrado: Number(totalCobrado),
          tiendapago,
        });
      }}
    >
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Estado</span>
        <div className="flex gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="st" checked={status === "no_presentado"} onChange={() => setStatus("no_presentado")} />
            No presentado
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="st" checked={status === "completado"} onChange={() => setStatus("completado")} />
            Completado
          </label>
        </div>
      </div>

      {status === "completado" && (
        <>
          {/* Servicio */}
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Servicio</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <span className="text-xs text-slate-300">Calendario</span>
                <Select
                  options={(calendars ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  value={calendarId}
                  onChange={(val) => { setCalendarId(val); setExtraIds([]); }}
                  searchable
                  searchPlaceholder="Buscar calendario"
                />
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-slate-300">Extras</span>
                <MultiSelect
                  items={extrasOpts.map((x) => ({ id: x.id, label: `${x.label} (${x.price.toFixed(2)}€)` }))}
                  values={extraIds}
                  onChange={setExtraIds}
                  placeholder={extrasOpts.length ? "Selecciona extras" : "No hay extras"}
                  disabled={!extrasOpts.length}
                  showSelectAll
                  selectAllLabel="Todos"
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Importe servicio: {serviceTotal.toFixed(2)} €
            </div>
          </div>

          {/* Productos */}
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Productos</span>
            <MultiSelect
              items={(products ?? []).map((p) => ({ id: p.id, label: `${p.name} (${(p.salePrice ?? p.price).toFixed(2)}€)` }))}
              values={productsBought}
              onChange={setProductsBought}
              placeholder="Selecciona productos vendidos"
              showSelectAll
              selectAllLabel="Todos"
            />
            <div className="text-[11px] text-slate-400">Importe productos: {productTotal.toFixed(2)} €</div>
          </div>

          {/* Cobro */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <span className="text-xs text-slate-300">Total a cobrar (€)</span>
              <Input type="number" step="0.01" min={minDue} value={totalCobrado} onChange={(e) => setTotalCobrado(e.target.value)} />
              <div className="text-[11px] text-slate-400">
                Servicio: {serviceTotal.toFixed(2)} € · Productos: {productTotal.toFixed(2)} € ·
                Mín.: {minDue.toFixed(2)} € · Propina: {Math.max(0, Number(totalCobrado) - minDue).toFixed(2)} €
              </div>
            </div>

            {canPaymentChoice && (
              <div className="grid gap-1.5">
                <span className="text-xs text-slate-300">Método de pago</span>
                <Select
                  options={[{ value: "efectivo", label: "Efectivo" }, { value: "tarjeta", label: "Tarjeta" }]}
                  value={tiendapago}
                  onChange={(val) => setTiendapago(val)}
                />
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex gap-2">
        <Button type="submit">Aceptar</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
