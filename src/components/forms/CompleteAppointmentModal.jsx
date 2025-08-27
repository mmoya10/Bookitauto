import clsx from "clsx";
import Portal from "../common/Portal";
import Button from "../common/Button";
import CompleteForm from "./CompleteForm";

const glassCard = "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function CompleteAppointmentModal({
  open,
  onClose,
  event,
  products,
  onSubmit,
  calendars = [],
}) {
  if (!open || !event) return null;

  return (
    <Portal onClose={onClose}>
      <div className={clsx(glassCard, "w-[min(96vw,560px)] p-5")}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Completar cita</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
        </div>

        <CompleteForm 
          event={event}
          products={products}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </Portal>
  );
}
