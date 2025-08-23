// src/components/common/ScheduleManager.jsx
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Button from "../common/Button";
import { Input } from "../common/Input";
import Portal from "../common/Portal";

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

const DEFAULT_SCHEDULE = {
  mon: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
  tue: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
  wed: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
  thu: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
  fri: { off: false, slots: [{ start: "08:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
  sat: { off: true,  slots: [] },
  sun: { off: true,  slots: [] },
  // lista de días especiales
  specialDays: [] /* [{ date: 'YYYY-MM-DD', off: boolean, slots: [{start,end}] }] */,
};

/**
 * Componente de horario reutilizable (perfil/negocio)
 *
 * Props:
 * - title: string
 * - description: string
 * - queryKey: string[] para cache (ej. ["me-schedule"] o ["business-schedule"])
 * - fetchSchedule: () => Promise<ScheduleObject>
 * - saveSchedule: (payload) => Promise<any>
 */
export default function ScheduleManager({
  title = "Horario",
  description = "Define tus franjas laborables por día.",
  queryKey = ["schedule"],
  fetchSchedule,
  saveSchedule,
}) {
  const qc = useQueryClient();

  const normalizeSchedule = (raw) => {
    const base = { ...DEFAULT_SCHEDULE, ...(raw || {}) };
    const out = {};
    for (const d of days) {
      const v = base[d.key];
      out[d.key] = v && typeof v === "object"
        ? {
            off: !!v.off,
            slots: Array.isArray(v.slots) ? v.slots.map(s => ({
              start: s?.start || "09:00",
              end: s?.end || "13:00",
            })) : [],
          }
        : DEFAULT_SCHEDULE[d.key];
    }
    out.specialDays = Array.isArray(base.specialDays)
      ? base.specialDays.map(s => ({
          date: s?.date || "",
          off: !!s?.off,
          slots: Array.isArray(s?.slots) ? s.slots.map(sl => ({
            start: sl?.start || "09:00",
            end: sl?.end || "13:00",
          })) : [],
        }))
      : [];
    return out;
  };

  const { data: schedule, isLoading } = useQuery({
    queryKey,
    queryFn: async () => normalizeSchedule(await fetchSchedule()),
  });

  const [draft, setDraft] = useState(null);
  useEffect(() => { if (schedule) setDraft(schedule); }, [schedule]);

  const mSave = useMutation({
    mutationFn: (payload) => saveSchedule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  // acciones semana
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

  // ====== Días especiales ======
  const [specialOpen, setSpecialOpen] = useState(false);
  const [specialForm, setSpecialForm] = useState({ date: "", off: false, slots: [{ start: "09:00", end: "13:00" }] });
  const specialDays = draft?.specialDays || [];

  const addSpecial = () => {
    setSpecialForm({ date: "", off: false, slots: [{ start: "09:00", end: "13:00" }] });
    setSpecialOpen(true);
  };

  const saveSpecial = () => {
    if (!specialForm.date) return;
    setDraft(d => {
      const others = (d.specialDays || []).filter(s => s.date !== specialForm.date);
      return { ...d, specialDays: [...others, { ...specialForm, slots: specialForm.off ? [] : specialForm.slots }] };
    });
    setSpecialOpen(false);
  };

  const editSpecial = (date) => {
    const found = specialDays.find(s => s.date === date);
    if (!found) return;
    setSpecialForm(JSON.parse(JSON.stringify(found)));
    setSpecialOpen(true);
  };

  const removeSpecial = (date) => {
    setDraft(d => ({ ...d, specialDays: (d.specialDays || []).filter(s => s.date !== date) }));
  };

  const addSpecialSlot = () => {
    setSpecialForm(f => ({ ...f, slots: [...(f.slots || []), { start: "09:00", end: "13:00" }] }));
  };
  const updSpecialSlot = (idx, field, value) => {
    setSpecialForm(f => ({
      ...f,
      slots: f.slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };
  const delSpecialSlot = (idx) => {
    setSpecialForm(f => ({ ...f, slots: f.slots.filter((_, i) => i !== idx) }));
  };

  // Ordena por fecha
  const specialSorted = useMemo(
    () => [...specialDays].sort((a, b) => a.date.localeCompare(b.date)),
    [specialDays]
  );

  return (
    <section className={clsx(glassCard, "p-5")}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-slate-300">{description}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={addSpecial}>
          + Añadir día especial
        </Button>
      </div>

      {isLoading || !draft ? (
        <div className="text-sm text-slate-300">Cargando…</div>
      ) : (
        <>
          {/* Semana */}
          <div className="grid gap-3 md:grid-cols-2">
            {days.map((d) => {
              const day = draft[d.key] ?? { off: true, slots: [] };
              return (
                <div key={d.key} className="p-3 border rounded-xl border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">{d.label}</div>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!day.off}
                        onChange={(e) => setOff(d.key, e.target.checked)}
                        className="rounded size-4 border-white/20 bg-white/10"
                      />
                      No abierto
                    </label>
                  </div>

                  {day.off ? (
                    <div className="text-xs text-slate-400">— Cerrado</div>
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

          {/* Días especiales */}
          <div className="mt-5">
            <div className="mb-2 text-sm font-medium">Días especiales</div>
            {!specialSorted.length ? (
              <div className="text-xs text-slate-400">No hay días especiales definidos.</div>
            ) : (
              <div className="grid gap-2">
                {specialSorted.map((s) => (
                  <div key={s.date} className="flex flex-wrap items-center justify-between gap-2 p-2 border rounded-xl border-white/10 bg-white/5">
                    <div className="text-sm">
                      <b>{s.date}</b>{" "}
                      <span className="text-slate-300">
                        {s.off
                          ? "· Cerrado"
                          : `· ${s.slots.map((t) => `${t.start}–${t.end}`).join(", ")}`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => editSpecial(s.date)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => removeSpecial(s.date)}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones guardar */}
          <div className="flex items-center gap-2 mt-4">
            <Button variant="primary" onClick={() => mSave.mutate(draft)} disabled={mSave.isPending} type="button">
              {mSave.isPending ? "Guardando…" : "Guardar horario"}
            </Button>
            <Button variant="ghost" onClick={() => setDraft(schedule)} type="button">
              Cancelar
            </Button>
          </div>
        </>
      )}

      {/* Modal Día Especial */}
      {specialOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,560px)] p-5")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Día especial</h3>
                <Button variant="ghost" size="sm" onClick={() => setSpecialOpen(false)}>Cerrar</Button>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs text-slate-300">Fecha</span>
                  <Input type="date" value={specialForm.date} onChange={(e)=>setSpecialForm(f=>({...f,date:e.target.value}))} />
                </label>

                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!specialForm.off}
                    onChange={(e)=>setSpecialForm(f=>({...f, off: e.target.checked, slots: e.target.checked ? [] : (f.slots || [{start:"09:00", end:"13:00"}])}))}
                    className="rounded size-4 border-white/20 bg-white/10"
                  />
                  Cerrado todo el día
                </label>

                {!specialForm.off && (
                  <div className="space-y-2">
                    {(specialForm.slots || []).map((s, i)=>(
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                        <Input type="time" value={s.start} onChange={(e)=>updSpecialSlot(i,"start", e.target.value)} />
                        <Input type="time" value={s.end} onChange={(e)=>updSpecialSlot(i,"end", e.target.value)} />
                        <Button variant="danger" size="sm" onClick={()=>delSpecialSlot(i)}>Eliminar</Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={addSpecialSlot}>+ Añadir franja</Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="primary" onClick={saveSpecial}>Guardar</Button>
                  <Button variant="ghost" onClick={()=>setSpecialOpen(false)}>Cancelar</Button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
}
