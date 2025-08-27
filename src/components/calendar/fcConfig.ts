// src/components/calendar/fcConfig.ts
export const fcHeaderDesktop = { left:"prev,next today", center:"title", right:"timeGridDay,timeGridWeek,dayGridMonth" };
export const fcHeaderMobile  = { left:"prev,next today", center:"title", right:"timeGridDay,timeGridWeek,dayGridMonth" };
export const fcBaseOptions   = {
  firstDay: 1, height: "auto", expandRows: true,
  slotMinTime: "07:00:00", slotMaxTime: "21:00:00",
  slotDuration: "00:15:00",
  slotLabelFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
  nowIndicator: true, selectable: true, selectMirror: true,
  selectConstraint: "businessHours", eventConstraint: "businessHours",
  dayMaxEvents: 5
};
