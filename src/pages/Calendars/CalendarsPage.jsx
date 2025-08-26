import { useMemo, useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBusinessHours,
  fetchHolidays,
  fetchAppointments,
  fetchAbsences,
  createAppointment,
  updateAppointment,
  updateAppointmentDates,
  fetchCalendars,
  fetchCategories,
  fetchStaff, // ⬅️ NUEVO
} from "../../api/calendars";

import { fetchUsers, createUser } from "../../api/users";
import { fetchProducts } from "../../api/products";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import Select from "../../components/common/Select";
import Portal from "../../components/common/Portal";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { addMinutes, isBefore, max as maxDate, min as minDate } from "date-fns";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import resourcePlugin from "@fullcalendar/resource";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import MultiSelect from "../../components/common/MultiSelect";

// Mocks simples en el front (puedes cambiarlos cuando tengas API real)

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function CalendarsPage() {
  // ====== estado filtros ======
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [tipo] = useState("ambos");
  // ya esta
  const [filtersOpen, setFiltersOpen] = useState(false); // móvil: oculto por defecto
  const [estado, setEstado] = useState(["pendiente"]); // ['asistida','no_asistida','pendiente']

  // Header responsive (móvil = columnas)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const headerDesktop = {
    left: "prev,next today",
    center: "title",
    right: "timeGridDay,timeGridWeek,dayGridMonth",
  };
  const headerMobile = {
    left: "prev,next today",
    center: "title",
    right: "timeGridDay,timeGridWeek,dayGridMonth",
  }; // misma config; el “wrap” lo hacemos por CSS

  const [showGaps, setShowGaps] = useState(false);
  const [staffMode, setStaffMode] = useState(false);
  const [viewType, setViewType] = useState("timeGridWeek");

  const calendarRef = useRef(null);

// Licencia FullCalendar Premium: Vite o CRA
const fcLicense =
  import.meta?.env?.VITE_FC_LICENSE ??
  process.env.REACT_APP_FC_LICENSE ??
  undefined;

const qc = useQueryClient();

// ====== datos ======
const { data: calendars } = useQuery({
  queryKey: ["calendars"],
  queryFn: () => fetchCalendars(),
});
const { data: categories } = useQuery({
  queryKey: ["calendar-categories"],
  queryFn: () => fetchCategories(),
});
const { data: staff } = useQuery({
  queryKey: ["staff"],
  queryFn: () => fetchStaff(),
});
const { data: businessHours } = useQuery({
  queryKey: ["business-hours"],
  queryFn: fetchBusinessHours,
});
const { data: holidays } = useQuery({
  queryKey: ["holidays"],
  queryFn: fetchHolidays,
});
const { data: users } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});
const { data: products } = useQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
});

// ====== mapas ======
const calMap = useMemo(
  () => Object.fromEntries((calendars ?? []).map((c) => [c.id, c.name])),
  [calendars]
);
const staffNameMap = useMemo(
  () => Object.fromEntries((staff ?? []).map((s) => [s.id, s.name])),
  [staff]
);
const staffColorMap = useMemo(
  () =>
    Object.fromEntries((staff ?? []).map((s) => [s.id, s.color || "#64748b"])),
  [staff]
);

// ====== resources (sin duplicados) ======
const resources = useMemo(() => {
  const base = (staff ?? []).map((s) => ({ id: s.id, title: s.name }));
  if (!staffMode) return base;
  const sel = new Set(selectedStaff);
  return base.filter((r) => sel.has(r.id));
}, [staff, staffMode, selectedStaff]);

// ====== sincroniza columnas visibles en modo staff ======
useEffect(() => {
  if (!staffMode) return;
  const api = calendarRef.current?.getApi();
  if (!api) return;
  const id = requestAnimationFrame(() => {
    api.setOption("resources", resources);
  });
  return () => cancelAnimationFrame(id);
}, [resources, staffMode]);



  function clearFilters() {
    setSelectedCalendars((calendars ?? []).map((c) => c.id));
    setSelectedCategories((categories ?? []).map((c) => c.id));
    setSelectedStaff((staff ?? []).map((s) => s.id));
    setEstado([]); // por defecto
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
      // mapa: UI -> API
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
        status: statusFilter.length ? statusFilter : undefined, // ✅ aplica filtro
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

  // ======= Eventos (citas + ausencias + festivos) con nombres =======
  const events = useMemo(() => {
    const apts = (citas ?? []).map((e) => {
      const calName = calMap?.[e.calendarId] || "Cita";
      const client = e.user
        ? `${e.user.firstName || e.user.name || ""} ${
            e.user.lastName || e.user.surname || ""
          }`.trim()
        : "";
      const staffName = staffNameMap?.[e.staffId] || "";
      const staffCol = staffColorMap?.[e.staffId] || "#64748b";

      // Título: Calendario – Cliente
      const title = `${calName}${client ? " – " + client : ""}`;

      // Colores por estado (sin alpha real)
      // asistida -> e.status === "completado"
      // no asistida -> e.status === "no_presentado"
      const baseGreen = "#10b981";
      const baseRed = "#f43f5e";
      const colorBase =
        e.status === "completado"
          ? baseGreen
          : e.status === "no_presentado"
          ? baseRed
          : staffCol || "#64748b";

      const bgTop = tintHex(colorBase, 0.2); // mezcla con blanco (opaco)
      const bgBottom = tintHex(colorBase, 0.5);
      const solidBg = `linear-gradient(180deg, ${bgTop}, ${bgBottom})`;
      const solidBorder = shadeHex(colorBase, 0.35); // borde un poco más oscuro
      const glowShadow = `0 6px 16px ${rgbaFromHex(colorBase, 0.2)}`;

      return {
        ...e,
        title,
        backgroundColor: "transparent",
        borderColor: solidBorder,
        textColor: "#fff",
        classNames: ["apt-soft"],
resourceId: staffMode ? (e.staffId ?? null) : undefined,
        extendedProps: {
          ...e,
          calendarName: calName,
          staffName,
          staffColor: staffCol,
          paymentKind:
            e.payment === "online"
              ? "online"
              : e.tiendapago
              ? `tienda: ${e.tiendapago}`
              : "tienda",
          solidBg,
          solidBorder,
          glowShadow,
        },
      };
    });

    const abs = (ausencias ?? []).map((e) => ({
      ...e,
      title: `Ausencia · ${staffNameMap?.[e.staffId] || ""}`,
      backgroundColor: "rgba(239,68,68,0.25)",
      borderColor: "rgba(239,68,68,0.6)",
      textColor: "#fff",
      resourceId: staffMode ? (e.staffId ?? null) : undefined,
      extendedProps: {
        ...e,
        calendarName: "Ausencia",
        staffName: staffNameMap?.[e.staffId],
      },
    }));

    return [...apts, ...abs, ...(holidays ?? [])];
}, [citas, ausencias, holidays, calMap, staffNameMap, staffColorMap, staffMode]);

  // huecos libres (solo día/semana)
  const freeSlotEvents = useMemo(() => {
    if (!showGaps) return [];
    if (!range.start || !range.end || !businessHours) return [];
    const busy = (citas ?? []).concat(ausencias ?? []);
    return computeFreeSlots(businessHours, busy, range.start, range.end).map(
      (g, i) => ({
        id: `free-${i}`,
        title: "Hueco",
        start: g.start,
        end: g.end,
        backgroundColor: "rgba(34,211,238,0.18)",
        borderColor: "rgba(34,211,238,0.45)",
        textColor: "#e6f9ff",
        extendedProps: { isFreeSlot: true },
      })
    );
  }, [showGaps, businessHours, citas, ausencias, range.start, range.end]);

  const allEvents = useMemo(
    () => events.concat(freeSlotEvents),
    [events, freeSlotEvents]
  );

  // crear/editar cita
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

  // helpers filtros “marcar todo”
  // al cambiar categorías, ajusta “calendars” seleccionados a los que entran
  useEffect(() => {
    if (!categories || !calendars) return;
    if (!selectedCategories.length) return; // si nada seleccionado, no toques
    const allow = new Set(
      calendars
        .filter((c) => selectedCategories.includes(c.categoryId))
        .map((c) => c.id)
    );
    setSelectedCalendars((prev) => prev.filter((id) => allow.has(id)));
  }, [selectedCategories]); // eslint-disable-line

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
      <section className={clsx(glassCard, "p-4 relative z-30")}>
        {" "}
        {/* ⬅️ z-30 */}
        {/* Botón de abrir/cerrar filtros (solo móvil) */}
        <div className="mb-3 md:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-white/10 bg-white/10 text-zinc-100 hover:bg-white/15"
            title="Mostrar/ocultar filtros"
          >
            {/* icono filtro */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="opacity-80"
            >
              <path d="M3 5h18v2H3V5zm4 6h10v2H7v-2zm-2 6h14v2H5v-2z" />
            </svg>
            Filtros
          </button>
        </div>
        {/* Contenido colapsable: en móvil se oculta si filtersOpen=false; en desktop siempre visible */}
        <div className={clsx(filtersOpen ? "block" : "hidden", "md:block")}>
          <div className="grid gap-3 md:grid-cols-5">
            {/* Calendarios */}
            {/* Calendarios */}
            <FilterGroup title="Calendarios">
              <MultiSelect
                items={(calendars ?? []).map((c) => ({
                  id: c.id,
                  label: c.name,
                }))}
                values={selectedCalendars}
                onChange={setSelectedCalendars}
                placeholder="Todos los calendarios"
                selectAllLabel="Todos"
                showSelectAll
              />
            </FilterGroup>

            {/* Categorías */}
            <FilterGroup title="Categorías">
              <MultiSelect
                items={(categories ?? []).map((c) => ({
                  id: c.id,
                  label: c.name,
                }))}
                values={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Todas las categorías"
                selectAllLabel="Todas"
                showSelectAll
              />
            </FilterGroup>

            {/* Personal */}
            <FilterGroup title="Personal">
              <MultiSelect
                items={(staff ?? []).map((s) => ({ id: s.id, label: s.name }))}
                values={selectedStaff}
                onChange={setSelectedStaff}
                placeholder="Todo el personal"
                selectAllLabel="Todo"
                showSelectAll
              />
            </FilterGroup>

            {/* Estado */}
            <FilterGroup title="Estado">
              <MultiSelect
                items={[
                  { id: "asistida", label: "Asistidas" },
                  { id: "no_asistida", label: "No asistidas" },
                  { id: "pendiente", label: "Pendientes" },
                ]}
                values={estado}
                onChange={setEstado}
                placeholder="Todos los estados"
                selectAllLabel="Todos"
                showSelectAll
              />
            </FilterGroup>
            <Button
              variant="ghost"
              onClick={clearFilters}
              title="Restablecer filtros"
              disabled={!calendars || !categories || !staff}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </section>
      {/* ======= Acciones ======= */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Button variant="primary" onClick={() => openAdd(null, null)}>
          + Añadir cita
        </Button>

        {(viewType === "timeGridWeek" || viewType === "timeGridDay") && (
          <Button
            variant={showGaps ? "danger" : "ghost"}
            onClick={() => setShowGaps((s) => !s)}
          >
            {showGaps ? "Ocultar huecos" : "Mostrar huecos"}
          </Button>
        )}
        {(viewType === "timeGridDay" || viewType === "resourceTimeGridDay") && (
          <Button
            variant={staffMode ? "danger" : "ghost"}
            onClick={() => {
              const api = calendarRef.current?.getApi();
              if (!api) return;
              if (staffMode) {
                setStaffMode(false);
                api.changeView("timeGridDay");
              } else {
                setStaffMode(true);
                api.changeView("resourceTimeGridDay");
              }
            }}
          >
            {staffMode ? "Salir modo staff" : "Modo staff"}
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

      {/* ======= Calendario ======= */}
      <section className={clsx(glassCard, "p-3 relative z-10")}>
        {" "}
        {/* ⬅️ z-10 */}
        <FullCalendar
          ref={calendarRef}
          plugins={[
            timeGridPlugin,
            dayGridPlugin,
            interactionPlugin,
            resourcePlugin,
            resourceTimeGridPlugin,
          ]}
          schedulerLicenseKey={fcLicense}
          // o quítala en evaluación para ver el aviso
resources={resources}          
          initialView="timeGridWeek"
          firstDay={1} // ✅ lunes
          headerToolbar={isMobile ? headerMobile : headerDesktop}
          locale={esLocale}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
          titleFormat={{ year: "numeric", month: "long", day: "numeric" }}
          height="auto"
          expandRows
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:15:00" // ✅ 15m
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }} // ✅ 14:00
          nowIndicator
          selectable
          selectMirror
          selectConstraint="businessHours" // ✅ impedir selección fuera de horario
          eventConstraint="businessHours" // ✅ impedir mover fuera
          select={(sel) => {
            if (viewType === "timeGridDay" || viewType === "timeGridWeek")
              openAdd(sel.start, sel.end);
          }}
          editable // ✅ drag & drop / resize
          eventDrop={async (info) => {
            const okUser = window.confirm(
              "¿Confirmar mover esta cita a la nueva franja?"
            );
            if (!okUser) {
              info.revert();
              return;
            }

            const ok = await moveApt
              .mutateAsync({
                id: info.event.id,
                start: info.event.start.toISOString(),
                end: info.event.end.toISOString(),
              })
              .catch(() => false);

            if (!ok) info.revert();
          }}
          eventResize={async (info) => {
            const okUser = window.confirm(
              "¿Confirmar cambiar la duración de esta cita?"
            );
            if (!okUser) {
              info.revert();
              return;
            }

            const ok = await moveApt
              .mutateAsync({
                id: info.event.id,
                start: info.event.start.toISOString(),
                end: info.event.end.toISOString(),
              })
              .catch(() => false);

            if (!ok) info.revert();
          }}
          eventClick={(arg) => {
            const isFree = arg.event.extendedProps?.isFreeSlot;
            if (isFree) {
              openAdd(arg.event.start, arg.event.end);
              return;
            }
            if (arg.event.extendedProps?.type === "cita") openEdit(arg.event);
          }}
          eventDidMount={(info) => {
            const p = info.event.extendedProps || {};
            if (p.solidBg) {
              info.el.style.background = p.solidBg; // gradiente opaco
              info.el.style.borderColor = p.solidBorder || "";
              info.el.style.boxShadow = p.glowShadow || ""; // glow suave
              info.el.style.isolation = "isolate"; // evita blending con el stack
              info.el.style.mixBlendMode = "normal";
            }
          }}
          businessHours={businessHours ?? []}
          weekends
          events={allEvents}
          datesSet={(info) => {
            setViewType(info.view.type);
            setRange({ start: info.start, end: info.end });
            if (
              info.view.type !== "timeGridDay" &&
              info.view.type !== "resourceTimeGridDay" &&
              staffMode
            ) {
              setStaffMode(false);
              const api = calendarRef.current?.getApi();
              api?.changeView("timeGridWeek");
            }
          }}
          // Look & feel (cabeceras visibles, fondo, etc.)
          dayHeaderClassNames={() => ["!text-zinc-100 !bg-white/10"]}
          dayHeaderContent={(arg) => (
            <span className="text-[#0b1020]">{arg.text}</span>
          )}
          slotLabelClassNames={() => ["!text-slate-200"]}
          dayCellClassNames={() => ["!bg-white/5"]}
          eventContent={renderEventContent} // ✅ badge Pagado/Pendiente
          eventClassNames={() => [
            "!rounded-md !border !bg-transparent !bg-clip-padding apt-soft",
          ]}
          dayMaxEvents={5} // ✅ máx 5 por celda en dayGridMonth
          moreLinkContent={(arg) => `+${arg.num} más`} // texto del enlace
          moreLinkClassNames={() => ["!text-xs !font-medium !underline"]}
        />
      </section>

      {/* ======= Modal Crear/Editar ======= */}
      {modal.open && (
        <Portal>
          <div className="fixed inset-0 z-[1100] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,560px)] p-5")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white/90">
                  {modal.event ? "Editar cita" : "Nueva cita"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setModal({
                      open: false,
                      start: null,
                      end: null,
                      event: null,
                    })
                  }
                >
                  Cerrar
                </Button>
              </div>

              <AppointmentForm
                mode={modal.event ? "edit" : "create"}
                event={modal.event}
                calendars={calendars ?? []}
                staff={staff ?? []}
                businessHours={businessHours ?? []}
                users={users ?? []}
                initialStart={modal.start}
                initialEnd={modal.end}
                onOpenComplete={() =>
                  setCompletePanel({ open: true, event: modal.event })
                }
                onSubmit={async (payload) => {
                  if (modal.event) {
                    await updateApt.mutateAsync(payload);
                    setModal({
                      open: false,
                      start: null,
                      end: null,
                      event: null,
                    });
                  } else {
                    await createApt.mutateAsync(payload);
                    setModal({
                      open: false,
                      start: null,
                      end: null,
                      event: null,
                    });
                  }
                }}
                submitting={createApt.isPending || updateApt.isPending}
              />
            </div>
          </div>
        </Portal>
      )}

      {/* ======= Panel Completar ======= */}
      {completePanel.open && completePanel.event && (
        <Portal>
          <div className="fixed inset-0 z-[1200] grid place-items-center bg-black/40 p-4">
            <div className={`${glassCard} w-[min(96vw,560px)] p-5`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Completar cita</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompletePanel({ open: false, event: null })}
                >
                  Cerrar
                </Button>
              </div>

              <CompleteForm
                event={completePanel.event}
                products={products ?? []}
                onCancel={() => setCompletePanel({ open: false, event: null })}
                onSubmit={async ({
                  status,
                  productsBought,
                  totalCobrado,
                  tiendapago,
                  productTotal,
                  productNames,
                }) => {
                  const prevTotal = Number(
                    completePanel.event.extendedProps?.totalPrice ?? 0
                  );
                  const payment =
                    completePanel.event.extendedProps?.payment ?? "tienda";

                  if (status === "no_presentado") {
                    await updateApt.mutateAsync({
                      id: completePanel.event.id,
                      status: "no_presentado",
                    });
                    setCompletePanel({ open: false, event: null });
                    setModal({
                      open: false,
                      start: null,
                      end: null,
                      event: null,
                    });
                    return;
                  }

                  const minDue = +(prevTotal + productTotal).toFixed(2);
                  if (totalCobrado < minDue) {
                    alert(
                      `Total no puede ser menor que ${minDue.toFixed(
                        2
                      )}€ (cita + productos).`
                    );
                    return;
                  }
                  const propina = +(totalCobrado - minDue).toFixed(2);

                  const patch = {
                    id: completePanel.event.id,
                    status: "completado",
                    propina,
                  };
                  if (payment === "tienda") {
                    if (!tiendapago) {
                      alert("Selecciona método de pago (efectivo/tarjeta).");
                      return;
                    }
                    patch.tiendapago = tiendapago;
                  }
                  const prevNotes =
                    completePanel.event.extendedProps?.notes || "";
                  const noteProd = productsBought?.length
                    ? `\nProductos: ${productNames} (=${productTotal.toFixed(
                        2
                      )}€)`
                    : "";
                  patch.notes = (prevNotes + noteProd).trim();
                  patch.products = productsBought; // si tu API quiere guardar los IDs

                  await updateApt.mutateAsync(patch);
                  setCompletePanel({ open: false, event: null });
                  setModal({
                    open: false,
                    start: null,
                    end: null,
                    event: null,
                  });
                }}
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

/* ====== Form cita ====== */
function AppointmentForm({
  mode,
  event,
  calendars,
  staff,
  initialStart,
  initialEnd,
  businessHours = [],
  users = [],
  onSubmit,
  onOpenComplete,
  submitting,
}) {
  const isEdit = mode === "edit";

  // ===== Usuario =====
  const qc = useQueryClient();
  const [userId, setUserId] = useState(
    event?.extendedProps?.user?.id || (users[0]?.id ?? "")
  );
  const [creatingUser, setCreatingUser] = useState(false);
  const [nu, setNu] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const createUserMut = useMutation({
    mutationFn: createUser,
    onSuccess: async (newUser) => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      setUserId(newUser?.id);
      setCreatingUser(false);
    },
  });

  // ===== Calendario / Extras =====
  const [calendarId, setCalendarId] = useState(
    event?.extendedProps?.calendarId || calendars[0]?.id || ""
  );
  const selectedCal = useMemo(
    () => calendars.find((c) => c.id === calendarId),
    [calendars, calendarId]
  );
  const [extraIds, setExtraIds] = useState(
    event?.extendedProps?.extraIds || []
  );
  const extrasOpts = useMemo(() => {
    const ids = selectedCal?.extrasSupported || [];
    return calendars
      .filter((c) => ids.includes(c.id))
      .map((e) => ({
        id: e.id,
        label: e.name,
        duration: e.duration,
        price: e.price,
      }));
  }, [selectedCal, calendars]);

  // ===== Personal =====
  const [staffId, setStaffId] = useState(
    event?.extendedProps?.staffId || staff[0]?.id || ""
  );

  // ===== Fechas / Huecos por duración =====
  // ===== Fechas / Slots =====
  const baseStart = event?.start || initialStart || new Date();
  const baseEnd =
    event?.end || initialEnd || new Date(baseStart.getTime() + 45 * 60000);

  const [dateOnly, setDateOnly] = useState(toLocalDate(baseStart));
  const [start, setStart] = useState(toLocalInput(baseStart)); // se setea desde slot
  const [end, setEnd] = useState(toLocalInput(baseEnd)); // se setea desde slot

  const totalDuration = useMemo(() => {
    const main = Number(selectedCal?.duration || 30);
    const exDur = extrasOpts
      .filter((x) => extraIds.includes(x.id))
      .reduce((a, x) => a + Number(x.duration || 0), 0);
    return main + exDur; // minutos
  }, [selectedCal, extrasOpts, extraIds]);

  const [slots, setSlots] = useState([]);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(-1);

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!dateOnly || !staffId || !totalDuration || !businessHours?.length) {
        setSlots([]);
        setSelectedSlotIdx(-1);
        return;
      }
      const dayStart = new Date(dateOnly + "T00:00:00");
      const dayEnd = new Date(dateOnly + "T23:59:59");

      // eventos ocupados del staff ese día
      const res = await fetchAppointments({
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
        staffIds: [staffId],
        type: "ambos",
      });

      const busy = res.map((e) => ({
        start: new Date(e.start),
        end: new Date(e.end),
      }));
      const gaps = computeFreeSlotsForStaff(
        businessHours,
        busy,
        dayStart,
        dayEnd
      );

      // trocear gaps en slots de 15m donde quepa totalDuration
      const out = [];
      for (const g of gaps) {
        for (
          let t = new Date(g.start);
          t <= new Date(g.end.getTime() - totalDuration * 60000);
          t = addMinutes(t, 15)
        ) {
          const s = t;
          const e = new Date(t.getTime() + totalDuration * 60000);
          if (e <= g.end) out.push({ start: s, end: e });
        }
      }

      if (cancel) return;
      setSlots(out);

      // si estamos editando, intenta preseleccionar el slot correspondiente
      if (event?.start && event?.end) {
        const msStart = new Date(event.start).getTime();
        const idx = out.findIndex((x) => x.start.getTime() === msStart);
        setSelectedSlotIdx(idx >= 0 ? idx : -1);
      } else {
        setSelectedSlotIdx(-1);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [
    dateOnly,
    staffId,
    totalDuration,
    businessHours,
    event?.start,
    event?.end,
  ]);

  // ===== Precio total y pago en tienda por defecto =====
  const totalPrice = useMemo(() => {
    const main = Number(selectedCal?.price || 0);
    const ex = extrasOpts
      .filter((x) => extraIds.includes(x.id))
      .reduce((a, x) => a + Number(x.price || 0), 0);
    return +(main + ex).toFixed(2);
  }, [selectedCal, extrasOpts, extraIds]);

  const [payment] = useState("tienda"); // fijamos tienda por defecto
  const [tiendapago, setTiendapago] = useState(
    event?.extendedProps?.tiendapago || "efectivo"
  );
  const [notes, setNotes] = useState(event?.extendedProps?.notes || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        const selUser = (users ?? []).find((u) => u.id === userId) || null;

        const payload = {
          id: event?.id,
          calendarId,
          staffId,
          extraIds,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          type: "cita",
          user: selUser
            ? {
                id: selUser.id,
                firstName: selUser.firstName || selUser.name,
                lastName: selUser.lastName || selUser.surname,
                email: selUser.email,
                phone: selUser.phone,
              }
            : null,
          totalPrice,
          payment,
          tiendapago,
          propina: Number(event?.extendedProps?.propina ?? 0),
          notes,
        };
        onSubmit(payload);
      }}
      className="grid gap-3"
    >
      {/* Usuario */}
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Usuario</span>
        {!creatingUser ? (
          <div className="flex gap-2">
            <Select
              value={userId}
              onChange={(val) => setUserId(val)}
              options={(users ?? []).map((u) => ({
                value: u.id,
                label: `${u.firstName || u.name} ${u.lastName || u.surname} · ${
                  u.phone || ""
                }`.trim(),
              }))}
              searchable={true}
              searchPlaceholder="Buscar cliente…"
              className="flex-1"
            />

            <Button type="button" onClick={() => setCreatingUser(true)}>
              Nuevo
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nombre"
                value={nu.firstName}
                onChange={(e) => setNu({ ...nu, firstName: e.target.value })}
              />
              <Input
                placeholder="Apellidos"
                value={nu.lastName}
                onChange={(e) => setNu({ ...nu, lastName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Email"
                value={nu.email}
                onChange={(e) => setNu({ ...nu, email: e.target.value })}
              />
              <Input
                placeholder="Teléfono"
                value={nu.phone}
                onChange={(e) => setNu({ ...nu, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={async () => {
                  const created = await createUserMut
                    .mutateAsync(nu)
                    .catch(() => null);
                  if (!created) alert("No se pudo crear el usuario.");
                }}
              >
                Crear
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setCreatingUser(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Calendario / Personal */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Calendario</span>
          <Select
            options={(calendars ?? []).map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={calendarId}
            onChange={(val) => {
              setCalendarId(val);
              setExtraIds([]);
            }}
            searchable={true}
            searchPlaceholder="Buscar calendario"
            className="flex-1"
          />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Personal</span>
          <Select
            options={(staff ?? []).map((s) => ({ value: s.id, label: s.name }))}
            value={staffId}
            onChange={(val) => setStaffId(val)}
            searchable={true}
            searchPlaceholder="Buscar personal"
            className="flex-1"
          />
        </div>
      </div>

      {/* Extras */}
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Extras</span>
        <MultiSelect
          items={extrasOpts.map((x) => ({
            id: x.id,
            label: `${x.label || x.name || x.id}`,
          }))}
          values={extraIds}
          onChange={setExtraIds}
          placeholder={
            extrasOpts.length ? "Selecciona extras" : "No hay extras"
          }
          disabled={!extrasOpts.length}
          showSelectAll
          selectAllLabel="Todos"
        />
        <div className="text-[11px] text-slate-400">
          Duración total: {totalDuration} min
        </div>
      </div>

      {/* Fecha / Huecos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Fecha</span>
          <Input
            type="date"
            value={dateOnly}
            onChange={(e) => setDateOnly(e.target.value)}
          />
        </div>

        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Hora</span>
          <Select
            options={
              slots.length
                ? [{ value: "-1", label: "Selecciona un hueco…" }].concat(
                    slots.map((s, i) => ({
                      value: String(i),
                      label: formatSlotLabel(s.start, s.end),
                    }))
                  )
                : [{ value: "-1", label: "Sin huecos" }]
            }
            value={String(selectedSlotIdx)}
            onChange={(val) => {
              const i = Number(val);
              setSelectedSlotIdx(i);
              const s = slots[i];
              if (s) {
                setStart(toLocalInput(s.start));
                setEnd(toLocalInput(s.end));
              }
            }}
            disabled={!slots.length}
          />
        </div>
      </div>

      {/* Precio y pago */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Precio total</span>
          <Input value={totalPrice} readOnly />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Pago</span>
          <Input value="tienda" readOnly />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Método tienda</span>
          <Select
            options={[
              { value: "efectivo", label: "Efectivo" },
              { value: "tarjeta", label: "Tarjeta" },
            ]}
            value={tiendapago}
            onChange={(val) => setTiendapago(val)}
          />
        </div>
      </div>

      {/* Notas */}
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Notas</span>
        <Input
          as="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones…"
        />
      </div>

      <div className="flex items-center gap-2 mt-1">
        <Button variant="primary" disabled={submitting} type="submit">
          {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Aceptar"}
        </Button>
        {isEdit && (
          <Button type="button" onClick={onOpenComplete}>
            Completar cita
          </Button>
        )}
      </div>
    </form>
  );
}

function CompleteForm({ event, products = [], onCancel, onSubmit }) {
  const [status, setStatus] = useState("completado"); // "no_presentado" | "completado"
  const prevTotal = Number(event.extendedProps?.totalPrice ?? 0);
  const payment = event.extendedProps?.payment ?? "tienda";

  const [productsBought, setProductsBought] = useState([]); // array de IDs
  const [totalCobrado, setTotalCobrado] = useState(prevTotal);
  const [tiendapago, setTiendapago] = useState(
    event.extendedProps?.tiendapago || "efectivo"
  );

  const canPaymentChoice = payment === "tienda";

  const priceOf = (p) => Number(p?.salePrice ?? p?.price ?? 0);
  const productTotal = (productsBought ?? [])
    .map((id) => (products || []).find((p) => p.id === id))
    .filter(Boolean)
    .reduce((acc, p) => acc + priceOf(p), 0);

  const minDue = +(prevTotal + productTotal).toFixed(2);

  useEffect(() => {
    setTotalCobrado((t) => (Number(t) < minDue ? minDue : Number(t)));
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
        onSubmit({
          status,
          productsBought,
          productNames,
          productTotal,
          totalCobrado: Number(totalCobrado),
          tiendapago,
        });
      }}
    >
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Estado</span>
        <div className="flex gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="st"
              checked={status === "no_presentado"}
              onChange={() => setStatus("no_presentado")}
            />
            No presentado
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="st"
              checked={status === "completado"}
              onChange={() => setStatus("completado")}
            />
            Completado
          </label>
        </div>
      </div>

      {status === "completado" && (
        <>
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Productos</span>
            <MultiSelect
              items={(products ?? []).map((p) => ({
                id: p.id,
                label: `${p.name} (${(p.salePrice ?? p.price).toFixed(2)}€)`,
              }))}
              values={productsBought}
              onChange={setProductsBought}
              placeholder="Selecciona productos vendidos"
              showSelectAll
              selectAllLabel="Todos"
            />
            <div className="text-[11px] text-slate-400">
              Importe productos: {productTotal.toFixed(2)} €
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <span className="text-xs text-slate-300">Total a cobrar (€)</span>
              <Input
                type="number"
                step="0.01"
                min={minDue}
                value={totalCobrado}
                onChange={(e) => setTotalCobrado(e.target.value)}
              />
              <div className="text-[11px] text-slate-400">
                Cita: {prevTotal.toFixed(2)} € · Productos:{" "}
                {productTotal.toFixed(2)} € · Mín.: {minDue.toFixed(2)} € ·
                Propina: {Math.max(0, Number(totalCobrado) - minDue).toFixed(2)}{" "}
                €
              </div>
            </div>

            {canPaymentChoice && (
              <div className="grid gap-1.5">
                <span className="text-xs text-slate-300">Método de pago</span>
                <Select
                  options={[
                    { value: "efectivo", label: "Efectivo" },
                    { value: "tarjeta", label: "Tarjeta" },
                  ]}
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
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/* ====== Render de evento con badge Pago ====== */
function renderEventContent(arg) {
  const { event } = arg;
  const isFree = event.extendedProps?.isFreeSlot;
  const isAbs = event.extendedProps?.type === "ausencia";

  const staffName = event.extendedProps?.staffName || "";
  const payKind = event.extendedProps?.paymentKind || "";

  const rawTitle = event.title || "";

  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "2px";
  wrap.style.padding = "2px 4px";
  wrap.style.fontSize = "12px";

  // ===== Título =====
  const title = document.createElement("div");
  title.style.fontWeight = "600";
  title.style.lineHeight = "1.1";

  if (isAbs) {
    title.textContent = `Ausencia · ${staffName || "Personal"}`;
  } else if (isFree) {
    title.textContent = "Hueco";
  } else {
    // Ejemplo: Corte Premium – Juan
    title.textContent = rawTitle;
  }
  wrap.appendChild(title);

  // ===== Badge de método de pago =====
  if (!isAbs && !isFree && payKind) {
    const badge = document.createElement("div");
    badge.textContent = payKind === "online" ? "Online" : payKind; // "tienda: efectivo/tarjeta"
    badge.style.fontSize = "10px";
    badge.style.padding = "1px 6px";
    badge.style.borderRadius = "9999px";
    badge.style.width = "fit-content";

    if (payKind === "online") {
      badge.style.background = "rgba(16,185,129,0.25)"; // verde suave
      badge.style.color = "#d1fae5";
    } else {
      badge.style.background = "rgba(124,58,237,0.25)"; // morado suave
      badge.style.color = "#ede9fe";
    }

    wrap.appendChild(badge);
  }

  return { domNodes: [wrap] };
}
function hexToRgb(hex) {
  let h = (hex || "#64748b").replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r, g, b) {
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function mixHex(h1, h2, t) {
  const a = hexToRgb(h1),
    b = hexToRgb(h2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return rgbToHex(r, g, bl);
}
function tintHex(hex, t) {
  return mixHex(hex, "#ffffff", t);
} // 0..1 con blanco
function shadeHex(hex, t) {
  return mixHex(hex, "#000000", t);
} // 0..1 con negro
function rgbaFromHex(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/* ================== Helpers ================== */
function formatSlotLabel(start, end) {
  const s = toLocalTime(start);
  const e = toLocalTime(end);
  return `${s}-${e}`;
}
function toLocalInput(d) {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
}
function toLocalDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 10);
}
function toLocalTime(d) {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(11, 16);
}

// Igual que computeFreeSlots, pero no recorre todos los días; solo 1 día y para businessHours pasados
function computeFreeSlotsForStaff(
  businessHours,
  busyEvents,
  rangeStart,
  rangeEnd
) {
  const days = [new Date(rangeStart)];
  const busy = busyEvents.map((e) => ({
    start: new Date(e.start),
    end: new Date(e.end),
  }));
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
        const segStart = maxDate([s, rangeStart]);
        const segEnd = minDate([e, rangeEnd]);

        if (isBefore(segStart, segEnd))
          segments.push({ start: segStart, end: segEnd });
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

// Resta un bloque [start,end) a una lista de intervalos
function subtractIntervalList(intervals, block) {
  const out = [];
  for (const it of intervals) {
    // no solapa
    if (block.end <= it.start || block.start >= it.end) {
      out.push(it);
      continue;
    }
    // hay solape: puede partir el intervalo en 2
    if (block.start > it.start)
      out.push({
        start: it.start,
        end: new Date(Math.min(block.start, it.end)),
      });
    if (block.end < it.end)
      out.push({ start: new Date(Math.max(block.end, it.start)), end: it.end });
  }
  return out.filter((x) => x.end > x.start);
}

// Calcula huecos libres dentro de businessHours restando eventos ocupados (busyEvents)
function computeFreeSlots(businessHours, busyEvents, rangeStart, rangeEnd) {
  const days = [];
  for (let d = new Date(rangeStart); d < rangeEnd; d = addMinutes(d, 1440)) {
    days.push(new Date(d));
  }
  const busy = busyEvents.map((e) => ({
    start: new Date(e.start),
    end: new Date(e.end),
  }));
  const slots = [];
  for (const day of days) {
    const dow = day.getDay();
    const segments = [];
    for (const bh of businessHours || []) {
      if ((bh.daysOfWeek || []).includes(dow)) {
        const s = new Date(day);
        const [sh, sm] = (bh.startTime || "00:00").split(":").map(Number);
        s.setHours(sh, sm || 0, 0, 0);
        const e = new Date(day);
        const [eh, em] = (bh.endTime || "23:59").split(":").map(Number);
        e.setHours(eh, em || 0, 0, 0);
        const segStart = maxDate([s, rangeStart]); // ✅
        const segEnd = minDate([e, rangeEnd]); // ✅
        if (isBefore(segStart, segEnd))
          segments.push({ start: segStart, end: segEnd });
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
