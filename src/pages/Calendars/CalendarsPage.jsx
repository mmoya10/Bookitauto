// src/pages/Calendars/CalendarsPage.jsx
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAppointments,
  fetchAbsences,
  createAppointment,
  updateAppointment,
  updateAppointmentDates,
} from "../../api/calendars";
import clsx from "clsx";

import CalendarFilters from "../../components/calendar/CalendarFilters";
import CalendarActions from "../../components/calendar/CalendarActions";
import CalendarView from "../../components/calendar/CalendarView";

import { useCalendarData } from "../../hooks/useCalendarData";
import { useCalendarEvents } from "../../hooks/useCalendarEvents";

import AppointmentModal from "../../components/forms/AppointmentModal";
import CompleteAppointmentModal from "../../components/forms/CompleteAppointmentModal";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function CalendarsPage() {
  // ====== estado filtros ======
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [tipo] = useState("ambos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [estado, setEstado] = useState(["pendiente"]); // ['asistida','no_asistida','pendiente']

  // responsive
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const [showGaps] = useState(false);
  const [staffMode, setStaffMode] = useState(false);
  const [viewType, setViewType] = useState("timeGridWeek");

  const calendarRef = useRef(null);
  const lastDatesRef = useRef({ viewType: "", startMs: 0, endMs: 0 });
  const [actionPick, setActionPick] = useState({ open: false, event: null });

  // Licencia FullCalendar Premium
  const fcLicense =
    (import.meta && import.meta.env && import.meta.env.VITE_FC_LICENSE) ||
    process.env.REACT_APP_FC_LICENSE ||
    undefined;

  const qc = useQueryClient();

  // ====== datos base ======
  const {
    calendars = [],
    categories = [],
    staff = [],
    businessHours = [],
    holidays = [],
    users = [],
    products = [],
    calMap,
    staffNameMap,
    staffColorMap,
  } = useCalendarData();

  // ====== resources (sin duplicados) ======
  const resources = useMemo(() => {
    const base = (staff ?? []).map((s) => ({ id: s.id, title: s.name }));
    if (!staffMode) return base;
    const sel = new Set(selectedStaff);
    return base.filter((r) => sel.has(r.id));
  }, [staff, staffMode, selectedStaff]);

  function clearFilters() {
    setSelectedCalendars((calendars ?? []).map((c) => c.id));
    setSelectedCategories((categories ?? []).map((c) => c.id));
    setSelectedStaff((staff ?? []).map((s) => s.id));
    setEstado([]);
  }

  // marcar todo al inicio
  useEffect(() => {
    if (calendars && !selectedCalendars.length)
      setSelectedCalendars(calendars.map((c) => c.id));
  }, [calendars]); // eslint-disable-line
  useEffect(() => {
    if (categories && !selectedCategories.length)
      setSelectedCategories(categories.map((c) => c.id));
  }, [categories]); // eslint-disable-line
  useEffect(() => {
    if (staff && !selectedStaff.length)
      setSelectedStaff(staff.map((s) => s.id));
  }, [staff]); // eslint-disable-line

  // rango visible
  const [range, setRange] = useState({ start: null, end: null });

  // ====== citas/ausencias ======
  const { data: citas } = useQuery({
    queryKey: [
      "appointments",
      range,
      selectedCalendars,
      selectedStaff,
      tipo,
      estado,
    ],
    queryFn: () => {
      const statusMap = {
        asistida: "completado",
        no_asistida: "no_presentado",
        pendiente: "pendiente",
      };
      const statusFilter = (estado ?? [])
        .map((e) => statusMap[e])
        .filter(Boolean);
      return fetchAppointments({
        start: range.start?.toISOString(),
        end: range.end?.toISOString(),
        calendarIds: selectedCalendars,
        staffIds: selectedStaff,
        type: tipo === "ambos" ? "ambos" : "cita",
        status: statusFilter.length ? statusFilter : undefined,
      });
    },
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

  // ====== events ======
  const { allEvents } = useCalendarEvents({
    citas,
    ausencias,
    holidays,
    calMap,
    staffNameMap,
    staffColorMap,
    staffMode,
    showGaps,
    businessHours,
    range,
  });

  // ====== crear/editar ======
  const [modal, setModal] = useState({
    open: false,
    start: null,
    end: null,
    event: null,
  });
  const [completePanel, setCompletePanel] = useState({
    open: false,
    event: null,
  });

  // ====== mutations (definidas antes de handlers) ======
  const createApt = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setModal({ open: false, start: null, end: null, event: null });
    },
  });
  const updateApt = useMutation({
    mutationFn: updateAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
  const moveApt = useMutation({
    mutationFn: updateAppointmentDates,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  function openAdd(start, end) {
    setModal({ open: true, start, end, event: null });
  }
  function openEdit(ev) {
    setModal({
      open: true,
      start: new Date(ev.start),
      end: new Date(ev.end),
      event: ev,
    });
  }

  // al cambiar categorías, ajusta calendars seleccionados
  useEffect(() => {
    if (!categories || !calendars) return;
    if (!selectedCategories.length) return;
    const allow = new Set(
      calendars
        .filter((c) => selectedCategories.includes(c.categoryId))
        .map((c) => c.id)
    );
    setSelectedCalendars((prev) => prev.filter((id) => allow.has(id)));
  }, [selectedCategories]); // eslint-disable-line

  // ====== handlers (memo) ======
  const handleSelect = useCallback(
    (sel) => {
      if (viewType === "timeGridDay" || viewType === "timeGridWeek") {
        openAdd(sel.start, sel.end);
      }
    },
    [viewType]
  );

  const handleEventDrop = useCallback(
    async (info) => {
      const okUser = window.confirm(
        "¿Confirmar mover esta cita a la nueva franja?"
      );
      if (!okUser) return info.revert();
      const ok = await moveApt
        .mutateAsync({
          id: info.event.id,
          start: info.event.start?.toISOString(),
          end: info.event.end?.toISOString(),
        })
        .catch(() => false);
      if (!ok) info.revert();
    },
    [moveApt]
  );

  const handleEventResize = useCallback(
    async (info) => {
      const okUser = window.confirm(
        "¿Confirmar cambiar la duración de esta cita?"
      );
      if (!okUser) return info.revert();
      const ok = await moveApt
        .mutateAsync({
          id: info.event.id,
          start: info.event.start?.toISOString(),
          end: info.event.end?.toISOString(),
        })
        .catch(() => false);
      if (!ok) info.revert();
    },
    [moveApt]
  );

  const handleEventClick = useCallback((arg) => {
    const isFree = arg.event.extendedProps?.isFreeSlot;
    if (isFree) return openAdd(arg.event.start, arg.event.end);
    if (arg.event.extendedProps?.type === "cita") {
      setActionPick({ open: true, event: arg.event });
    }
  }, []);

  const handleEventDidMount = useCallback((info) => {
    // Solo estilos imperativos (no cambia estado de React)
    const p = info.event.extendedProps || {};
    if (p.solidBg) {
      info.el.style.background = p.solidBg;
      info.el.style.borderColor = p.solidBorder || "";
      info.el.style.boxShadow = p.glowShadow || "";
      info.el.style.isolation = "isolate";
      info.el.style.mixBlendMode = "normal";
    }
  }, []);

  const handleDatesSet = useCallback(
    (info) => {
      const startMs = info.start?.getTime?.() ?? 0;
      const endMs = info.end?.getTime?.() ?? 0;
      const vt = info.view.type;

      // vista -> solo si cambia
      if (lastDatesRef.current.viewType !== vt) {
        lastDatesRef.current.viewType = vt;
        setViewType(vt);
      }

      // rango -> solo si cambia
      if (
        lastDatesRef.current.startMs !== startMs ||
        lastDatesRef.current.endMs !== endMs
      ) {
        lastDatesRef.current.startMs = startMs;
        lastDatesRef.current.endMs = endMs;
        setRange({ start: info.start, end: info.end });
      }

      // staffMode -> apagar una vez si no es vista de día
      if (staffMode && vt !== "timeGridDay" && vt !== "resourceTimeGridDay") {
        setStaffMode(false);
      }
    },
    [staffMode]
  );

  return (
    <div className="space-y-5 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Calendarios</h1>
        <p className="text-sm text-slate-300">
          Filtra por calendario, categoría, personal y tipo. Vista
          diaria/semanal/mensual.
        </p>
      </header>

      {/* ======= Filtros ======= */}

      <CalendarFilters
        calendars={calendars}
        categories={categories}
        staff={staff}
        selectedCalendars={selectedCalendars}
        setSelectedCalendars={setSelectedCalendars}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedStaff={selectedStaff}
        setSelectedStaff={setSelectedStaff}
        estado={estado}
        setEstado={setEstado}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        onClear={clearFilters}
      />

      {/* ======= Acciones ======= */}
      <CalendarActions
        onAdd={() => openAdd(null, null)}
        viewType={viewType}
        staffMode={staffMode}
        setStaffMode={setStaffMode}
        calendarRef={calendarRef}
      />

      {/* ======= Calendario ======= */}
      <CalendarView
        calendarRef={calendarRef}
        isMobile={isMobile}
        fcLicense={fcLicense}
        resources={resources}
        events={allEvents}
        businessHours={businessHours}
        onSelect={handleSelect}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        onEventClick={handleEventClick}
        onEventDidMount={handleEventDidMount}
        onDatesSet={handleDatesSet}
      />

      {actionPick.open && (
        <ActionDialog
          onClose={() => setActionPick({ open: false, event: null })}
          onEdit={() => {
            const ev = actionPick.event;
            setActionPick({ open: false, event: null });
            openEdit(ev);
          }}
          onResolve={() => {
            const ev = actionPick.event;
            setActionPick({ open: false, event: null });
            setCompletePanel({ open: true, event: ev });
          }}
        />
      )}

      {/* ======= Modal Crear/Editar ======= */}
      {modal.open && (
        <AppointmentModal
          open={modal.open}
          title={modal.event ? "Editar cita" : "Nueva cita"}
          onClose={() =>
            setModal({ open: false, start: null, end: null, event: null })
          }
          mode={modal.event ? "edit" : "create"}
          event={modal.event}
          calendars={calendars}
          staff={staff}
          businessHours={businessHours}
          users={users}
          initialStart={modal.start}
          initialEnd={modal.end}
          submitting={createApt.isPending || updateApt.isPending}
          onOpenComplete={() =>
            setCompletePanel({ open: true, event: modal.event })
          }
          onSubmit={async (payload) => {
            if (modal.event) {
              await updateApt.mutateAsync(payload);
            } else {
              await createApt.mutateAsync(payload);
            }
            setModal({ open: false, start: null, end: null, event: null });
          }}
        />
      )}

      {/* ======= Panel Completar ======= */}
      {completePanel.open && completePanel.event && (
        <CompleteAppointmentModal
          open={!!(completePanel.open && completePanel.event)}
          onClose={() => setCompletePanel({ open: false, event: null })}
          event={completePanel.event}
          products={products}
          onSubmit={async ({
            status,
            productsBought,
            totalCobrado,
            tiendapago,
            productTotal,
            productNames,
            calendarId,
            extraIds,
            serviceTotal,
          }) => {
            const payment =
              completePanel.event.extendedProps?.payment ?? "tienda";

            if (status === "no_presentado") {
              await updateApt.mutateAsync({
                id: completePanel.event.id,
                status: "no_presentado",
              });
              setCompletePanel({ open: false, event: null });
              setModal({ open: false, start: null, end: null, event: null });
              return;
            }

            const minDue = +(
              Number(serviceTotal || 0) + Number(productTotal || 0)
            ).toFixed(2);
            if (Number(totalCobrado) < minDue) {
              alert(
                `Total no puede ser menor que ${minDue.toFixed(
                  2
                )}€ (servicio + productos).`
              );
              return;
            }
            const propina = +(Number(totalCobrado) - minDue).toFixed(2);

            const patch = {
              id: completePanel.event.id,
              status: "completado",
              propina,
              ...(calendarId ? { calendarId } : {}),
              ...(Array.isArray(extraIds) ? { extraIds } : {}),
              ...(typeof serviceTotal === "number"
                ? { totalPrice: serviceTotal }
                : {}),
            };

            if (payment === "tienda") {
              if (!tiendapago) {
                alert("Selecciona método de pago (efectivo/tarjeta).");
                return;
              }
              patch.tiendapago = tiendapago;
            }

            const prevNotes = completePanel.event.extendedProps?.notes || "";
            const noteProd = productsBought?.length
              ? `\nProductos: ${productNames} (=${productTotal.toFixed(2)}€)`
              : "";
            patch.notes = (prevNotes + noteProd).trim();
            patch.products = productsBought;

            await updateApt.mutateAsync(patch);
            setCompletePanel({ open: false, event: null });
            setModal({ open: false, start: null, end: null, event: null });
          }}
        />
      )}
    </div>
  );
}

function ActionDialog({ onClose, onEdit, onResolve }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 w-[280px]">
        <div className="text-sm font-semibold mb-3">¿Qué quieres hacer?</div>
        <div className="grid gap-2">
          <button
            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 text-sm"
            onClick={onEdit}
          >
            Editar
          </button>
          <button
            className="px-3 py-2 rounded-md bg-violet-600/80 hover:bg-violet-600 text-sm"
            onClick={onResolve}
          >
            Resolver
          </button>
          <button
            className="px-3 py-2 rounded-md hover:bg-white/10 text-sm"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
