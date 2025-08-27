import Button from "../common/Button";
import { Link } from "react-router-dom";

/**
 * Acciones sobre el calendario (añadir, alternar modo staff, ir a gestión).
 */
export default function CalendarActions({
  onAdd,                // () => void
  viewType,             // "timeGridDay" | "timeGridWeek" | "dayGridMonth" | "resourceTimeGridDay"
  staffMode,            // boolean
  setStaffMode,         // (bool) => void
  calendarRef,          // ref de FullCalendar para cambiar de vista
}) {
  const canToggleStaff =
    viewType === "timeGridDay" || viewType === "resourceTimeGridDay";

  const toggleStaffMode = () => {
    const api = calendarRef?.current?.getApi?.();
    if (!api) return;
    if (staffMode) {
      setStaffMode(false);
      api.changeView("timeGridDay");
    } else {
      setStaffMode(true);
      api.changeView("resourceTimeGridDay");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <Button variant="primary" onClick={onAdd}>
        + Añadir cita
      </Button>

      {canToggleStaff && (
        <Button variant={staffMode ? "danger" : "ghost"} onClick={toggleStaffMode}>
          {staffMode ? "Salir modo staff" : "Modo staff"}
        </Button>
      )}

      <Link
        to="/calendarios/gestion"
        className="inline-flex items-center px-3 py-2 text-sm border rounded-xl border-white/10 bg-white/10 text-zinc-100 hover:bg-white/15"
        title="Gestión de calendarios"
      >
        Editar calendarios
      </Link>
    </div>
  );
}
