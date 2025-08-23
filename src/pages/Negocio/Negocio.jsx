// src/pages/Negocio/Negocio.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Button from "../../components/common/Button";
import Portal from "../../components/common/Portal";
import Toggle from "../../components/common/Toggle";
import { useEffect } from "react";

import {
  fetchBusiness,
  updateBusiness,
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../../api/business";
import {
  fetchNotificationSettings,
  updateNotificationSettings,
  fetchChannelsConfig,
  updateChannelsConfig,
} from "../../api/confignotifications";

import { BUSINESS_TYPES, LANGUAGES, CURRENCIES, TIMEZONES } from "../../api/business";


const glass = "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]";
const secTitle = "text-sm font-semibold text-zinc-100";

export default function Negocio() {
  const qc = useQueryClient();
  const { data: business } = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const { data: branches } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches, enabled: !!business });
  // ===== Notificaciones: queries
const { data: notifSettings } = useQuery({
  queryKey: ["notifSettings"],
  queryFn: fetchNotificationSettings,
  enabled: !!business,
});

const { data: channels } = useQuery({
  queryKey: ["channelsConfig"],
  queryFn: fetchChannelsConfig,
  enabled: !!business,
});

// ===== Mutations
const mNotifSave = useMutation({
  mutationFn: updateNotificationSettings,
  onSuccess: () => qc.invalidateQueries({ queryKey: ["notifSettings"] }),
});

const mChannelsSave = useMutation({
  mutationFn: updateChannelsConfig,
  onSuccess: () => qc.invalidateQueries({ queryKey: ["channelsConfig"] }),
});

// ===== Formularios locales
const [notifForm, setNotifForm] = useState(null);
const [channelsForm, setChannelsForm] = useState(null);

// Inicializar formularios cuando cargan datos
useEffect(() => {
  if (notifSettings) {
    setNotifForm(structuredClone(notifSettings));
  }
}, [notifSettings]);

useEffect(() => {
  if (channels) {
    setChannelsForm(structuredClone(channels));
  }
}, [channels]);

  // Formulario de datos principales + preview de logo
const [mainForm, setMainForm] = useState(null);
const [logoPreview, setLogoPreview] = useState(null);

// Cuando cargue/actualice "business", inicializa el formulario
useEffect(() => {
  if (!business) return;
  setMainForm({
    logoUrl: business.logoUrl || "",
    nombre: business.nombre || "",
    razonSocial: business.razonSocial || "",
    email: business.email || "",
    telefono: business.telefono || "",
    web: business.web || "",
    tipo: business.tipo || "peluqueria",
    idioma: business.idioma || "es",
    currency: business.currency || "EUR",
    timezone: business.timezone || "Europe/Madrid",
  });
  setLogoPreview(null);
}, [business]);


  const mUpdate = useMutation({
    mutationFn: updateBusiness,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business"] }),
  });
  function onChange(k, v) {
  setMainForm((s) => ({ ...s, [k]: v }));
}

function onLogoChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result);
    setLogoPreview(dataUrl);
    setMainForm((s) => ({ ...s, logoUrl: dataUrl }));
  };
  reader.readAsDataURL(file);
}

function onCancelMain() {
  if (!business) return;
  setMainForm({
    logoUrl: business.logoUrl || "",
    nombre: business.nombre || "",
    razonSocial: business.razonSocial || "",
    email: business.email || "",
    telefono: business.telefono || "",
    web: business.web || "",
    tipo: business.tipo || "peluqueria",
    idioma: business.idioma || "es",
    currency: business.currency || "EUR",
    timezone: business.timezone || "Europe/Madrid",
  });
  setLogoPreview(null);
}

function onSaveMain() {
  if (!mainForm) return;
  if (!mainForm.nombre?.trim()) return alert("El nombre es obligatorio");
  if (mainForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mainForm.email)) {
    return alert("Correo no válido");
  }
  mUpdate.mutate(mainForm, {
    onSuccess: () => setLogoPreview(null),
  });
}

// ===== Handlers Notificaciones (Reglas de envío)
function notifSetEvents(patch) {
  setNotifForm(s => ({ ...s, events: { ...s.events, ...patch } }));
}
function notifSetReminders(nextList) {
  const list = nextList.slice(0, 3);
  if (!list.length) return;
  setNotifForm(s => ({ ...s, reminders: list }));
}
function notifSetReview(patch) {
  setNotifForm(s => {
    const next = { ...s.review, ...patch };
    if ("hoursAfter" in patch) {
      next.hoursAfter = Math.max(2, Math.min(48, Number(next.hoursAfter || 4)));
    }
    return { ...s, review: next };
  });
}
function notifCancel() {
  setNotifForm(structuredClone(notifSettings));
}
function notifSave() {
  mNotifSave.mutate(notifForm);
}

// ===== Handlers Canales
function channelsSetActive(next) {
  setChannelsForm(s => ({ ...s, active: next }));
}
function channelsUpdateEmailSMTP(k, v) {
  setChannelsForm(s => ({
    ...s,
    email: {
      ...(s.email || { available: true, smtp: {} }),
      smtp: { ...(s.email?.smtp || {}), [k]: v },
    },
  }));
}
function channelsCancel() {
  setChannelsForm(structuredClone(channels));
}
function channelsSave() {
  const payload = { active: channelsForm.active };
  if (channelsForm.active === "email") {
    payload.email = { smtp: channelsForm.email?.smtp || {} };
  }
  mChannelsSave.mutate(payload);
}



  const [modal, setModal] = useState({ open: false, editing: null });
  const [reminderModal, setReminderModal] = useState({ open: false, editing: null });

if (!business || !mainForm || !notifSettings || !channels || !notifForm || !channelsForm) {
  return <div className="p-4">Cargando negocio…</div>;
}

// Mostrar solo una sucursal si NO hay modo sucursal
 const singleMode = !business.branchMode;
 const shownBranches = singleMode
   ? (branches?.length ? [branches[0]] : [])
   : (branches || []);

  // ===== Helpers notificaciones =====
  

  return (
    <div className="p-4 space-y-4">
      {/* Datos principales */}
      {/* ============ Datos principales (EDITABLE) ============ */}
<section className={clsx(glass, "p-5 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]")}>
  {/* Logo */}
  <div className="flex flex-col items-center gap-3">
    <div className="relative">
      <img
        src={logoPreview || mainForm.logoUrl || "https://placehold.co/128x128?text=LOGO"}
        alt="Logo"
        className="object-cover border size-28 rounded-xl border-white/10 bg-white/10"
      />
      <label className="absolute bottom-0 right-0 grid text-xs border rounded-full cursor-pointer size-8 place-items-center border-white/10 bg-white/20 hover:bg-white/30">
        <input type="file" onChange={onLogoChange} className="hidden" accept="image/*" />
        ✏️
      </label>
    </div>
    <div className="text-[11px] text-slate-400">PNG/JPG, máx. ~2MB (demo local)</div>
  </div>

  {/* Campos */}
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
    {/* Nombre comercial */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Nombre</span>
      <input
        value={mainForm.nombre}
        onChange={(e) => onChange("nombre", e.target.value)}
        placeholder="Nombre comercial"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
        required
      />
    </label>

    {/* Razón social */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Nombre legal (Razón social)</span>
      <input
        value={mainForm.razonSocial}
        onChange={(e) => onChange("razonSocial", e.target.value)}
        placeholder="Nombre legal"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      />
    </label>

    {/* Email */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Email</span>
      <input
        type="email"
        value={mainForm.email}
        onChange={(e) => onChange("email", e.target.value)}
        placeholder="nombre@empresa.com"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      />
    </label>

    {/* Teléfono */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Teléfono</span>
      <input
        value={mainForm.telefono}
        onChange={(e) => onChange("telefono", e.target.value)}
        placeholder="+34 600 000 000"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      />
    </label>

    {/* Web */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Web</span>
      <input
        type="url"
        value={mainForm.web}
        onChange={(e) => onChange("web", e.target.value)}
        placeholder="https://tusitio.com"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      />
    </label>

    {/* Tipo negocio */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Tipo de negocio</span>
      <select
        value={mainForm.tipo}
        onChange={(e) => onChange("tipo", e.target.value)}
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      >
        {BUSINESS_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </label>

    {/* Idioma */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Idioma</span>
      <select
        value={mainForm.idioma}
        onChange={(e) => onChange("idioma", e.target.value)}
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
    </label>

    {/* Moneda */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Moneda</span>
      <select
        value={mainForm.currency}
        onChange={(e) => onChange("currency", e.target.value)}
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      >
        {CURRENCIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </label>

    {/* Zona horaria */}
    <label className="grid gap-1 md:col-span-2">
      <span className="text-xs text-slate-300">Zona horaria</span>
      <select
        value={mainForm.timezone}
        onChange={(e) => onChange("timezone", e.target.value)}
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>{tz}</option>
        ))}
      </select>
    </label>

    {/* Acciones */}
    <div className="flex items-center gap-2 pt-1 md:col-span-2">
      <Button onClick={onSaveMain} disabled={mUpdate.isPending}>
        {mUpdate.isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
      <Button variant="ghost" onClick={onCancelMain} disabled={mUpdate.isPending}>
        Cancelar
      </Button>
    </div>
  </div>
</section>


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

       {/* Sucursales */}
      <section className={clsx(glass, "p-4")}>
        <div className="flex items-center justify-between mb-3">
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
          <div className="overflow-auto border rounded-xl border-white/10">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="text-left bg-white/5">
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
                    <td className="flex justify-end gap-2 px-3 py-2">
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

      {/* ===== Notificaciones de calendario ===== */}
      {/* ===== Notificaciones de calendario ===== */}

{/* ===== Notificaciones de calendario ===== */}
<section className={clsx(glass, "p-4 space-y-6")}>
  <div className="text-base font-semibold">Notificaciones de calendario</div>

  {/* A) Reglas de envío (eventos, avisos, reseñas) */}
  <div className="space-y-4">
    <div className={secTitle}>Reglas de envío</div>

    {/* Eventos */}
    <div>
      <div className="mb-2 text-xs text-slate-300">Eventos</div>
      <div className="grid gap-3 md:grid-cols-3">
        <Toggle
          align="left"
          label="Confirmación"
          description="Cuando se crea o confirma una cita"
          checked={!!notifForm.events.confirmation}
          onChange={(v) => notifSetEvents({ confirmation: v })}
        />
        <Toggle
          align="left"
          label="Cancelación"
          description="Cuando se cancela una cita"
          checked={!!notifForm.events.cancellation}
          onChange={(v) => notifSetEvents({ cancellation: v })}
        />
        <Toggle
          align="left"
          label="Reprogramación"
          description="Cuando se cambia la hora/fecha"
          checked={!!notifForm.events.rescheduled}
          onChange={(v) => notifSetEvents({ rescheduled: v })}
        />
      </div>
    </div>

    {/* Avisos (recordatorios) */}
    <div>
      <div className="text-xs text-slate-300">Avisos (recordatorios)</div>
      <p className="text-xs text-slate-400">
        Se envían antes de la cita. Mínimo 1 y máximo 3. Por defecto: 1 día y 3 horas antes.
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {(notifForm.reminders || []).map((r) => (
          <ChipReminder
            key={r.id}
            r={r}
            canDelete={(notifForm.reminders || []).length > 1}
            onEdit={() => setReminderModal({ open: true, editing: r })}
            onDelete={() =>
              notifSetReminders((notifForm.reminders || []).filter((x) => x.id !== r.id))
            }
          />
        ))}
        {(notifForm.reminders || []).length < 3 && (
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

    {/* Reseñas */}
    <div>
      <div className="mb-2 text-xs text-slate-300">Reseña</div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label className="grid gap-1">
          <span className="text-xs text-slate-300">Enviar después de</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={2}
              max={48}
              value={notifForm.review?.hoursAfter ?? 4}
              onChange={(e) => notifSetReview({ hoursAfter: Number(e.target.value) })}
              className="px-3 py-2 border rounded-lg w-28 border-white/10 bg-white/10"
            />
            <span className="text-sm">horas (min 2h · máx 48h)</span>
          </div>
        </label>

        <Toggle
          align="left"
          label="2º correo si no hay reseña"
          description="Envía un recordatorio adicional"
          checked={!!notifForm.review?.followup}
          onChange={(v) => notifSetReview({ followup: v })}
        />
      </div>
    </div>

    {/* Acciones reglas */}
    <div className="flex items-center gap-2">
      <Button onClick={notifSave} disabled={mNotifSave.isPending}>
        {mNotifSave.isPending ? "Guardando…" : "Guardar reglas"}
      </Button>
      <Button variant="ghost" onClick={notifCancel} disabled={mNotifSave.isPending}>
        Cancelar
      </Button>
    </div>
  </div>

  {/* B) Canales de envío (elige uno y configura) */}
  <div className="space-y-3">
    <div className={secTitle}>Canales de envío</div>

    {/* Selector de canal activo */}
    <div className="flex gap-2">
      {["email", "sms", "whatsapp"].map((c) => (
        <Button
          key={c}
          variant={channelsForm.active === c ? "primary" : "secondary"}
          onClick={() => channelsSetActive(c)}
        >
          {c.toUpperCase()}
        </Button>
      ))}
    </div>

    {/* Panel de configuración según canal */}
    {channelsForm.active === "email" ? (
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs text-slate-300">SMTP Host</span>
          <input
            className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
            value={channelsForm.email?.smtp?.host || ""}
            onChange={(e) => channelsUpdateEmailSMTP("host", e.target.value)}
            placeholder="smtp.tu-dominio.com"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-300">SMTP Port</span>
          <input
            type="number"
            className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
            value={channelsForm.email?.smtp?.port ?? 587}
            onChange={(e) => channelsUpdateEmailSMTP("port", Number(e.target.value))}
            placeholder="587"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-300">Secure (TLS/SSL)</span>
          <select
            className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
            value={channelsForm.email?.smtp?.secure ? "true" : "false"}
            onChange={(e) => channelsUpdateEmailSMTP("secure", e.target.value === "true")}
          >
            <option value="false">STARTTLS (587)</option>
            <option value="true">SSL (465)</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-300">Usuario</span>
          <input
            className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
            value={channelsForm.email?.smtp?.user || ""}
            onChange={(e) => channelsUpdateEmailSMTP("user", e.target.value)}
            placeholder="no-reply@tu-dominio.com"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-300">Password</span>
          <input
            type="password"
            className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
            value={channelsForm.email?.smtp?.pass || ""}
            onChange={(e) => channelsUpdateEmailSMTP("pass", e.target.value)}
            placeholder="********"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-300">From (nombre)</span>
          <input
            className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
            value={channelsForm.email?.smtp?.fromName || ""}
            onChange={(e) => channelsUpdateEmailSMTP("fromName", e.target.value)}
            placeholder="Bookitauto"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-slate-300">From (email)</span>
          <input
            className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
            value={channelsForm.email?.smtp?.fromEmail || ""}
            onChange={(e) => channelsUpdateEmailSMTP("fromEmail", e.target.value)}
            placeholder="no-reply@tu-dominio.com"
          />
        </label>

        <label className="grid gap-1 md:col-span-2">
          <span className="text-xs text-slate-300">Reply-To</span>
          <input
            className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
            value={channelsForm.email?.smtp?.replyTo || ""}
            onChange={(e) => channelsUpdateEmailSMTP("replyTo", e.target.value)}
            placeholder="soporte@tu-dominio.com"
          />
        </label>
      </div>
    ) : (
      <div className="px-3 py-2 text-sm border rounded-lg border-white/10 bg-white/5">
        {channelsForm[channelsForm.active]?.note || "Canal no disponible todavía."}
      </div>
    )}

    {/* Acciones canales */}
    <div className="flex items-center gap-2">
      <Button onClick={channelsSave} disabled={mChannelsSave.isPending}>
        {mChannelsSave.isPending ? "Guardando…" : "Guardar canal"}
      </Button>
      <Button variant="ghost" onClick={channelsCancel} disabled={mChannelsSave.isPending}>
        Cancelar
      </Button>
    </div>
  </div>
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
    reminders={notifForm.reminders || []}
    onSave={(entry) => {
      if (entry.id) {
        // edit
        notifSetReminders((notifForm.reminders || []).map((r) => (r.id === entry.id ? entry : r)));
      } else {
        // add
        const id = Math.random().toString(36).slice(2, 10);
        const next = [...(notifForm.reminders || []), { ...entry, id }];
        notifSetReminders(next);
      }
      setReminderModal({ open: false, editing: null });
    }}
    onDelete={(id) => {
      const next = (notifForm.reminders || []).filter((r) => r.id !== id);
      notifSetReminders(next);
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
    <div className="inline-flex items-center gap-2 px-2 py-1 border rounded-xl border-white/10 bg-white/10">
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
      <div className="fixed inset-0 grid p-4 bg-black/40 place-items-center" onClick={onClose}>
        <div className={clsx(glass, "w-[min(600px,95vw)] p-4")} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">{isEdit ? "Editar sucursal" : "Nueva sucursal"}</div>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>

          <form onSubmit={submit} className="grid gap-2">
            {["nombre","direccion","cp","ciudad","email","telefono"].map((f)=>(
              <label key={f} className="grid gap-1">
                <span className="text-xs capitalize text-slate-300">{f}</span>
                <input
                  value={form[f]}
                  onChange={(e)=>setForm(s=>({...s,[f]:e.target.value}))}
                  className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
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
      <div className="fixed inset-0 grid p-4 bg-black/40 place-items-center" onClick={onClose}>
        <div className={clsx(glass, "w-[min(440px,95vw)] p-4")} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
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
                  className="px-3 py-2 border rounded-lg w-28 border-white/10 bg-white/10"
                  required
                />
                <select
                  className="px-2 py-2 border rounded-lg border-white/10 bg-white/10"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="hours">horas</option>
                  <option value="days">días</option>
                </select>
                <span className="text-sm">antes</span>
              </div>
            </label>

            <div className="flex items-center justify-between">
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
