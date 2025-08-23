// src/pages/Booking/BookingSitePublic.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import MultiSelect from "../../components/common/MultiSelect";
import { fetchBusiness, fetchBranches } from "../../api/business";
import {
  fetchCategories,
  fetchCalendars,
  fetchStaff,
  fetchBookingSites,
} from "../../api/calendarManagement";

const glass =
  "rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

const slug = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* ──────────────────────────────────────────────────────────────
   Wizard Booking (4 pasos con barra de progreso + footer sticky)
   Pasos:
   1) Servicio principal + extras
   2) Profesional
   3) Día y hora
   4) Datos cliente + Confirmación
   ────────────────────────────────────────────────────────────── */

export default function BookingSitePublic() {
  const { bizSlug, branchSlug, siteSlug } = useParams();

  // Datos base
  const { data: business } = useQuery({ queryKey: ["biz"], queryFn: fetchBusiness });
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
    enabled: !!business,
  });
  const { data: sites = [] } = useQuery({ queryKey: ["bsites"], queryFn: fetchBookingSites });
  const { data: categories = [] } = useQuery({ queryKey: ["cats"], queryFn: fetchCategories });
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });

  // Resolver context por slug
  const currentSite = useMemo(
    () => sites.find((s) => slug(s.name) === siteSlug),
    [sites, siteSlug]
  );
  const currentBranch = useMemo(
    () => (branches ?? []).find((b) => slug(b.nombre) === branchSlug),
    [branches, branchSlug]
  );
  const okContext = !!(business && currentSite && (!business.branchMode || currentBranch));

  // Calendars visibles por booking site
  const { data: allCals = [] } = useQuery({
    queryKey: ["pub-cals", currentSite?.id],
    queryFn: () => fetchCalendars({ calendarIds: currentSite?.calendarIds ?? [] }),
    enabled: !!currentSite?.id,
  });
  const mainCalendars = allCals.filter((c) => c.type === "main");
  const extraCalendars = allCals.filter((c) => c.type === "extra");

  // ─── Estado del Wizard ───────────────────────────────────────
  const [step, setStep] = useState(1); // 1..4
  const stepsMeta = [
    { id: 1, label: "Servicio" },
    { id: 2, label: "Profesional" },
    { id: 3, label: "Fecha y hora" },
    { id: 4, label: "Tus datos" },
  ];

  // Paso 1: servicio principal + extras
  const [mainId, setMainId] = useState("");
  const selectedMain = mainCalendars.find((c) => c.id === mainId) || null;

  const supportedExtras = useMemo(() => {
    if (!selectedMain) return [];
    const ids = selectedMain.extrasSupported || [];
    return extraCalendars.filter((e) => ids.includes(e.id));
  }, [selectedMain, extraCalendars]);

  const [extraIds, setExtraIds] = useState([]);

  // Totales (precio/duración)
  const { totalPrice, totalDuration } = useMemo(() => {
    let price = Number(selectedMain?.price || 0);
    let dur = Number(selectedMain?.duration || 0);
    for (const id of extraIds) {
      const ex = extraCalendars.find((e) => e.id === id);
      if (!ex) continue;
      if (ex.price != null) price += Number(ex.price || 0);
      if (ex.duration != null) dur += Number(ex.duration || 0);
    }
    return { totalPrice: price, totalDuration: dur };
  }, [selectedMain, extraIds, extraCalendars]);

  // Paso 2: profesional
  const staffOptions = useMemo(() => {
    if (!selectedMain) return [];
    const ids = selectedMain.staffIds || [];
    return staff.filter((s) => ids.includes(s.id));
  }, [selectedMain, staff]);
  const [staffChoice, setStaffChoice] = useState("random"); // "random" | staffId

  // Paso 3: fecha y hora (disponibilidad fake)
  const [monthBase, setMonthBase] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null); // Date
  const [selectedSlot, setSelectedSlot] = useState("");

  function daysOfMonth(baseDate) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const res = [];
    while (d.getMonth() === baseDate.getMonth()) {
      res.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return res;
  }
  const monthlyDays = daysOfMonth(monthBase);

  // Disponibilidad demo: L-S 10:00–18:00 cada 30'
  function generateSlots(date) {
    if (!selectedMain) return [];
    const weekday = date.getDay(); // 0 D
    if (weekday === 0) return [];
    const slots = [];
    for (let h = 10; h < 18; h++) {
      for (const m of [0, 30]) {
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return slots;
  }
  const availableSlots = useMemo(() => {
    if (!selectedDay) return [];
    return generateSlots(selectedDay);
  }, [selectedDay]); // eslint-disable-line

  // Paso 4: datos cliente
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    acepta: true,
  });

  // Validaciones por paso
  const stepValid = useMemo(() => {
    if (step === 1) return !!selectedMain; // servicio principal elegido
    if (step === 2) return !!(staffChoice === "random" || staffOptions.find((s) => s.id === staffChoice));
    if (step === 3) return !!(selectedDay && selectedSlot);
    if (step === 4) {
      const okName = form.nombre.trim() && form.apellidos.trim();
      const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      const okPhone = (form.telefono || "").trim().length >= 6;
      return okName && okEmail && okPhone && form.acepta;
    }
    return false;
  }, [step, selectedMain, staffChoice, staffOptions, selectedDay, selectedSlot, form]);

  function goNext() {
    if (!stepValid) return;
    setStep((s) => Math.min(4, s + 1));
  }
  function goPrev() {
    setStep((s) => Math.max(1, s - 1));
  }

  // Confirmar (solo demo)
  function reservar() {
    if (!stepValid) return;
    const resumen = {
      negocio: business?.nombre,
      sucursal: business?.branchMode ? currentBranch?.nombre : "(única)",
      site: currentSite?.name,
      servicio: selectedMain?.name,
      extras:
        extraIds.map((id) => extraCalendars.find((e) => e.id === id)?.name).filter(Boolean) || [],
      profesional:
        staffChoice === "random"
          ? "Aleatorio"
          : staff.find((s) => s.id === staffChoice)?.name || "",
      fecha: selectedDay?.toLocaleDateString(),
      hora: selectedSlot,
      total: `${totalPrice.toFixed(2)} €`,
      duracion: `${totalDuration} min`,
      cliente: `${form.nombre} ${form.apellidos} - ${form.email} - ${form.telefono}`,
    };
    console.log("RESERVA DEMO", resumen);
    alert("Reserva creada (demo). Mira la consola para ver el detalle.");
  }

  // Context fail
  if (!okContext) {
    return (
      <div className="p-4 text-zinc-100">
        <div className={clsx(glass, "p-4")}>
          <div className="text-sm">No se pudo cargar el booking solicitado.</div>
          <Link className="underline text-cyan-200" to="/">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  // ─── UI ──────────────────────────────────────────────────────
  return (
    <div className="relative p-4 space-y-5 pb-28 text-zinc-100">
      {/* Encabezado */}
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">
          {business?.nombre}
          {business?.branchMode && currentBranch ? ` — ${currentBranch.nombre}` : ""}
        </h1>
        <div className="text-sm text-slate-300">{currentSite?.name}</div>
      </header>

      {/* Barra de progreso */}
      <section className={clsx(glass, "p-3")}>
        <div className="grid grid-cols-4 gap-2">
          {stepsMeta.map((s) => {
            const active = s.id === step;
            const done = s.id < step;
            return (
              <div
                key={s.id}
                className={clsx(
                  "flex items-center justify-center rounded-xl px-3 py-2 text-sm border",
                  active
                    ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                    : done
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-300"
                )}
              >
                {s.id}. {s.label}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contenido del paso */}
      {step === 1 && (
        <Step1Servicio
          categories={categories}
          mainCalendars={mainCalendars}
          selectedMain={selectedMain}
          setMainId={setMainId}
          supportedExtras={supportedExtras}
          extraIds={extraIds}
          setExtraIds={setExtraIds}
          totalPrice={totalPrice}
          totalDuration={totalDuration}
        />
      )}
      {step === 2 && (
        <Step2Profesional
          staffOptions={staffOptions}
          staffChoice={staffChoice}
          setStaffChoice={setStaffChoice}
        />
      )}
      {step === 3 && (
        <Step3FechaHora
          monthBase={monthBase}
          setMonthBase={setMonthBase}
          monthlyDays={monthlyDays}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          availableSlots={availableSlots}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          selectedMain={selectedMain}
        />
      )}
      {step === 4 && (
        <Step4Datos
          form={form}
          setForm={setForm}
          selectedMain={selectedMain}
          extraIds={extraIds}
          extraCalendars={extraCalendars}
          totalPrice={totalPrice}
          totalDuration={totalDuration}
          selectedDay={selectedDay}
          selectedSlot={selectedSlot}
          staffChoice={staffChoice}
          staff={staff}
        />
      )}

      {/* Footer fijo de navegación + resumen corto */}
      <footer className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-6xl p-3 mx-auto">
          <div
            className={clsx(
              glass,
              "p-3 flex flex-col sm:flex-row items-center gap-3 sm:justify-between"
            )}
          >
            <div className="text-xs text-slate-300">
              {selectedMain ? (
                <>
                  <span className="font-medium text-zinc-100">{selectedMain.name}</span>{" "}
                  · {totalDuration} min · {totalPrice.toFixed(2)} €
                </>
              ) : (
                "Selecciona un servicio para empezar"
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={goPrev} disabled={step === 1}>
                ← Anterior
              </Button>
              {step < 4 ? (
                <Button variant="primary" onClick={goNext} disabled={!stepValid}>
                  Siguiente →
                </Button>
              ) : (
                <Button variant="primary" onClick={reservar} disabled={!stepValid}>
                  Confirmar reserva
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Subcomponentes de cada paso
   ────────────────────────────────────────────────────────────── */

function Step1Servicio({
  categories,
  mainCalendars,
  selectedMain,
  setMainId,
  supportedExtras,
  extraIds,
  setExtraIds,
  totalPrice,
  totalDuration,
}) {
  return (
    <section className={clsx(glass, "p-4")}>
      <h2 className="mb-3 text-base font-semibold">1) Elige servicio</h2>

      {/* Servicios por categoría */}
      <div className="grid gap-4">
        {categories.map((cat) => {
          const cals = mainCalendars.filter((c) => c.categoryId === cat.id);
          if (!cals.length) return null;
          return (
            <div key={cat.id} className="space-y-2">
              <div className="text-sm font-semibold">{cat.label}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cals.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setMainId(c.id);
                      setExtraIds([]);
                    }}
                    className={clsx(
                      "text-left overflow-hidden border rounded-2xl",
                      "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <img
                      src={c.imageUrl || "https://placehold.co/640x360?text=Servicio"}
                      alt=""
                      className="object-cover w-full border-b h-36 border-white/10"
                    />
                    <div className="p-3 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold">{c.name}</div>
                        <div className="text-sm shrink-0">{Number(c.price || 0).toFixed(2)} €</div>
                      </div>
                      <div className="text-xs text-slate-300">{c.description}</div>
                      <div className="text-xs">
                        Duración: <b>{c.duration} min</b>
                      </div>
                      {selectedMain?.id === c.id && (
                        <div className="mt-2 text-xs text-emerald-200">Seleccionado ✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Extras del servicio seleccionado */}
      {selectedMain && (
        <div className="p-3 mt-4 border rounded-xl border-white/10 bg-white/5">
          <div className="text-sm font-semibold">Extras (opcionales)</div>
          <div className="mt-2">
            {!!supportedExtras.length ? (
              <MultiSelect
                items={supportedExtras.map((e) => ({
                  id: e.id,
                  label: `${e.name}${
                    e.price != null ? ` (+${e.price.toFixed(2)} €)` : ""
                  }${e.duration != null ? ` / ${e.duration}min` : ""}`,
                }))}
                values={extraIds}
                onChange={setExtraIds}
              />
            ) : (
              <div className="text-sm text-slate-300">Este servicio no tiene extras.</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Stat label="Total" value={`${totalPrice.toFixed(2)} €`} />
            <Stat label="Duración" value={`${totalDuration} min`} />
          </div>
        </div>
      )}
    </section>
  );
}

function Step2Profesional({ staffOptions, staffChoice, setStaffChoice }) {
  return (
    <section className={clsx(glass, "p-4")}>
      <h2 className="mb-3 text-base font-semibold">2) Elige profesional</h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStaffChoice("random")}
          className={clsx(
            "px-3 py-2 rounded-xl border",
            staffChoice === "random"
              ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
              : "border-white/10 bg-white/10"
          )}
        >
          Aleatorio
        </button>
        {staffOptions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStaffChoice(s.id)}
            className={clsx(
              "px-3 py-2 rounded-xl border",
              staffChoice === s.id
                ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                : "border-white/10 bg-white/10"
            )}
            title={s.name}
          >
            {s.name}
          </button>
        ))}
      </div>
    </section>
  );
}

function Step3FechaHora({
  monthBase,
  setMonthBase,
  monthlyDays,
  selectedDay,
  setSelectedDay,
  availableSlots,
  selectedSlot,
  setSelectedSlot,
  selectedMain,
}) {
  return (
    <section className={clsx(glass, "p-4")}>
      <h2 className="mb-3 text-base font-semibold">3) Elige día y hora</h2>

      <div className="grid gap-3 md:grid-cols-[1fr_280px]">
        {/* Calendario mensual simple */}
        <div className="p-3 border rounded-xl border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              onClick={() =>
                setMonthBase((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
            >
              ←
            </Button>
            <div className="text-sm font-semibold">
              {monthBase.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                setMonthBase((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
            >
              →
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1 text-xs text-center text-slate-300">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthlyDays.map((d) => {
              const isSun = d.getDay() === 0;
              const selectable = !isSun;
              const isSelected = selectedDay && d.toDateString() === selectedDay.toDateString();
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={!selectable || !selectedMain}
                  onClick={() => setSelectedDay(d)}
                  className={clsx(
                    "h-9 rounded-lg border text-sm",
                    selectable
                      ? "border-white/10 bg-white/10 hover:bg-white/15"
                      : "border-white/5 bg-white/5 opacity-40 cursor-not-allowed",
                    isSelected && "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots del día */}
        <div className="p-3 border rounded-xl border-white/10 bg-white/5">
          <div className="mb-2 text-xs text-slate-300">Horas disponibles</div>
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.length ? (
              availableSlots.map((hh) => (
                <button
                  key={hh}
                  type="button"
                  onClick={() => setSelectedSlot(hh)}
                  className={clsx(
                    "px-2 py-1 rounded-md border text-sm",
                    selectedSlot === hh
                      ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                      : "border-white/10 bg-white/10 hover:bg-white/15"
                  )}
                >
                  {hh}
                </button>
              ))
            ) : (
              <div className="col-span-3 text-sm text-slate-300">
                {selectedDay ? "Sin franjas para este día." : "Selecciona un día."}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Step4Datos({
  form,
  setForm,
  selectedMain,
  extraIds,
  extraCalendars,
  totalPrice,
  totalDuration,
  selectedDay,
  selectedSlot,
  staffChoice,
  staff,
}) {
  const extrasNames =
    extraIds.map((id) => extraCalendars.find((e) => e.id === id)?.name).filter(Boolean) || [];
  const staffName = staffChoice === "random" ? "Aleatorio" : staff.find((s) => s.id === staffChoice)?.name;

  return (
    <section className={clsx(glass, "p-4")}>
      <h2 className="mb-3 text-base font-semibold">4) Tus datos</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre">
          <Input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </Field>
        <Field label="Apellidos">
          <Input
            value={form.apellidos}
            onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
        <Field label="Teléfono">
          <Input
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          />
        </Field>
      </div>

      <label className="inline-flex items-center gap-2 mt-2 text-sm">
        <input
          type="checkbox"
          className="rounded size-4 border-white/20 bg-white/10"
          checked={form.acepta}
          onChange={(e) => setForm((f) => ({ ...f, acepta: e.target.checked }))}
        />
        Acepto recibir confirmación y recordatorios
      </label>

      <div className="grid gap-2 mt-4 sm:grid-cols-2">
        <Stat label="Servicio" value={selectedMain?.name || "—"} />
        <Stat label="Profesional" value={staffName || "—"} />
        <Stat label="Fecha" value={selectedDay ? selectedDay.toLocaleDateString() : "—"} />
        <Stat label="Hora" value={selectedSlot || "—"} />
        <Stat label="Extras" value={extrasNames.length ? extrasNames.join(", ") : "Ninguno"} />
        <Stat label="Duración total" value={`${totalDuration} min`} />
        <Stat label="Total" value={`${totalPrice.toFixed(2)} €`} />
      </div>
    </section>
  );
}

/* Utilidades de presentación */
function Stat({ label, value }) {
  return (
    <div className="p-3 border rounded-xl border-white/10 bg-white/5">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs text-slate-300">{label}</span>
      {children}
    </label>
  );
}
