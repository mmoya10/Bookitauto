import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCashDay,
  fetchCashMovements,
  openCashDay,
  closeCashDay,
  reopenCashDay,
  createCashMovement,
  updateCashMovement,
  deleteCashMovement,
} from "../../api/cash";
import Button from "../../components/common/Button";
import { Input, Select } from "../../components/common/Input";
import Portal from "../../components/common/Portal";
import clsx from "clsx";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";

/* Estilo glass */
const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

/* Utils */
const fmtEUR = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(n || 0));
const isoDay = (d) => format(d, "yyyy-MM-dd");
const prettyDay = (d) => format(d, "EEEE, d 'de' LLLL yyyy", { locale: es });

export default function CashPage() {
  const qc = useQueryClient();

  // Día seleccionado (por defecto hoy)
  const [day, setDay] = useState(() => new Date());

  // Datos del día
  const { data: box } = useQuery({
    queryKey: ["cash-day", isoDay(day)],
    queryFn: () => fetchCashDay(isoDay(day)),
  });

  const { data: moves } = useQuery({
    queryKey: ["cash-moves", isoDay(day)],
    queryFn: () => fetchCashMovements(isoDay(day)),
  });

  const totalDay = useMemo(() => {
    if (!box) return 0;
    const open = Number(box.openingBalance || 0);
    const sum = (moves ?? []).reduce((a, b) => a + Number(b.amount || 0), 0);
    return open + sum;
  }, [box, moves]);

  // Mutaciones
  const mOpen = useMutation({
    mutationFn: (payload) => openCashDay(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-day", isoDay(day)] });
    },
  });

  const mClose = useMutation({
    mutationFn: (payload) => closeCashDay(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-day", isoDay(day)] });
    },
  });

  const mReopen = useMutation({
    mutationFn: (payload) => reopenCashDay(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-day", isoDay(day)] });
    },
  });

  const mCreate = useMutation({
    mutationFn: (payload) => createCashMovement(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-moves", isoDay(day)] });
      qc.invalidateQueries({ queryKey: ["cash-day", isoDay(day)] });
      setMvModal(null);
    },
  });
  const mUpdate = useMutation({
    mutationFn: (payload) => updateCashMovement(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-moves", isoDay(day)] });
      qc.invalidateQueries({ queryKey: ["cash-day", isoDay(day)] });
      setMvModal(null);
    },
  });
  const mDelete = useMutation({
    mutationFn: (payload) => deleteCashMovement(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-moves", isoDay(day)] });
      qc.invalidateQueries({ queryKey: ["cash-day", isoDay(day)] });
    },
  });

  // Modales
  const [mvModal, setMvModal] = useState(null); // { mode: 'create'|'edit', values: {} }
  const [closeModal, setCloseModal] = useState(null); // { expected: number, closingBalance: number, note: '' }

  // ======= UI =======
  return (
    <div className="space-y-5 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Caja</h1>
        <p className="text-sm text-slate-300">
          Apertura y cierre diario, movimientos y consulta de días anteriores.
        </p>
      </header>

      {/* Navegación de días */}
      <section className={clsx(glassCard, "p-6 text-center")}>
  <div className="space-y-3">
    {/* Fecha en grande */}
    <div className="text-2xl font-bold">{prettyDay(day)}</div>

    {/* Estado en grande y centrado */}
    <div>
      {box?.isOpen ? (
        box?.isClosed ? (
          <span className="inline-block px-4 py-1 text-lg font-medium border rounded-full border-emerald-400/40 bg-emerald-500/20 text-emerald-100">
            Cerrada
          </span>
        ) : (
          <span className="inline-block px-4 py-1 text-lg font-medium border rounded-full border-cyan-400/40 bg-cyan-500/20 text-cyan-100">
            Abierta
          </span>
        )
      ) : (
        <span className="inline-block px-4 py-1 text-lg font-medium text-yellow-100 border rounded-full border-yellow-400/40 bg-yellow-500/20">
          No abierta
        </span>
      )}
    </div>

    {/* Navegación de días */}
    <div className="flex justify-center gap-3 pt-2">
      <Button variant="ghost" onClick={() => setDay((d) => addDays(d, -1))}>
        ← Día anterior
      </Button>
      <Button variant="ghost" onClick={() => setDay(new Date())}>
        Hoy
      </Button>
      <Button variant="ghost" onClick={() => setDay((d) => addDays(d, +1))}>
        Día siguiente →
      </Button>
    </div>
  </div>
</section>


      {/* 1) Cabecera de caja (apertura / estado / cierre / reabrir) */}
      <section className={clsx(glassCard, "p-4")}>
        {!box?.isOpen ? (
          <OpenBox
            suggested={box?.suggestedOpening ?? 0}
            suggestedFrom={box?.suggestedFromDate}
            onOpen={(openingBalance, note) =>
              mOpen.mutate({ dateISO: isoDay(day), openingBalance, note })
            }
            loading={mOpen.isPending}
          />
        ) : box?.isClosed ? (
          <ClosedBox
            box={box}
            onReopen={() => mReopen.mutate({ dateISO: isoDay(day) })}
            onAdd={() =>
              setMvModal({
                mode: "create",
                values: {
                  amount: 0,
                  kind: "ingreso",
                  reason: "venta",
                  note: "",
                  atISO: new Date().toISOString(),
                },
              })
            }
          />
        ) : (
          <OpenBoxActions
            openingBalance={box.openingBalance}
            totalDay={totalDay}
            onAdd={() =>
              setMvModal({
                mode: "create",
                values: {
                  amount: 0,
                  kind: "ingreso",
                  reason: "venta",
                  note: "",
                  atISO: new Date().toISOString(),
                },
              })
            }
            onClose={() =>
              setCloseModal({
                expected: totalDay,
                closingBalance: totalDay,
                note: "",
              })
            }
          />
        )}
      </section>

      {/* 2) Movimientos del día */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-semibold">Movimientos</h2>
            <p className="text-xs text-slate-300">
              {box?.isOpen
                ? box?.isClosed
                  ? "Caja cerrada: edita o reabre para añadir."
                  : "Caja abierta: puedes añadir, editar o eliminar."
                : "Caja no abierta: abre para añadir movimientos."}
            </p>
          </div>
          <Button
            variant="primary"
            disabled={!box?.isOpen || box?.isClosed}
            onClick={() =>
              setMvModal({
                mode: "create",
                values: {
                  amount: 0,
                  kind: "ingreso",
                  reason: "venta",
                  note: "",
                  atISO: new Date().toISOString(),
                },
              })
            }
          >
            + Añadir movimiento
          </Button>
        </div>

        <div className="overflow-auto border rounded-xl border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="px-3 py-2">Hora</th>
                <th className="px-3 py-2">Motivo</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Nota</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(moves ?? []).map((m) => (
                <MovementRow
                  key={m.id}
                  mv={m}
                  disabled={!box?.isOpen}
                  onEdit={() => setMvModal({ mode: "edit", values: { ...m } })}
                  onDelete={() => mDelete.mutate({ dateISO: isoDay(day), id: m.id })}
                />
              ))}
              {!moves?.length && (
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

      {/* Modal movimiento */}
      {mvModal && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,560px)] p-5")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">
                  {mvModal.mode === "edit" ? "Editar movimiento" : "Nuevo movimiento"}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setMvModal(null)}>
                  Cerrar
                </Button>
              </div>
              <MovementForm
                values={mvModal.values}
                submitting={mCreate.isPending || mUpdate.isPending}
                onSubmit={(payload) => {
                  if (mvModal.mode === "edit")
                    mUpdate.mutate({ dateISO: isoDay(day), movement: payload });
                  else mCreate.mutate({ dateISO: isoDay(day), movement: payload });
                }}
              />
            </div>
          </div>
        </Portal>
      )}

      {/* Modal cierre */}
      {closeModal && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,560px)] p-5")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Cerrar caja</h3>
                <Button variant="ghost" size="sm" onClick={() => setCloseModal(null)}>
                  Cerrar
                </Button>
              </div>
              <CloseForm
                values={closeModal}
                onSubmit={(closingBalance, note) =>
                  mClose.mutate({ dateISO: isoDay(day), closingBalance, note })
                }
                submitting={mClose.isPending}
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

/* ===== Subcomponentes ===== */

function OpenBox({ suggested, suggestedFrom, onOpen, loading }) {
  const [val, setVal] = useState(suggested);
  const [note, setNote] = useState("");

  useEffect(() => {
    setVal(suggested);
  }, [suggested]);

  return (
    <div className="grid gap-3">
      <div className="text-sm">
        Saldo sugerido de apertura:{" "}
        <b>{fmtEUR(suggested)}</b>
        {suggestedFrom ? (
          <span className="text-slate-300"> (último cierre: {format(new Date(suggestedFrom), "dd/MM/yyyy")})</span>
        ) : (
          <span className="text-slate-300"> (sin historial — puedes ajustar)</span>
        )}
      </div>
      <div className="grid gap-1.5 sm:grid-cols-[220px_1fr]">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Saldo apertura (€)</span>
          <Input type="number" step="0.01" value={val} onChange={(e) => setVal(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Nota</span>
          <Input placeholder="Opcional" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <div>
        <Button variant="primary" onClick={() => onOpen(Number(val || 0), note)} disabled={loading}>
          {loading ? "Abriendo…" : "Abrir caja"}
        </Button>
      </div>
    </div>
  );
}

function OpenBoxActions({ openingBalance, totalDay, onAdd, onClose }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Stat label="Apertura" value={fmtEUR(openingBalance)} />
      <Stat label="Total actual" value={fmtEUR(totalDay)} />
      <div className="flex items-end gap-2">
        <Button variant="ghost" onClick={onAdd}>
          + Añadir movimiento
        </Button>
        <Button variant="primary" onClick={onClose}>
          Cerrar caja
        </Button>
      </div>
    </div>
  );
}

function ClosedBox({ box, onReopen, onAdd }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Stat label="Apertura" value={fmtEUR(box.openingBalance)} />
      <Stat label="Cierre" value={fmtEUR(box.closingBalance)} />
      <div className="flex items-end gap-2">
        <Button variant="ghost" onClick={onReopen}>Reabrir</Button>
        <Button variant="ghost" onClick={onAdd} disabled>+ Añadir movimiento</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-3 border rounded-xl border-white/10 bg-white/5">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function MovementRow({ mv, disabled, onEdit, onDelete }) {
  const positive = Number(mv.amount) >= 0;
  return (
    <tr className="border-t border-white/10">
      <td className="px-3 py-2">{format(new Date(mv.atISO), "HH:mm")}</td>
      <td className="px-3 py-2 capitalize">{mv.reason || "-"}</td>
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
        {positive ? `+${fmtEUR(mv.amount)}` : `-${fmtEUR(Math.abs(mv.amount))}`}
      </td>
      <td className="px-3 py-2 text-slate-300">{mv.note || "-"}</td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit} disabled={disabled}>
            Editar
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete} disabled={disabled}>
            Eliminar
          </Button>
        </div>
      </td>
    </tr>
  );
}

function MovementForm({ values, submitting, onSubmit }) {
  const [v, setV] = useState({
    id: values.id,
    amount: values.amount ?? 0,
    kind: values.kind ?? "ingreso",
    reason: values.reason ?? "venta",
    note: values.note ?? "",
    atISO: values.atISO ?? new Date().toISOString(),
  });

  // sincronizar signo por tipo
  useEffect(() => {
    setV((prev) => ({
      ...prev,
      amount: v.kind === "ingreso" ? Math.abs(Number(prev.amount || 0)) : -Math.abs(Number(prev.amount || 0)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.kind]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          id: v.id,
          amount: Number(v.amount || 0),
          kind: v.kind,
          reason: v.reason,
          note: v.note,
          atISO: v.atISO,
        });
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Tipo</span>
          <Select value={v.kind} onChange={(e) => setV((p) => ({ ...p, kind: e.target.value }))}>
            <option value="ingreso">Ingreso (+)</option>
            <option value="gasto">Gasto (-)</option>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Cantidad</span>
          <Input
            type="number"
            step="0.01"
            value={v.amount}
            onChange={(e) => setV((p) => ({ ...p, amount: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Motivo</span>
          <Select value={v.reason} onChange={(e) => setV((p) => ({ ...p, reason: e.target.value }))}>
            <option value="venta">Venta</option>
            <option value="compra">Compra</option>
            <option value="retirada">Retirada</option>
            <option value="ajuste">Ajuste</option>
            <option value="otro">Otro</option>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Fecha/Hora</span>
          <Input
            type="datetime-local"
            value={toLocalInput(v.atISO)}
            onChange={(e) =>
              setV((p) => ({
                ...p,
                atISO: fromLocalInput(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Nota</span>
        <Input placeholder="Opcional" value={v.note} onChange={(e) => setV((p) => ({ ...p, note: e.target.value }))} />
      </div>

      <div className="mt-1">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : v.id ? "Guardar cambios" : "Crear movimiento"}
        </Button>
      </div>
    </form>
  );
}

function CloseForm({ values, onSubmit, submitting }) {
  const [closing, setClosing] = useState(values.closingBalance);
  const [note, setNote] = useState(values.note || "");
  const edited = Number(closing) !== Number(values.expected);
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (edited && !note.trim()) {
          alert("Si modificas el importe de cierre debes indicar un comentario.");
          return;
        }
        onSubmit(Number(closing || 0), note.trim());
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="p-3 border rounded-xl border-white/10 bg-white/5">
          <div className="text-xs text-slate-300">Total esperado</div>
          <div className="text-lg font-semibold">{fmtEUR(values.expected)}</div>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Importe de cierre (€)</span>
          <Input type="number" step="0.01" value={closing} onChange={(e) => setClosing(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">
          Comentario {edited && <span className="text-rose-200">(obligatorio por ajuste)</span>}
        </span>
        <Input placeholder="Ej. descuadre por TPV / cambio" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="mt-1">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Cerrando…" : "Confirmar cierre"}
        </Button>
      </div>
    </form>
  );
}

/* ===== Utils fecha para inputs ===== */
function toLocalInput(iso) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
function fromLocalInput(local) {
  // local es 'YYYY-MM-DDTHH:mm'
  const d = new Date(local);
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d.toISOString();
}
