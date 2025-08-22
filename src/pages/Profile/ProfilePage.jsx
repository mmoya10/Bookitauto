import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import api from "../../api/client";
import Button from "../../components/common/Button";
import { Input, Select } from "../../components/common/Input";
import Portal from "../../components/common/Portal";

/* ===== Utiles ===== */
const days = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

/* ===== Page ===== */
export default function ProfilePage() {
  return (
    <div className="space-y-6 text-zinc-100">
      <header className="mb-2">
        <h1 className="text-xl font-semibold">Mi Perfil</h1>
        <p className="text-sm text-slate-300">Gestiona tus datos, tu horario y tus ausencias.</p>
      </header>

      <ProfileSection />
      <ScheduleSection />
      <AbsencesSection />
    </div>
  );
}

/* ===== Sección 1: Datos de usuario ===== */
function ProfileSection() {
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const r = await api.get("/me");
        return r.data;
      } catch {
        return {
          avatarUrl: "",
          firstName: "Marc",
          lastName: "Moya",
          email: "admin@gmail.com",
          phone: "",
          birthdate: "",
        };
      }
    },
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: me,
  });

  useEffect(() => { if (me) reset(me); }, [me, reset]);

  const [preview, setPreview] = useState("");

  const updateProfile = useMutation({
    mutationFn: (payload) => api.post("/me", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setValue("avatarUrl", url);
  }

  return (
    <section className={clsx(glassCard, "p-5")}>
      <div className="mb-3">
        <h2 className="text-base font-semibold">Datos personales</h2>
        <p className="text-xs text-slate-300">Actualiza tu información básica.</p>
      </div>

      <form
        onSubmit={handleSubmit((v) => updateProfile.mutate(v))}
        className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={
                preview || watch("avatarUrl") ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${watch("firstName") || "U"}`
              }
              alt="avatar"
              className="size-28 rounded-full border border-white/10 bg-white/10 object-cover"
            />
            <label className="absolute bottom-0 right-0 grid size-8 cursor-pointer place-items-center rounded-full border border-white/10 bg-white/20 text-xs hover:bg-white/30">
              <input type="file" onChange={onFileChange} className="hidden" accept="image/*" />
              ✏️
            </label>
          </div>
          <div className="text-[11px] text-slate-400">PNG/JPG, máx. 2MB (demo local)</div>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Nombre">
            <Input placeholder="Nombre" {...register("firstName")} />
          </Field>
          <Field label="Apellidos">
            <Input placeholder="Apellidos" {...register("lastName")} />
          </Field>
          <Field label="Correo">
            <Input type="email" placeholder="nombre@empresa.com" {...register("email")} />
          </Field>
          <Field label="Teléfono">
            <Input placeholder="+34 600 000 000" {...register("phone")} />
          </Field>
          <Field label="Fecha de nacimiento">
            <Input type="date" {...register("birthdate")} />
          </Field>
        </div>

        {/* Acciones */}
        <div className="md:col-start-2 flex items-center gap-2">
          <Button type="submit" variant="primary" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => reset()}>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ===== Sección 2: Horario ===== */
function ScheduleSection() {
  const qc = useQueryClient();

  const DEFAULT_SCHEDULE = {
    mon: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    tue: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    wed: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    thu: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    fri: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
    sat: { off: true,  slots: [] },
    sun: { off: true,  slots: [] },
  };

  const normalizeSchedule = (raw) => {
    const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const out = {};
    for (const d of days) {
      const v = obj[d.key];
      if (v && typeof v === "object" && "off" in v && Array.isArray(v.slots)) {
        out[d.key] = {
          off: !!v.off,
          slots: v.slots.map(s => ({ start: s?.start || "09:00", end: s?.end || "13:00" })),
        };
      } else {
        out[d.key] = DEFAULT_SCHEDULE[d.key];
      }
    }
    return out;
  };

  const { data: schedule } = useQuery({
    queryKey: ["schedule"],
    queryFn: async () => {
      try {
        const r = await api.get("/me/schedule");
        return normalizeSchedule(r.data);
      } catch {
        return DEFAULT_SCHEDULE;
      }
    },
  });

  const [draft, setDraft] = useState(null);
  useEffect(() => { if (schedule) setDraft(schedule); }, [schedule]);

  const save = useMutation({
    mutationFn: (payload) => api.post("/me/schedule", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }),
  });

  const setOff = (key, off) => {
    setDraft((d) => {
      const day = d?.[key] ?? { off: true, slots: [] };
      return { ...d, [key]: { ...day, off, slots: off ? [] : day.slots } };
    });
  };
  const addSlot = (key) => {
    setDraft((d) => {
      const day = d?.[key] ?? { off: false, slots: [] };
      return { ...d, [key]: { ...day, slots: [...day.slots, { start: "09:00", end: "13:00" }] } };
    });
  };
  const updateSlot = (key, idx, field, value) => {
    setDraft((d) => {
      const day = d?.[key] ?? { off: false, slots: [] };
      const slots = day.slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
      return { ...d, [key]: { ...day, slots } };
    });
  };
  const removeSlot = (key, idx) => {
    setDraft((d) => {
      const day = d?.[key] ?? { off: false, slots: [] };
      const slots = day.slots.filter((_, i) => i !== idx);
      return { ...d, [key]: { ...day, slots } };
    });
  };

  return (
    <section className={clsx(glassCard, "p-5")}>
      <div className="mb-3">
        <h2 className="text-base font-semibold">Horario</h2>
        <p className="text-xs text-slate-300">Define tus franjas laborables por día. Vista semanal (L → D).</p>
      </div>

      {!draft ? (
        <div className="text-sm text-slate-300">Cargando…</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {days.map((d) => {
            const day = draft[d.key] ?? { off: true, slots: [] };
            return (
              <div key={d.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium">{d.label}</div>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!day.off}
                      onChange={(e) => setOff(d.key, e.target.checked)}
                      className="size-4 rounded border-white/20 bg-white/10"
                    />
                    No trabaja
                  </label>
                </div>

                {day.off ? (
                  <div className="text-xs text-slate-400">— Día libre</div>
                ) : (
                  <div className="space-y-2">
                    {day.slots.map((s, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                        <Input type="time" value={s.start} onChange={(e) => updateSlot(d.key, i, "start", e.target.value)} />
                        <Input type="time" value={s.end} onChange={(e) => updateSlot(d.key, i, "end", e.target.value)} />
                        <Button variant="danger" size="sm" type="button" onClick={() => removeSlot(d.key, i)}>
                          Eliminar
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" type="button" onClick={() => addSlot(d.key)}>
                      + Añadir franja
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button variant="primary" onClick={() => save.mutate(draft)} disabled={save.isPending} type="button">
          {save.isPending ? "Guardando…" : "Guardar horario"}
        </Button>
        <Button variant="ghost" onClick={() => setDraft(schedule)} type="button">
          Cancelar
        </Button>
      </div>
    </section>
  );
}

/* ===== Sección 3: Ausencias ===== */
function AbsencesSection() {
  const qc = useQueryClient();

  const { data: vacations } = useQuery({
    queryKey: ["vacations"],
    queryFn: async () => {
      try {
        const r = await api.get("/me/vacations");
        return r.data;
      } catch {
        return { availableDays: 20, usedDays: 5, availableHours: 160, usedHours: 40 };
      }
    },
  });

  const { data: absences } = useQuery({
    queryKey: ["absences"],
    queryFn: async () => {
      try {
        const r = await api.get("/me/absences");
        return r.data;
      } catch {
        return [
          { id: 1, type: "Vacaciones", start: "2025-08-18", end: "2025-08-20", qty: "3 días" },
          { id: 2, type: "Asuntos propios", start: "2025-09-02", end: "2025-09-02", qty: "4 h" },
        ];
      }
    },
  });

  const [open, setOpen] = useState(false);
  const createAbsence = useMutation({
    mutationFn: (payload) => api.post("/me/absences", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["absences"] });
      qc.invalidateQueries({ queryKey: ["vacations"] });
      setOpen(false);
    },
  });

  const stats = useMemo(() => {
    const v = vacations || {};
    return [
      { label: "Días disponibles", value: v.availableDays ?? 0 },
      { label: "Días gastados", value: v.usedDays ?? 0 },
      { label: "Horas disponibles", value: v.availableHours ?? 0 },
      { label: "Horas gastadas", value: v.usedHours ?? 0 },
    ];
  }, [vacations]);

  return (
    <section className={clsx(glassCard, "p-5")}>
      <div className="mb-3">
        <h2 className="text-base font-semibold">Ausencias</h2>
        <p className="text-xs text-slate-300">Controla tus vacaciones, permisos y bajas.</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase text-slate-400">{s.label}</div>
            <div className="text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabla ausencias */}
      <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-300">
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Inicio</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {(absences ?? []).map((a) => (
              <tr key={a.id} className="border-t border-white/10">
                <td className="px-3 py-2">{a.type}</td>
                <td className="px-3 py-2">{a.start}</td>
                <td className="px-3 py-2">{a.end}</td>
                <td className="px-3 py-2">{a.qty}</td>
              </tr>
            ))}
            {!absences?.length && (
              <tr>
                <td className="px-3 py-3 text-slate-400" colSpan={4}>
                  No hay ausencias registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Acciones */}
      <div className="mt-3">
        <Button variant="primary" onClick={() => setOpen(true)}>+ Añadir ausencia</Button>
      </div>

      {/* Modal → por Portal (encima de todo) */}
      {open && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,520px)] p-5")}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold">Nueva ausencia</h3>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cerrar</Button>
              </div>

              <AbsenceForm
                onSubmit={(payload) => createAbsence.mutate(payload)}
                submitting={createAbsence.isPending}
              />
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
}

/* ===== Subcomponentes ===== */
function Field({ label, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs text-slate-300">{label}</span>
      {children}
    </label>
  );
}

/* Formulario modal de ausencia */
function AbsenceForm({ onSubmit, submitting }) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { type: "Vacaciones", start: "", end: "" },
  });

  const start = watch("start");
  const end = watch("end");

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v))} className="grid gap-3">
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Tipo de día</span>
        <Select {...register("type")}>
          <option>Vacaciones</option>
          <option>Asuntos propios</option>
          <option>Enfermedad</option>
          <option>Horas</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Desde</span>
          <Input type="date" {...register("start", { required: true })} />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Hasta</span>
          <Input type="date" {...register("end", { required: true })} min={start || undefined} />
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Button variant="primary" disabled={submitting} type="submit">
          {submitting ? "Guardando…" : "Aceptar"}
        </Button>
        <span className="text-xs text-slate-400">
          {start && end ? `Rango: ${start} → ${end}` : "Selecciona un rango"}
        </span>
      </div>
    </form>
  );
}
