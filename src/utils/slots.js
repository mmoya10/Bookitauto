// Cálculo de huecos libres dentro de businessHours restando eventos ocupados

/** Resta un bloque [start,end) a una lista de intervalos {start, end} */
export function subtractIntervalList(intervals, block) {
  const out = [];
  const bStart = new Date(block.start);
  const bEnd = new Date(block.end);

  for (const it of intervals) {
    const iStart = new Date(it.start);
    const iEnd = new Date(it.end);

    // no solapa
    if (bEnd <= iStart || bStart >= iEnd) {
      out.push({ start: iStart, end: iEnd });
      continue;
    }
    // solape parcial/total: puede partir en dos
    if (bStart > iStart) out.push({ start: iStart, end: new Date(Math.min(bStart, iEnd)) });
    if (bEnd < iEnd) out.push({ start: new Date(Math.max(bEnd, iStart)), end: iEnd });
  }
  return out.filter((x) => x.end > x.start);
}

/** Huecos libres en un rango [rangeStart,rangeEnd) para N días */
export function computeFreeSlots(businessHours, busyEvents, rangeStart, rangeEnd) {
  if (!businessHours?.length) return [];
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  if (!(start < end)) return [];

  const days = [];
  // recorrer días por pasos de 24h
  for (let d = new Date(start); d < end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    days.push(new Date(d));
  }

  const busy = (busyEvents || []).map((e) => ({
    start: new Date(e.start),
    end: new Date(e.end),
  }));

  const slots = [];
  for (const day of days) {
    const dow = day.getDay(); // 0..6
    // segmentos de negocio del día recortados por el rango global
    const segments = [];
    for (const bh of businessHours || []) {
      const daysOfWeek = bh.daysOfWeek || [];
      if (!daysOfWeek.includes(dow)) continue;

      const seg = clampBusinessSegmentToDay(bh, day);
      const segStart = new Date(Math.max(seg.start, start));
      const segEnd = new Date(Math.min(seg.end, end));
      if (segStart < segEnd) segments.push({ start: segStart, end: segEnd });
    }
    // restar ocupados
    let gaps = segments.slice();
    for (const b of busy) {
      gaps = subtractIntervalList(gaps, b);
      if (!gaps.length) break;
    }
    slots.push(...gaps);
  }
  return slots;
}

/** Igual que computeFreeSlots, pero pensado para un solo día de un staff concreto */
export function computeFreeSlotsForStaff(businessHours, busyEvents, rangeStart, rangeEnd) {
  const day = new Date(rangeStart);
  const dow = day.getDay();
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);

  const busy = (busyEvents || []).map((e) => ({
    start: new Date(e.start),
    end: new Date(e.end),
  }));

  const segments = [];
  for (const bh of businessHours || []) {
    const daysOfWeek = bh.daysOfWeek || [];
    if (!daysOfWeek.includes(dow)) continue;

    const seg = clampBusinessSegmentToDay(bh, day);
    const segStart = new Date(Math.max(seg.start, start));
    const segEnd = new Date(Math.min(seg.end, end));
    if (segStart < segEnd) segments.push({ start: segStart, end: segEnd });
  }

  let gaps = segments.slice();
  for (const b of busy) {
    gaps = subtractIntervalList(gaps, b);
    if (!gaps.length) break;
  }
  return gaps;
}

// Helpers
function clampBusinessSegmentToDay(bh, day) {
  const s = hmToDate(day, bh.startTime || "00:00");
  const e = hmToDate(day, bh.endTime || "23:59");
  return { start: s, end: e };
}
function hmToDate(baseDay, hm) {
  const [h, m] = String(hm).split(":").map(Number);
  const d = new Date(baseDay);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}
