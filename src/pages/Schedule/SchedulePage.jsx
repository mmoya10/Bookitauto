import api from "../../api/client";
import ScheduleManager from "../../components/common/ScheduleManager";

/* ===== Page ===== */
export default function ProfilePage() {
  return (
    <div className="space-y-6 text-zinc-100">
      <header className="mb-2">
        <h1 className="text-xl font-semibold">Mi horario</h1>
        <p className="text-sm text-slate-300">
          Gestiona tus horario
        </p>
      </header>
      <ScheduleSection />
    </div>
  );
}


function ScheduleSection() {
  return (
    <ScheduleManager
      title="Horario"
      description="Define tus franjas laborables por día. Vista semanal (L → D) y días especiales."
      queryKey={["me-schedule"]}
      fetchSchedule={async () => {
        try {
          const r = await api.get("/me/schedule");
          return r.data; // el manager ya normaliza
        } catch {
          return {}; // el manager aplica defaults
        }
      }}
      saveSchedule={(payload) => api.post("/me/schedule", payload)}
    />
  );
}

