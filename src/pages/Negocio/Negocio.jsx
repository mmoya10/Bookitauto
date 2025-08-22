// src/pages/Negocio/Negocio.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Button from "../../components/common/Button";
import Portal from "../../components/common/Portal";
import Toggle from "../../components/common/Toggle";
import {
  fetchBusiness,
  updateBusiness,
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../../api/business";

const glass = "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]";
const secTitle = "text-sm font-semibold text-zinc-100";

export default function Negocio() {
  const qc = useQueryClient();
  const { data: business } = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const { data: branches } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches, enabled: !!business });

  const mUpdate = useMutation({
    mutationFn: updateBusiness,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business"] }),
  });

  const [modal, setModal] = useState({ open: false, editing: null });
  const [reminderModal, setReminderModal] = useState({ open: false, editing: null });

  if (!business) return <div className="p-4">Cargando negocio…</div>;

// Mostrar solo una sucursal si NO hay modo sucursal
 const singleMode = !business.branchMode;
 const shownBranches = singleMode
   ? (branches?.length ? [branches[0]] : [])
   : (branches || []);

  // ===== Helpers notificaciones =====
  const notif = business.notifications ?? {
    channels: { email: true, sms: false, whatsapp: false },
    events: { confirmation: true, cancellation: true, rescheduled: true },
    reminders: [{ id: "r1", hoursBefore: 24 }, { id: "r2", hoursBefore: 3 }],
    review: { hoursAfter: 4, followup: true },
  };

  function setChannels(patch) {
    mUpdate.mutate({ notifications: { channels: patch } });
  }
  function setEvents(patch) {
    mUpdate.mutate({ notifications: { events: patch } });
  }
  function setReminders(nextList) {
    // Validar 1..3
    const list = nextList.slice(0, 3);
    if (list.length < 1) return;
    mUpdate.mutate({ notifications: { reminders: list } });
  }
  function setReview(patch) {
    // clamp 2..48 horas
    const next = { ...notif.review, ...patch };
    if ("hoursAfter" in patch) {
      next.hoursAfter = Math.max(2, Math.min(48, Number(patch.hoursAfter || 4)));
    }
    mUpdate.mutate({ notifications: { review: next } });
  }

  return (
    <div className="p-4 space-y-4">
      {/* Datos principales */}
      <div className={clsx(glass, "p-4 grid gap-4 md:grid-cols-2")}>
        <div className="flex items-center gap-4">
          <img src={business.logoUrl} alt="Logo" className="size-16 rounded-lg border border-white/10 object-cover" />
          <div>
            <div className="text-lg font-semibold">{business.nombre}</div>
            <div className="text-xs text-slate-300">{business.razonSocial}</div>
          </div>
        </div>
        <div className="grid text-sm gap-1">
          <div>CIF/DNI: {business.cif}</div>
          <div>Email: {business.email}</div>
          <div>Tel: {business.telefono}</div>
        </div>
      </div>

      {/* Toggle modo sucursal */}
      <div className={clsx(glass, "p-4")}>
        <Toggle
          align="left"
          label="Modo sucursales"
          description="Activa para gestionar múltiples sucursales"
          checked={business.branchMode}
          onChange={(v) => mUpdate.mutate({ branchMode: v })}
        />
      </div>

      {/* ===== Notificaciones de calendario ===== */}
      <section className={clsx(glass, "p-4 space-y-4")}>
        <div className="text-base font-semibold">Notificaciones de calendario</div>

        {/* Canales */}
        <div>
          <div className={secTitle}>Canales de envío</div>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <Toggle
              align="left"
              label="Correo"
              description="Enviar emails automáticos"
              checked={!!notif.channels.email}
              onChange={(v) => setChannels({ email: v })}
            />
            <Toggle
              align="left"
              label="SMS"
              description="Enviar SMS (puede tener coste)"
              checked={!!notif.channels.sms}
              onChange={(v) => setChannels({ sms: v })}
            />
            <Toggle
              align="left"
              label="WhatsApp"
              description="Enviar mensajes por WhatsApp"
              checked={!!notif.channels.whatsapp}
              onChange={(v) => setChannels({ whatsapp: v })}
            />
          </div>
        </div>

        {/* Eventos */}
        <div>
          <div className={secTitle}>Eventos</div>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <Toggle
              align="left"
              label="Confirmación"
              description="Cuando se crea o confirma una cita"
              checked={!!notif.events.confirmation}
              onChange={(v) => setEvents({ confirmation: v })}
            />
            <Toggle
              align="left"
              label="Cancelación"
              description="Cuando se cancela una cita"
              checked={!!notif.events.cancellation}
              onChange={(v) => setEvents({ cancellation: v })}
            />
            <Toggle
              align="left"
              label="Reprogramación"
              description="Cuando se cambia la hora/fecha"
              checked={!!notif.events.rescheduled}
              onChange={(v) => setEvents({ rescheduled: v })}
            />
          </div>
        </div>

        {/* Avisos (recordatorios) */}
        <div>
          <div className={secTitle}>Avisos (recordatorios)</div>
          <p className="text-xs text-slate-300">
            Se envían antes de la cita. Mínimo 1 y máximo 3. Por defecto: 1 día y 3 horas antes.
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {(notif.reminders || []).map((r) => (
              <ChipReminder
                key={r.id}
                r={r}
                canDelete={(notif.reminders || []).length > 1}
                onEdit={() => setReminderModal({ open: true, editing: r })}
                onDelete={() => setReminders((notif.reminders || []).filter((x) => x.id !== r.id))}
              />
            ))}
            {(notif.reminders || []).length < 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReminderModal({ open: true, editing: null })}
              >
                Añadir aviso
              </Button>
            )}
          </div>
        </div>

        {/* Reseña */}
        <div>
          <div className={secTitle}>Reseña</div>
          <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="grid gap-1">
              <span className="text-xs text-slate-300">Enviar después de</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={48}
                  value={notif.review?.hoursAfter ?? 4}
                  onChange={(e) => setReview({ hoursAfter: Number(e.target.value) })}
                  className="w-28 rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                />
                <span className="text-sm">horas (min 2h · máx 48h)</span>
              </div>
            </label>

            <Toggle
              align="left"
              label="2º correo si no hay reseña"
              description="Envia un recordatorio adicional"
              checked={!!notif.review?.followup}
              onChange={(v) => setReview({ followup: v })}
            />
          </div>
        </div>
      </section>

      {/* Sucursales */}
      <section className={clsx(glass, "p-4")}>
        <div className="mb-3 flex items-center justify-between">
          <div className={secTitle}>Sucursales</div>
          <Button
            onClick={() => setModal({ open: true, editing: null })}
            disabled={singleMode && shownBranches.length >= 1}
            title={singleMode ? "Activa el modo sucursales para añadir más" : "Añadir sucursal"}
          >
            Añadir
          </Button>
        </div>

        {!shownBranches?.length ? (
          <div className="text-sm text-slate-300">Aún no hay sucursales.</div>
        ) : (
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="bg-white/5 text-left">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Dirección</th>
                  <th className="px-3 py-2">CP</th>
                  <th className="px-3 py-2">Ciudad</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Teléfono</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shownBranches.map((b) => (
                  <tr key={b.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{b.nombre}</td>
                    <td className="px-3 py-2">{b.direccion}</td>
                    <td className="px-3 py-2">{b.cp}</td>
                    <td className="px-3 py-2">{b.ciudad}</td>
                    <td className="px-3 py-2">{b.email}</td>
                    <td className="px-3 py-2">{b.telefono}</td>
                    <td className="px-3 py-2 flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setModal({ open: true, editing: b })}>
                        Editar
                      </Button>
                      {!singleMode && <DeleteBranchButton id={b.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modales */}
      {modal.open && (
        <BranchModal
          initial={modal.editing}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}

      {reminderModal.open && (
        <ReminderModal
          initial={reminderModal.editing}
          onClose={() => setReminderModal({ open: false, editing: null })}
          reminders={notif.reminders || []}
          onSave={(entry) => {
            if (entry.id) {
              // edit
              setReminders((notif.reminders || []).map((r) => (r.id === entry.id ? entry : r)));
            } else {
              // add
              const id = Math.random().toString(36).slice(2, 10);
              const next = [...(notif.reminders || []), { ...entry, id }];
              setReminders(next);
            }
            setReminderModal({ open: false, editing: null });
          }}
          onDelete={(id) => {
            const next = (notif.reminders || []).filter((r) => r.id !== id);
            setReminders(next);
            setReminderModal({ open: false, editing: null });
          }}
        />
      )}
    </div>
  );
}

/* ===================== Helpers UI ===================== */

function formatBefore(hours) {
  const h = Number(hours || 0);
  if (h % 24 === 0) {
    const d = h / 24;
    return d === 1 ? "1 día antes" : `${d} días antes`;
  }
  return `${h} h antes`;
}

function ChipReminder({ r, onEdit, onDelete, canDelete }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2 py-1">
      <span className="text-xs">{formatBefore(r.hoursBefore)}</span>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit} title="Editar">Editar</Button>
        <Button variant="danger" size="sm" onClick={onDelete} disabled={!canDelete} title={canDelete ? "Eliminar" : "Debe haber al menos 1"}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}

/* ===================== Delete sucursal ===================== */
function DeleteBranchButton({ id }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => deleteBranch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
  return (
    <Button size="sm" variant="danger" onClick={() => m.mutate()} disabled={m.isPending}>
      {m.isPending ? "Eliminando…" : "Eliminar"}
    </Button>
  );
}

/* ===================== Modal sucursal ===================== */
function BranchModal({ initial, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    direccion: initial?.direccion ?? "",
    cp: initial?.cp ?? "",
    ciudad: initial?.ciudad ?? "",
    email: initial?.email ?? "",
    telefono: initial?.telefono ?? "",
  });

  const mSave = useMutation({
    mutationFn: (payload) =>
      isEdit ? updateBranch({ id: initial.id, ...payload }) : createBranch(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      onClose();
    },
  });

  function submit(e) {
    e.preventDefault();
    mSave.mutate(form);
  }

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={onClose}>
        <div className={clsx(glass, "w-[min(600px,95vw)] p-4")} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold">{isEdit ? "Editar sucursal" : "Nueva sucursal"}</div>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>

          <form onSubmit={submit} className="grid gap-2">
            {["nombre","direccion","cp","ciudad","email","telefono"].map((f)=>(
              <label key={f} className="grid gap-1">
                <span className="text-xs text-slate-300 capitalize">{f}</span>
                <input
                  value={form[f]}
                  onChange={(e)=>setForm(s=>({...s,[f]:e.target.value}))}
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                  required={f==="nombre"}
                />
              </label>
            ))}
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mSave.isPending}>
                {mSave.isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear sucursal"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

/* ===================== Modal recordatorio ===================== */
function ReminderModal({ initial, onClose, reminders, onSave, onDelete }) {
  const isEdit = !!initial;

  // form: { hoursBefore: number } (si edit => id también)
  const [unit, setUnit] = useState(() => (initial && initial.hoursBefore % 24 === 0 ? "days" : "hours"));
  const [value, setValue] = useState(() => {
    if (!initial) return 24; // 1 día por defecto al crear
    const hb = Number(initial.hoursBefore || 24);
    return unit === "days" ? Math.round(hb / 24) : hb;
  });

  function toHoursBefore(val, unit) {
    const n = Math.max(1, Number(val || 1));
    return unit === "days" ? n * 24 : n;
    // sin límite superior específico (puedes poner 7 días, etc.)
  }

  function submit(e) {
    e.preventDefault();
    const hoursBefore = toHoursBefore(value, unit);
    const entry = isEdit
      ? { id: initial.id, hoursBefore }
      : { hoursBefore };
    // Validar límites de cantidad ya se hace en el padre
    onSave(entry);
  }

  const canDelete = isEdit && reminders.length > 1;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={onClose}>
        <div className={clsx(glass, "w-[min(440px,95vw)] p-4")} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold">{isEdit ? "Editar aviso" : "Nuevo aviso"}</div>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>

          <form onSubmit={submit} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs text-slate-300">Enviar</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-28 rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                  required
                />
                <select
                  className="rounded-lg border border-white/10 bg-white/10 px-2 py-2"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="hours">horas</option>
                  <option value="days">días</option>
                </select>
                <span className="text-sm">antes</span>
              </div>
            </label>

            <div className="flex justify-between items-center">
              <Button
                variant="danger"
                type="button"
                onClick={() => isEdit && canDelete && onDelete(initial.id)}
                disabled={!canDelete}
              >
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                <Button type="submit">{isEdit ? "Guardar" : "Crear"}</Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
