import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMinutes } from "date-fns";
import { fetchAppointments } from "../../api/calendars";
import { createUser } from "../../api/users";
import { useRef } from "react";
import { toLocalDate, toLocalInput, formatSlotLabel } from "../../utils/date";
import { computeFreeSlotsForStaff } from "../../utils/slots";

import Button from "../common/Button";
import { Input } from "../common/Input";
import Select from "../common/Select";
import MultiSelect from "../common/MultiSelect";
import { CopyPlus } from 'lucide-react';


export default function AppointmentForm({
  mode, // "create" | "edit"
  event,
  calendars = [],
  staff = [],
  businessHours = [],
  users = [],
  initialStart,
  initialEnd,
  submitting = false,
  onSubmit,
  onOpenComplete, // callback para abrir panel de completar (solo edit)
}) {
  const isEdit = mode === "edit";
  const [calendarId, setCalendarId] = useState(
    event?.extendedProps?.calendarId || calendars[0]?.id || ""
  );

  const selectedCal = useMemo(
    () => calendars.find((c) => c.id === calendarId),
    [calendars, calendarId]
  );
  // ===== Usuario =====
  const qc = useQueryClient();
  const [userId, setUserId] = useState(
    event?.extendedProps?.user?.id || (users[0]?.id ?? "")
  );
  const [creatingUser, setCreatingUser] = useState(false);
  const [nu, setNu] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const createUserMut = useMutation({
    mutationFn: createUser,
    onSuccess: async (newUser) => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      setUserId(newUser?.id);
      setCreatingUser(false);
    },
  });

  // ===== Calendario / Extras =====
  // ===== Opción del calendario (si aplica) =====
  const [optionId, setOptionId] = useState(
    event?.extendedProps?.optionId || null
  );

  // opciones disponibles del calendario elegido
  const optionOpts = useMemo(() => {
    const opts = Array.isArray(selectedCal?.options) ? selectedCal.options : [];
    return opts.map((o) => ({
      value: o.id,
      label: o.name,
      price: o.price ?? 0,
      duration: o.duration ?? 0,
      description: o.description || "",
      imageUrl: o.imageUrl || "",
    }));
  }, [selectedCal]);

  // cuando cambia el calendario, limpiar opción y extras
  const prevCalendarIdRef = useRef(calendarId);
  useEffect(() => {
    if (prevCalendarIdRef.current !== calendarId) {
      setOptionId(null);
      setExtraIds([]);
    }
    prevCalendarIdRef.current = calendarId;
  }, [calendarId]);

  const [extraIds, setExtraIds] = useState(
    event?.extendedProps?.extraIds || []
  );
  const extrasOpts = useMemo(() => {
    const ids = selectedCal?.extrasSupported || [];
    return calendars
      .filter((c) => ids.includes(c.id))
      .map((e) => ({
        id: e.id,
        label: e.name,
        duration: e.duration,
        price: e.price,
      }));
  }, [selectedCal, calendars]);

  // ===== Personal =====
  const [staffId, setStaffId] = useState(
    event?.extendedProps?.staffId || staff[0]?.id || ""
  );

  // ===== Fechas / Slots =====
  const baseStart = event?.start || initialStart || new Date();
  const baseEnd =
    event?.end || initialEnd || new Date(baseStart.getTime() + 45 * 60000);

  const [dateOnly, setDateOnly] = useState(toLocalDate(baseStart));
  const [start, setStart] = useState(toLocalInput(baseStart)); // se setea desde slot
  const [end, setEnd] = useState(toLocalInput(baseEnd)); // se setea desde slot

  const totalDuration = useMemo(() => {
    const main = Number(selectedCal?.duration || 30);
    const optDur = optionOpts.find((o) => o.value === optionId)?.duration || 0;
    const exDur = extrasOpts
      .filter((x) => extraIds.includes(x.id))
      .reduce((a, x) => a + Number(x.duration || 0), 0);
    return main + optDur + exDur; // minutos
  }, [selectedCal, optionOpts, optionId, extrasOpts, extraIds]);

  const [slots, setSlots] = useState([]);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(-1);

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!dateOnly || !staffId || !totalDuration || !businessHours?.length) {
        setSlots([]);
        setSelectedSlotIdx(-1);
        return;
      }
      const dayStart = new Date(dateOnly + "T00:00:00");
      const dayEnd = new Date(dateOnly + "T23:59:59");

      const res = await fetchAppointments({
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
        staffIds: [staffId],
        type: "ambos",
      });

      const busy = res.map((e) => ({
        start: new Date(e.start),
        end: new Date(e.end),
      }));
      const gaps = computeFreeSlotsForStaff(
        businessHours,
        busy,
        dayStart,
        dayEnd
      );

      const out = [];
      for (const g of gaps) {
        for (
          let t = new Date(g.start);
          t <= new Date(g.end.getTime() - totalDuration * 60000);
          t = addMinutes(t, 15)
        ) {
          const s = t;
          const e = new Date(t.getTime() + totalDuration * 60000);
          if (e <= g.end) out.push({ start: s, end: e });
        }
      }
      if (cancel) return;
      setSlots(out);

      if (event?.start && event?.end) {
        const msStart = new Date(event.start).getTime();
        const idx = out.findIndex((x) => x.start.getTime() === msStart);
        setSelectedSlotIdx(idx >= 0 ? idx : -1);
      } else {
        setSelectedSlotIdx(-1);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [
    dateOnly,
    staffId,
    totalDuration,
    businessHours,
    event?.start,
    event?.end,
  ]);

  // ===== Precio y pago =====
  const totalPrice = useMemo(() => {
    const main = Number(selectedCal?.price || 0);
    const opt = optionOpts.find((o) => o.value === optionId)?.price || 0;
    const ex = extrasOpts
      .filter((x) => extraIds.includes(x.id))
      .reduce((a, x) => a + Number(x.price || 0), 0);
    return +(main + opt + ex).toFixed(2);
  }, [selectedCal, optionOpts, optionId, extrasOpts, extraIds]);

  const [payment] = useState("tienda");
  const [tiendapago] = useState(event?.extendedProps?.tiendapago || "efectivo");
  const [notes, setNotes] = useState(event?.extendedProps?.notes || "");

  // ===== Opciones del Select de Hora (incluye "Hora actual" en edición) =====
  const slotOptions = useMemo(() => {
    const baseOptions = slots.length
      ? slots.map((s, i) => ({
          value: String(i),
          label: formatSlotLabel(s.start, s.end),
        }))
      : [{ value: "-1", label: "Sin huecos" }];

    if (isEdit) {
      const currentLabel = formatSlotLabel(new Date(start), new Date(end));
      return [
        { value: "current", label: `Hora actual: ${currentLabel}` },
        ...baseOptions,
      ];
    }
    return baseOptions;
  }, [slots, isEdit, start, end]);

  const slotValue =
    isEdit && selectedSlotIdx === -1 ? "current" : String(selectedSlotIdx);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const selUser = (users ?? []).find((u) => u.id === userId) || null;
        // Si el calendario tiene opciones, obligar a elegir una
        if (
          Array.isArray(selectedCal?.options) &&
          selectedCal.options.length > 0 &&
          !optionId
        ) {
          alert("Este servicio requiere elegir una opción.");
          return;
        }

        onSubmit?.({
          id: event?.id,
          calendarId,
          staffId,
          optionId,
          extraIds,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          type: "cita",
          user: selUser
            ? {
                id: selUser.id,
                firstName: selUser.firstName || selUser.name,
                lastName: selUser.lastName || selUser.surname,
                email: selUser.email,
                phone: selUser.phone,
              }
            : null,
          totalPrice,
          payment,
          tiendapago,
          propina: Number(event?.extendedProps?.propina ?? 0),
          notes,
        });
      }}
      className="grid gap-3"
    >
      {/* Usuario */}
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Usuario</span>
        {!creatingUser ? (
          <div className="flex gap-2">
            <Select
              value={userId}
              onChange={(val) => setUserId(val)}
              options={(users ?? []).map((u) => ({
                value: u.id,
                label: `${u.firstName || u.name} ${u.lastName || u.surname} · ${
                  u.phone || ""
                }`.trim(),
              }))}
              searchable
              searchPlaceholder="Buscar cliente…"
              className="flex-1"
            />
            <Button variant="ghost" type="button" onClick={() => setCreatingUser(true)}>
              <CopyPlus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nombre"
                value={nu.firstName}
                onChange={(e) => setNu({ ...nu, firstName: e.target.value })}
              />
              <Input
                placeholder="Apellidos"
                value={nu.lastName}
                onChange={(e) => setNu({ ...nu, lastName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Email"
                value={nu.email}
                onChange={(e) => setNu({ ...nu, email: e.target.value })}
              />
              <Input
                placeholder="Teléfono"
                value={nu.phone}
                onChange={(e) => setNu({ ...nu, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={async () => {
                  const created = await createUserMut
                    .mutateAsync(nu)
                    .catch(() => null);
                  if (!created) alert("No se pudo crear el usuario.");
                }}
              >
                Crear
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setCreatingUser(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Calendario / Personal */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Calendario</span>
          <Select
            options={(calendars ?? []).map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={calendarId}
            onChange={(val) => {
              setCalendarId(val);
              setExtraIds([]);
            }}
            searchable
            searchPlaceholder="Buscar calendario"
            className="flex-1"
          />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Personal</span>
          <Select
            options={(staff ?? []).map((s) => ({ value: s.id, label: s.name }))}
            value={staffId}
            onChange={(val) => setStaffId(val)}
            searchable
            searchPlaceholder="Buscar personal"
            className="flex-1"
          />
        </div>
      </div>
      {optionOpts.length > 0 && (
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Opción</span>
          <Select
            options={optionOpts.map((o) => ({
              value: o.value,
              // etiqueta rica: nombre · +dur · +€
              label: `${o.label} ${o.duration ? `· +${o.duration} min` : ""} ${
                o.price ? `· +${Number(o.price).toFixed(2)} €` : ""
              }`.trim(),
            }))}
            value={optionId || ""}
            onChange={(val) => setOptionId(val)}
            placeholder="Selecciona una opción"
            className="flex-1"
          />
          {/* Preview de la opción elegida */}
          {optionId &&
            (() => {
              const sel = optionOpts.find((o) => o.value === optionId);
              if (!sel) return null;
              return (
                <div className="mt-2 flex gap-3 items-start p-2 rounded-xl border border-white/10 bg-white/5">
                  <img
                    src={
                      sel.imageUrl || "https://placehold.co/120x90?text=Opción"
                    }
                    alt=""
                    className="w-24 h-20 object-cover rounded-lg border border-white/10"
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-white font-semibold">{sel.label}</div>
                    <div className="text-xs text-slate-300">
                      {sel.description || "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      {sel.duration ? `+${sel.duration} min` : ""}
                      {sel.price
                        ? `${sel.duration ? " · " : ""}+${Number(
                            sel.price
                          ).toFixed(2)} €`
                        : ""}
                    </div>
                  </div>
                </div>
              );
            })()}
          <div className="text-[11px] text-slate-400">
            {optionId
              ? "Has seleccionado una opción."
              : "Este servicio requiere una opción."}
          </div>
        </div>
      )}
      {/* Extras */}
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Extras</span>
        <MultiSelect
          items={extrasOpts.map((x) => ({
            id: x.id,
            label: `${x.label || x.name || x.id}`,
          }))}
          values={extraIds}
          onChange={setExtraIds}
          placeholder={
            extrasOpts.length ? "Selecciona extras" : "No hay extras"
          }
          disabled={!extrasOpts.length}
          showSelectAll
          selectAllLabel="Todos"
        />
        <div className="text-[11px] text-slate-400">
          Duración total: {totalDuration} min
        </div>
      </div>
      {/* Opción (si el calendario tiene) */}

      {/* Fecha / Hora */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Fecha</span>
          <Input
            type="date"
            value={dateOnly}
            onChange={(e) => setDateOnly(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Hora</span>
          <Select
            options={slotOptions}
            value={slotValue}
            onChange={(val) => {
              if (val === "current") {
                setSelectedSlotIdx(-1);
                return;
              }
              const i = Number(val);
              setSelectedSlotIdx(i);
              const s = slots[i];
              if (s) {
                setStart(toLocalInput(s.start));
                setEnd(toLocalInput(s.end));
              }
            }}
            disabled={!slots.length && !isEdit}
          />
        </div>
      </div>

      {/* Precio y pago */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Precio total</span>
          <Input value={totalPrice} readOnly />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Pago</span>
          <Input value="tienda" readOnly />
        </div>
      </div>

      {/* Notas */}
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Notas</span>
        <Input
          as="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones…"
        />
      </div>

      <div className="flex items-center gap-2 mt-1">
        <Button variant="primary" disabled={submitting} type="submit">
          {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Aceptar"}
        </Button>
      </div>
    </form>
  );
}
