import { useMemo, useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCalendars, fetchCalendarCategories, fetchBusinessHours, fetchHolidays,
  fetchAppointments, fetchAbsences, fetchStaff,
  createAppointment, updateAppointmentDates, updateAppointment
} from "../../api/calendars";
import Button from "../../components/common/Button";
import { Input, Select } from "../../components/common/Input";
import Portal from "../../components/common/Portal";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { addMinutes, isBefore, max as maxDate, min as minDate } from "date-fns";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function CalendarsPage() {
  // ====== estado filtros ======
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [tipo, setTipo] = useState("ambos");

  const [showGaps, setShowGaps] = useState(false);
  const [viewType, setViewType] = useState("timeGridWeek");
  const calendarRef = useRef(null);
  const panRef = useRef(null);

  const qc = useQueryClient();

  // ====== datos ======
  const { data: calendars } = useQuery({ queryKey: ["calendars"], queryFn: fetchCalendars });
  const { data: categories } = useQuery({ queryKey: ["calendar-categories"], queryFn: fetchCalendarCategories });
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  const { data: businessHours } = useQuery({ queryKey: ["business-hours"], queryFn: fetchBusinessHours });
  const { data: holidays } = useQuery({ queryKey: ["holidays"], queryFn: fetchHolidays });

  // arriba del return:
const calMap = useMemo(
  () => Object.fromEntries((calendars ?? []).map(c => [c.id, c.name])),
  [calendars]
);
const staffMap = useMemo(
  () => Object.fromEntries((staff ?? []).map(s => [s.id, s.name])),
  [staff]
);



  // marcar todo al inicio
  useEffect(() => {
    if (calendars && !selectedCalendars.length) setSelectedCalendars(calendars.map(c=>c.id));
  }, [calendars]); // eslint-disable-line
  useEffect(() => {
    if (categories && !selectedCategories.length) setSelectedCategories(categories.map(c=>c.id));
  }, [categories]); // eslint-disable-line
  useEffect(() => {
    if (staff && !selectedStaff.length) setSelectedStaff(staff.map(s=>s.id));
  }, [staff]); // eslint-disable-line

  // rango visible
  const [range, setRange] = useState({ start: null, end: null });

  const { data: citas } = useQuery({
    queryKey: ["appointments", range, selectedCalendars, selectedStaff, tipo],
    queryFn: () =>
      fetchAppointments({
        start: range.start?.toISOString(),
        end: range.end?.toISOString(),
        calendarIds: selectedCalendars,
        staffIds: selectedStaff,
        type: tipo === "ambos" ? "ambos" : "cita",
      }),
    enabled: !!range.start && !!range.end,
  });

  const { data: ausencias } = useQuery({
    queryKey: ["absences", range, selectedStaff, tipo],
    queryFn: () =>
      tipo === "cita"
        ? Promise.resolve([])
        : fetchAbsences({
            start: range.start?.toISOString(),
            end: range.end?.toISOString(),
            staffIds: selectedStaff,
          }),
    enabled: !!range.start && !!range.end,
  });

  // ======= Eventos (citas + ausencias + festivos) con nombres =======
const events = useMemo(() => {
  // Citas con colores + nombres de calendario/personal en extendedProps
  const apts = (citas ?? []).map((e) => ({
    ...e,
    backgroundColor: e.paid ? "rgba(16,185,129,0.35)" : "rgba(124,58,237,0.35)",
    borderColor:     e.paid ? "rgba(16,185,129,0.6)"  : "rgba(124,58,237,0.6)",
    textColor: "#fff",
    extendedProps: {
      ...e,
      calendarName: calMap?.[e.calendarId],
      staffName:    staffMap?.[e.staffId],
    },
  }));

  // Ausencias con estilo y un nombre por si se usa en el render
  const abs = (ausencias ?? []).map((e) => ({
    ...e,
    backgroundColor: "rgba(239,68,68,0.25)",
    borderColor: "rgba(239,68,68,0.6)",
    textColor: "#fff",
    extendedProps: {
      ...e,
      calendarName: "Ausencia",
      staffName:    staffMap?.[e.staffId],
    },
  }));

  // Festivos: los mantienes tal cual (ya suelen venir con display:'background')
  return [...apts, ...abs, ...(holidays ?? [])];
}, [citas, ausencias, holidays, calMap, staffMap]);


  // huecos libres (solo día/semana)
  const freeSlotEvents = useMemo(() => {
    if (!showGaps) return [];
    if (!range.start || !range.end || !businessHours) return [];
    const busy = (citas ?? []).concat(ausencias ?? []);
    return computeFreeSlots(businessHours, busy, range.start, range.end).map((g, i) => ({
      id: `free-${i}`,
      title: "Hueco",
      start: g.start,
      end: g.end,
      backgroundColor: "rgba(34,211,238,0.18)",
      borderColor: "rgba(34,211,238,0.45)",
      textColor: "#e6f9ff",
      extendedProps: { isFreeSlot: true },
    }));
  }, [showGaps, businessHours, citas, ausencias, range.start, range.end]);

  const allEvents = useMemo(() => events.concat(freeSlotEvents), [events, freeSlotEvents]);

  // crear/editar cita
  const [modal, setModal] = useState({ open: false, start: null, end: null, event: null });
  const createApt = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); setModal({ open:false, start:null, end:null, event:null }); },
  });
  const updateApt = useMutation({
    mutationFn: updateAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
  const moveApt = useMutation({
    mutationFn: updateAppointmentDates,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  function openAdd(start, end) { setModal({ open:true, start, end, event:null }); }
  function openEdit(ev)         { setModal({ open:true, start:new Date(ev.start), end:new Date(ev.end), event:ev }); }

  // helpers filtros “marcar todo”
  const allCalIds = (calendars ?? []).map(c=>c.id);
  const calAllChecked = selectedCalendars.length === allCalIds.length && allCalIds.length>0;
  const toggleCalAll = () => setSelectedCalendars(calAllChecked ? [] : allCalIds);

  const allCatIds = (categories ?? []).map(c=>c.id);
  const catAllChecked = selectedCategories.length === allCatIds.length && allCatIds.length>0;
  const toggleCatAll = () => setSelectedCategories(catAllChecked ? [] : allCatIds);

  const allStaffIds = (staff ?? []).map(s=>s.id);
  const staffAllChecked = selectedStaff.length === allStaffIds.length && allStaffIds.length>0;
  const toggleStaffAll = () => setSelectedStaff(staffAllChecked ? [] : allStaffIds);

  // al cambiar categorías, ajusta “calendars” seleccionados a los que entran
  useEffect(() => {
    if (!categories || !calendars) return;
    if (!selectedCategories.length) return; // si nada seleccionado, no toques
    const allow = new Set(calendars.filter(c=>selectedCategories.includes(c.categoryId)).map(c=>c.id));
    setSelectedCalendars(prev => prev.filter(id => allow.has(id)));
  }, [selectedCategories]); // eslint-disable-line

  return (
    <div className="space-y-5 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Calendarios</h1>
        <p className="text-sm text-slate-300">Filtra por calendario, categoría, personal y tipo. Vista diaria/semanal/mensual.</p>
      </header>

      {/* ======= Filtros ======= */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <FilterGroup title="Calendarios">
            <CheckAllRow checked={calAllChecked} onChange={toggleCalAll} />
            <MultiCheckbox
              items={(calendars ?? []).map(c => ({ id: c.id, label: c.name }))}
              values={selectedCalendars}
              onChange={setSelectedCalendars}
            />
          </FilterGroup>

          <FilterGroup title="Categorías">
            <CheckAllRow checked={catAllChecked} onChange={toggleCatAll} />
            <MultiCheckbox
              items={(categories ?? []).map(c => ({ id: c.id, label: c.name }))}
              values={selectedCategories}
              onChange={setSelectedCategories}
            />
          </FilterGroup>

          <FilterGroup title="Personal">
            <CheckAllRow checked={staffAllChecked} onChange={toggleStaffAll} />
            <MultiCheckbox
              items={(staff ?? []).map(s => ({ id: s.id, label: s.name }))}
              values={selectedStaff}
              onChange={setSelectedStaff}
            />
          </FilterGroup>

          <FilterGroup title="Tipo">
            <div className="flex gap-3">
              {[
                { id: "cita", label: "Citas" },
                { id: "ausencia", label: "Ausencias" },
                { id: "ambos", label: "Ambos" },
              ].map((t) => (
                <label key={t.id} className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="radio"
                    name="tipo"
                    value={t.id}
                    checked={tipo === t.id}
                    onChange={(e) => setTipo(e.target.value)}
                    className="rounded size-4 border-white/20 bg-white/10"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </FilterGroup>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button variant="primary" onClick={() => openAdd(null, null)}>+ Añadir cita</Button>

          {(viewType === "timeGridWeek" || viewType === "timeGridDay") && (
            <Button
              variant={showGaps ? "danger" : "ghost"}
              onClick={() => setShowGaps((s) => !s)}
            >
              {showGaps ? "Ocultar huecos" : "Mostrar huecos"}
            </Button>
          )}

          <Link
            to="/calendarios/gestion"
            className="inline-flex items-center px-3 py-2 text-sm border rounded-xl border-white/10 bg-white/10 text-zinc-100 hover:bg-white/15"
            title="Gestión de calendarios"
          >
            ⚙️ Gestión
          </Link>
        </div>
      </section>

      {/* ======= Calendario ======= */}
      <section className={clsx(glassCard, "p-3")}>

        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          firstDay={1}                                   // ✅ lunes
          headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridDay,timeGridWeek,dayGridMonth" }}
          height="auto"
          expandRows
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:15:00"                       // ✅ 15m
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}  // ✅ 14:00
          nowIndicator
          selectable
          selectMirror
          selectConstraint="businessHours"              // ✅ impedir selección fuera de horario
          eventConstraint="businessHours"               // ✅ impedir mover fuera
          select={(sel) => {
            if (viewType === "timeGridDay" || viewType === "timeGridWeek") openAdd(sel.start, sel.end);
          }}
          editable                                       // ✅ drag & drop / resize
          eventDrop={async (info) => {
            const ok = await moveApt.mutateAsync({
              id: info.event.id,
              start: info.event.start.toISOString(),
              end: info.event.end.toISOString(),
            }).catch(()=>false);
            if (!ok) info.revert();
          }}
          eventResize={async (info) => {
            const ok = await moveApt.mutateAsync({
              id: info.event.id,
              start: info.event.start.toISOString(),
              end: info.event.end.toISOString(),
            }).catch(()=>false);
            if (!ok) info.revert();
          }}
          eventClick={(arg) => {
            const isFree = arg.event.extendedProps?.isFreeSlot;
            if (isFree) { openAdd(arg.event.start, arg.event.end); return; }
            // solo editar citas; las ausencias las ignoramos aquí
            if (arg.event.extendedProps?.type === "cita") openEdit(arg.event);
          }}
          businessHours={businessHours ?? []}
          weekends
          events={allEvents}
          datesSet={(info) => {
            setViewType(info.view.type);
            setRange({ start: info.start, end: info.end });
          }}
          // Look & feel (cabeceras visibles, fondo, etc.)
          dayHeaderClassNames={() => ["!text-zinc-100 !bg-white/10"]}
          dayHeaderContent={(arg) => <span className="text-[#0b1020]">{arg.text}</span>}
          slotLabelClassNames={() => ["!text-slate-200"]}
          dayCellClassNames={() => ["!bg-white/5"]}
          eventContent={renderEventContent}             // ✅ badge Pagado/Pendiente
          eventClassNames={() => ["!rounded-md !border !border-white/20 !backdrop-blur"]}
          dayMaxEvents={5} // ✅ máx 5 por celda en dayGridMonth
  moreLinkContent={(arg) => `+${arg.num} más`} // texto del enlace
  moreLinkClassNames={() => ["!text-xs !font-medium !underline"]}
        />
      </section>

      {/* ======= Modal Crear/Editar ======= */}
      {modal.open && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,560px)] p-5")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">{modal.event ? "Editar cita" : "Nueva cita"}</h3>
                <Button variant="ghost" size="sm" onClick={() => setModal({ open:false, start:null, end:null, event:null })}>
                  Cerrar
                </Button>
              </div>
              <AppointmentForm
                mode={modal.event ? "edit" : "create"}
                event={modal.event}
                calendars={calendars ?? []}
                staff={staff ?? []}
                initialStart={modal.start}
                initialEnd={modal.end}
                onSubmit={async (payload) => {
                  if (modal.event) {
                    await updateApt.mutateAsync(payload);
                    setModal({ open:false, start:null, end:null, event:null });
                  } else {
                    await createApt.mutateAsync(payload);
                  }
                }}
                submitting={createApt.isPending || updateApt.isPending}
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

/* ====== Filtros UI ====== */
function FilterGroup({ title, children }) {
  return (
    <div className="p-3 border rounded-xl border-white/10 bg-white/5">
      <div className="mb-2 text-xs font-medium text-slate-300">{title}</div>
      {children}
    </div>
  );
}
function CheckAllRow({ checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 mb-1 text-sm text-slate-200">
      <input type="checkbox" className="rounded size-4 border-white/20 bg-white/10" checked={checked} onChange={onChange}/>
      Marcar todo
    </label>
  );
}
function MultiCheckbox({ items, values, onChange }) {
  const toggle = (id) => onChange(values.includes(id) ? values.filter(v=>v!==id) : [...values, id]);
  return (
    <div className="grid gap-2 pr-1 overflow-auto max-h-24"> {/* ✅ máx 3 aprox + scroll */}
      {items.map((it) => (
        <label key={it.id} className="inline-flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={values.includes(it.id)}
            onChange={() => toggle(it.id)}
            className="rounded size-4 border-white/20 bg-white/10"
          />
          {it.label}
        </label>
      ))}
      {!items.length && <div className="text-xs text-slate-400">Sin opciones</div>}
    </div>
  );
}

/* ====== Form cita ====== */
function AppointmentForm({ mode, event, calendars, staff, initialStart, initialEnd, onSubmit, submitting }) {
  const isEdit = mode === "edit";
  const [title, setTitle] = useState(event?.title || "");
  const [calendarId, setCalendarId] = useState(event?.extendedProps?.calendarId || calendars[0]?.id || "");
  const [staffId, setStaffId] = useState(event?.extendedProps?.staffId || staff[0]?.id || "");
  const [start, setStart] = useState(toLocalInput(event?.start || initialStart) || "");
  const [end, setEnd] = useState(toLocalInput(event?.end || initialEnd) || "");
  const [paid, setPaid] = useState(!!event?.extendedProps?.paid);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title || !calendarId || !staffId || !start || !end) return;
        const payload = {
          id: event?.id,
          title,
          calendarId,
          staffId,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          paid,
          type: "cita",
        };
        onSubmit(payload);
      }}
      className="grid gap-3"
    >
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Título</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Corte - Nombre cliente" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Calendario</span>
          <Select value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>
            {calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Personal</span>
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Inicio</span>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Fin</span>
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 mt-1 text-sm text-slate-200">
        <input type="checkbox" className="rounded size-4 border-white/20 bg-white/10" checked={paid} onChange={(e)=>setPaid(e.target.checked)} />
        Pagado
      </label>

      <div className="flex items-center gap-2 mt-1">
        <Button variant="primary" disabled={submitting} type="submit">
          {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Aceptar"}
        </Button>
      </div>
    </form>
  );
}

/* ====== Render de evento con badge Pago ====== */
function renderEventContent(arg) {
  const { event } = arg;
  const isFree = event.extendedProps?.isFreeSlot;
  const isAbs  = event.extendedProps?.type === "ausencia";
  const paid   = !!event.extendedProps?.paid;

  const calName   = event.extendedProps?.calendarName || "Cita";
  const staffName = event.extendedProps?.staffName || "";

  // Intento simple de extraer el "cliente" de "Corte - Juan"
  const rawTitle = event.title || "";
  const client = rawTitle.includes(" - ") ? rawTitle.split(" - ")[1] : rawTitle;

  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "2px";
  wrap.style.padding = "2px 4px";
  wrap.style.fontSize = "12px";

  const title = document.createElement("div");
  title.style.fontWeight = "600";
  title.style.lineHeight = "1.1";

  if (isAbs) {
    title.textContent = `Ausencia · ${staffName || "Personal"}`;
  } else if (isFree) {
    title.textContent = "Hueco";
  } else {
    // 👉 Calendario – Cliente · Personal
    const left  = calName;
    const mid   = client ? ` – ${client}` : "";
    const right = staffName ? ` · ${staffName}` : "";
    title.textContent = `${left}${mid}${right}`;
  }

  wrap.appendChild(title);

  if (!isAbs && !isFree) {
    const badge = document.createElement("div");
    badge.textContent = paid ? "Pagado" : "Pendiente";
    badge.style.fontSize = "10px";
    badge.style.padding = "1px 6px";
    badge.style.borderRadius = "9999px";
    badge.style.width = "fit-content";
    badge.style.background = paid ? "rgba(16,185,129,0.25)" : "rgba(251,191,36,0.25)";
    badge.style.color = paid ? "#d1fae5" : "#fef3c7";
    wrap.appendChild(badge);
  }

  return { domNodes: [wrap] };
}


/* ================== Helpers ================== */
function toLocalInput(d) {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
}

function computeFreeSlots(businessHours, busyEvents, rangeStart, rangeEnd) {
  const days = [];
  for (let d = new Date(rangeStart); d < rangeEnd; d = addMinutes(d, 1440)) {
    days.push(new Date(d));
  }
  const busy = busyEvents.map((e) => ({ start: new Date(e.start), end: new Date(e.end) }));
  const slots = [];
  for (const day of days) {
    const dow = day.getDay();
    const segments = [];
    for (const bh of businessHours) {
      if (bh.daysOfWeek.includes(dow)) {
        const s = new Date(day);
        const [sh, sm] = bh.startTime.split(":").map(Number);
        s.setHours(sh, sm || 0, 0, 0);
        const e = new Date(day);
        const [eh, em] = bh.endTime.split(":").map(Number);
        e.setHours(eh, em || 0, 0, 0);
        const segStart = maxDate(s, rangeStart);
        const segEnd = minDate(e, rangeEnd);
        if (isBefore(segStart, segEnd)) segments.push({ start: segStart, end: segEnd });
      }
    }
    let gaps = segments.slice();
    for (const b of busy) {
      gaps = subtractIntervalList(gaps, b);
      if (!gaps.length) break;
    }
    slots.push(...gaps);
  }
  return slots;
}
function subtractIntervalList(intervals, block) {
  const out = [];
  for (const it of intervals) {
    if (block.end <= it.start || block.start >= it.end) { out.push(it); continue; }
    if (block.start > it.start) out.push({ start: it.start, end: new Date(Math.min(block.start, it.end)) });
    if (block.end   < it.end)   out.push({ start: new Date(Math.max(block.end, it.start)), end: it.end });
  }
  return out.filter(x => x.end > x.start);
}
