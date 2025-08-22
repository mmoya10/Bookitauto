// src/components/notifications/NotifyBell.jsx
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  markSeen,
  approveNotification,
  rejectNotification,
} from "../../api/notifications";
import Portal from "../common/Portal";
import Button from "../common/Button";
import clsx from "clsx";

const glass =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

const IcBell = (p) => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
    <path
      d="M6 8a6 6 0 1 1 12 0v4.5l1.6 2.8A1 1 0 0 1 18.8 17H5.2a1 1 0 0 1-.9-1.7L6 12.5V8Z"
      fill="currentColor"
    />
    <path d="M9 18a3 3 0 0 0 6 0" fill="currentColor" />
  </svg>
);

export default function NotifyBell() {
  const qc = useQueryClient();

  const { data: list } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30000,
  });

  const pendingCount = useMemo(
    () => (list || []).filter((n) => n.status === "pending").length,
    [list]
  );

  const [open, setOpen] = useState(false);

  // ===== Mutations =====
  const mSeen = useMutation({
    mutationFn: markSeen,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const mApprove = useMutation({
    mutationFn: approveNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const mReject = useMutation({
    mutationFn: rejectNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <>
      {/* Botón flotante fijo (abajo-derecha) */}
      <div
        className={clsx(
          "fixed right-4 bottom-4 z-[1100] grid place-items-center",
          glass,
          "w-[56px] h-[56px]"
        )}
      >
        <button
          type="button"
          title="Notificaciones"
          aria-label="Notificaciones"
          className="relative grid place-items-center rounded-xl border border-white/10 bg-white/10 w-12 h-12 hover:bg-white/20 active:translate-y-px"
          onClick={() => setOpen((v) => !v)}
        >
          <IcBell className="text-zinc-100" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full px-1.5 text-xs grid place-items-center font-semibold text-[#0b1020] bg-[linear-gradient(90deg,#7c3aed,#22d3ee)]">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Panel */}
      {open && (
        <Portal>
          <div className="fixed inset-0 z-[1099]" onClick={() => setOpen(false)}>
            <div
              className={clsx(
                "fixed right-4 bottom-20 w-[min(92vw,420px)] max-h-[70vh] overflow-auto p-3",
                glass
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Notificaciones</div>
                <button
                  className="text-xs rounded-lg border border-white/10 bg-white/10 px-2 py-1 hover:bg-white/20"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </button>
              </div>

              {!list?.length && (
                <div className="text-sm text-slate-300">
                  No hay notificaciones.
                </div>
              )}

              <div className="grid gap-2">
                {(list ?? []).map((n) => (
                  <NotifItem
                    key={n.id}
                    n={n}
                    onSeen={() => !n.seen && mSeen.mutate(n.id)}
                    onApprove={() => mApprove.mutate(n.id)}
                    onReject={() => mReject.mutate(n.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

function NotifItem({ n, onSeen, onApprove, onReject }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) onSeen?.();
    // eslint-disable-next-line
  }, [open]);

  const color =
    n.status === "approved"
      ? "border-emerald-400/40 bg-emerald-500/15"
      : n.status === "rejected"
      ? "border-rose-400/40 bg-rose-500/15"
      : "border-white/10 bg-white/5";

  return (
    <div className={clsx("rounded-xl border p-3", color)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]",
                n.type === "vacation"
                  ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                  : "border-violet-400/40 bg-violet-500/20 text-violet-100"
              )}
            >
              {n.type === "vacation" ? "Ausencia/Vacaciones" : "Cambio horario"}
            </span>
            <span className="text-[11px] text-slate-400">
              {new Date(n.createdAt).toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
          <div className="mt-1 text-sm font-semibold truncate">{n.title}</div>
          <div className="text-xs text-slate-300 truncate">{n.message}</div>
        </div>

        <div className="shrink-0">
          {n.status === "pending" ? (
            <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-100">
              Pendiente
            </span>
          ) : n.status === "approved" ? (
            <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-100">
              Validada
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/20 px-2 py-0.5 text-[11px] text-rose-100">
              Rechazada
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-2 flex items-center gap-2">
        <button
          className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Ocultar" : "Ver"}
        </button>
        {n.status === "pending" && (
          <>
            <Button variant="primary" size="sm" onClick={onApprove}>
              Validar
            </Button>
            <Button variant="danger" size="sm" onClick={onReject}>
              Rechazar
            </Button>
          </>
        )}
      </div>

      {/* Detalle */}
      {open && (
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
          {n.type === "vacation" ? (
            <div className="space-y-1">
              <Row k="Trabajador" v={n.payload.employee} />
              <Row k="Desde" v={n.payload.from} />
              <Row k="Hasta" v={n.payload.to} />
              {"hours" in n.payload && (
                <Row k="Horas" v={`${n.payload.hours} h`} />
              )}
              {"days" in n.payload && (
                <Row k="Días" v={`${n.payload.days} días`} />
              )}
              <Row k="Motivo" v={n.payload.reason} />
            </div>
          ) : (
            <div className="space-y-1">
              <Row k="Trabajador" v={n.payload.employee} />
              <Row k="Día" v={n.payload.day} />
              {n.payload.add?.length > 0 && (
                <Row
                  k="Añadir"
                  v={n.payload.add
                    .map((s) => `${s.start}–${s.end}`)
                    .join(", ")}
                />
              )}
              {n.payload.remove?.length > 0 && (
                <Row
                  k="Quitar"
                  v={n.payload.remove
                    .map((s) => `${s.start}–${s.end}`)
                    .join(", ")}
                />
              )}
              {n.payload.note && <Row k="Nota" v={n.payload.note} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-2">
      <div className="w-28 text-slate-400">{k}</div>
      <div className="flex-1 font-medium text-zinc-100">{v}</div>
    </div>
  );
}
