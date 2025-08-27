// src/hooks/useCalendarEvents.js
import { useMemo } from "react";
import { computeFreeSlots } from "../utils/slots";
import { mapAppointmentsToEvents, mapAbsencesToEvents } from "../utils/events";

export function useCalendarEvents({
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
}) {
  const events = useMemo(() => {
    const apts = mapAppointmentsToEvents(
      citas ?? [],
      calMap,
      staffNameMap,
      staffColorMap,
      staffMode
    ) ?? [];

    const abs = mapAbsencesToEvents(
      ausencias ?? [],
      staffNameMap,
      staffMode
    ) ?? [];

    const holsAsEvents = (holidays ?? []).map((h) => ({
      start: h.start,
      end: h.end,
      title: h.title,
      display: h.display ?? "background",
      backgroundColor: h.backgroundColor,
    }));

    return [...apts, ...abs, ...holsAsEvents];
  }, [citas, ausencias, holidays, calMap, staffNameMap, staffColorMap, staffMode]);

  const freeSlotEvents = useMemo(() => {
    if (!showGaps || !range?.start || !range?.end || !(businessHours?.length)) {
      return [];
    }
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
  }, [showGaps, businessHours, citas, ausencias, range?.start, range?.end]);

  const allEvents = useMemo(
    () => [...events, ...freeSlotEvents],
    [events, freeSlotEvents]
  );

  return { events, freeSlotEvents, allEvents };
}
