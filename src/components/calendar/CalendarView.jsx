import clsx from "clsx";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import resourcePlugin from "@fullcalendar/resource";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import esLocale from "@fullcalendar/core/locales/es";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

const DEFAULT_HEADER = {
  desktop: { left: "prev,next today", center: "title", right: "timeGridDay,timeGridWeek,dayGridMonth" },
  mobile:  { left: "prev,next today", center: "title", right: "timeGridDay,timeGridWeek,dayGridMonth" },
};

export default function CalendarView({
  className = "",
  calendarRef,
  isMobile = false,
  fcLicense,
  resources = [],
  events = [],
  businessHours = [],
  // callbacks
  onSelect,
  onEventDrop,
  onEventResize,
  onEventClick,
  onEventDidMount,
  onDatesSet,
  // opciones opcionales
  headerDesktop = DEFAULT_HEADER.desktop,
  headerMobile = DEFAULT_HEADER.mobile,
  initialView = "timeGridWeek",
}) {
  return (
    <section className={clsx(glassCard, "p-3 relative z-10", className)}>
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
        resources={resources}
        initialView={initialView}
        firstDay={1}
        headerToolbar={isMobile ? headerMobile : headerDesktop}
        locale={esLocale}
        buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
        titleFormat={{ year: "numeric", month: "short", day: "numeric" }}
        height="auto"
        expandRows
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        slotDuration="00:15:00"
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        nowIndicator
        selectable
        selectMirror
        selectConstraint="businessHours"
        eventConstraint="businessHours"
        select={onSelect}
        editable
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        eventClick={onEventClick}
        eventDidMount={onEventDidMount}
        businessHours={businessHours ?? []}
        weekends
        events={events}
        datesSet={onDatesSet}
        // ⬇️ IMPORTANTE: NADA de *Content (custom rendering) ⬇️
        // dayHeaderContent={...}   <-- eliminado
        // moreLinkContent={...}    <-- eliminado
        // eventContent={...}       <-- eliminado
        // ⬆️ para evitar el bucle de CustomRenderingStore
        dayHeaderClassNames={() => ["!text-zinc-100 !bg-white/10"]}
        slotLabelClassNames={() => ["!text-slate-200"]}
        dayCellClassNames={() => ["!bg-white/5"]}
        eventClassNames={() => ["!rounded-md !border !bg-transparent !bg-clip-padding apt-soft"]}
        dayMaxEvents={5}
        // moreLinkClassNames={() => ["!text-xs !font-medium !underline"]} // opcional; no es *Content
      />
    </section>
  );
}
