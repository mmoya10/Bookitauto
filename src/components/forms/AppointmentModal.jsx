import clsx from "clsx";
import Portal from "../common/Portal";
import Button from "../common/Button";
import AppointmentForm from "./AppointmentForm";

const glassCard = "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function AppointmentModal({
  open,
  title,                // "Nueva cita" | "Editar cita"
  onClose,
  // props que se pasan al form:
  mode,
  event,
  calendars,
  staff,
  businessHours,
  users,
  initialStart,
  initialEnd,
  submitting,
  onSubmit,
  onOpenComplete,
}) {
  if (!open) return null;

  return (
    <Portal onClose={onClose}>
      <div className={clsx(glassCard, "w-[min(96vw,560px)] p-5")}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white/90">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
        </div>

        <AppointmentForm
          mode={mode}
          event={event}
          calendars={calendars}
          staff={staff}
          businessHours={businessHours}
          users={users}
          initialStart={initialStart}
          initialEnd={initialEnd}
          submitting={submitting}
          onSubmit={onSubmit}
          onOpenComplete={onOpenComplete}
        />
      </div>
    </Portal>
  );
}
