// Construcción de eventos para FullCalendar (colores, títulos, extendedProps)
import { tintHex, shadeHex, rgbaFromHex } from "./colors";

/**
 * Mapea citas de la API a eventos de FullCalendar con estilos y props extra.
 * @param {Array} citas - items crudos de API
 * @param {{[id]:string}} calMap - id calendario -> nombre
 * @param {{[id]:string}} staffNameMap - id staff -> nombre
 * @param {{[id]:string}} staffColorMap - id staff -> color HEX
 * @param {boolean} staffMode - si true, asigna resourceId = staffId
 */
export function mapAppointmentsToEvents(citas, calMap, staffNameMap, staffColorMap, staffMode) {
  const baseGreen = "#10b981";
  const baseRed = "#f43f5e";

  return (citas || []).map((e) => {
    const calName = calMap?.[e.calendarId] || "Cita";
    const client = e.user
      ? `${e.user.firstName || e.user.name || ""} ${e.user.lastName || e.user.surname || ""}`.trim()
      : "";
    const staffName = staffNameMap?.[e.staffId] || "";
    const staffCol = staffColorMap?.[e.staffId] || "#64748b";

    const title = `${calName}${client ? " – " + client : ""}`;

    const colorBase =
      e.status === "completado" ? baseGreen :
      e.status === "no_presentado" ? baseRed :
      staffCol || "#64748b";

    const bgTop = tintHex(colorBase, 0.2);
    const bgBottom = tintHex(colorBase, 0.5);
    const solidBg = `linear-gradient(180deg, ${bgTop}, ${bgBottom})`;
    const solidBorder = shadeHex(colorBase, 0.35);
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
}

/** Mapea ausencias a eventos */
export function mapAbsencesToEvents(ausencias, staffNameMap, staffMode) {
  return (ausencias || []).map((e) => ({
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
}

/** Une eventos (citas + ausencias + festivos) */
export function mergeEvents({ citas = [], ausencias = [], holidays = [] }) {
  return [...citas, ...ausencias, ...holidays];
}
