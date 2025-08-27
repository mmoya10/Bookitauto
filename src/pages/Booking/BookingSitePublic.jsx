// src/pages/Booking/BookingSitePublic.jsx
import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { fetchBusiness, fetchBranches } from "../../api/business";
import {
  fetchCalendars,
  fetchCategories,
  fetchStaff,
} from "../../api/calendars";

const glass =
  "rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]";
const cardGlass =
  "border border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl transition";

const slug = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function BookingSitePublic() {
  // ya no usamos siteSlug
  const { branchSlug } = useParams();

  // Confirmación
  const [confirm, setConfirm] = useState(null); // { name, dateText, timeText, mapsQuery }
  const fmtDateLong = (d) => {
    try {
      return d.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch {
      return d?.toLocaleDateString?.() || "";
    }
  };

  // Datos base
  const { data: business } = useQuery({
    queryKey: ["biz"],
    queryFn: fetchBusiness,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
    enabled: !!business,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["cats"],
    queryFn: fetchCategories,
  });
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: fetchStaff,
  });

  // Resolver sucursal por slug (si branchMode)
  const currentBranch = useMemo(
    () => branches.find((b) => slug(b.nombre) === branchSlug),
    [branches, branchSlug]
  );
  const okContext = !!(business && (!business.branchMode || currentBranch));

  // Calendarios activos (sin booking sites)
  const { data: allCals = [] } = useQuery({
    queryKey: ["pub-cals-all"],
    queryFn: () => fetchCalendars({}), // trae todos y filtramos aquí
  });

  const activeCals = useMemo(
    () => allCals.filter((c) => c.status === "active"),
    [allCals]
  );
  const mainCalendars = activeCals.filter((c) => c.type === "main");
  const extraCalendars = activeCals.filter((c) => c.type === "extra");

  // Wizard
  const [step, setStep] = useState(1); // 1..4

  // Paso 1: principal + extras
  const [mainId, setMainId] = useState("");
  const selectedMain = mainCalendars.find((c) => c.id === mainId) || null;
  const [extraIds, setExtraIds] = useState([]);
  const [extrasModal, setExtrasModal] = useState(null); // { main, chosen:Set<string> } | null
  // Opción seleccionada (si el calendario tiene options)
  const [optionId, setOptionId] = useState(null);
  // Modal de opciones: { main } | null
  const [optionModal, setOptionModal] = useState(null);

  // Helper para obtener la opción seleccionada (cuando ya hay main elegido)
  const selectedOption = useMemo(() => {
    if (!selectedMain || !Array.isArray(selectedMain.options)) return null;
    return selectedMain.options.find((o) => o.id === optionId) || null;
  }, [selectedMain, optionId]);

  const supportedExtras = useMemo(() => {
    const base = extrasModal?.main || selectedMain;
    if (!base) return [];
    const ids = base.extrasSupported || [];
    return extraCalendars.filter((e) => ids.includes(e.id));
  }, [extrasModal, selectedMain, extraCalendars]);

  // Totales
  const { totalPrice, totalDuration } = useMemo(() => {
    let price = Number(selectedMain?.price || 0);
    let dur = Number(selectedMain?.duration || 0);

    // opción (si hay)
    if (selectedOption) {
      if (selectedOption.price != null)
        price += Number(selectedOption.price || 0);
      if (selectedOption.duration != null)
        dur += Number(selectedOption.duration || 0);
    }

    // extras
    for (const id of extraIds) {
      const ex = extraCalendars.find((e) => e.id === id);
      if (!ex) continue;
      if (ex.price != null) price += Number(ex.price || 0);
      if (ex.duration != null) dur += Number(ex.duration || 0);
    }
    return { totalPrice: price, totalDuration: dur };
  }, [selectedMain, selectedOption, extraIds, extraCalendars]);

  // Paso 2: profesional
  const staffOptions = useMemo(() => {
    if (!selectedMain) return [];
    const ids = selectedMain.staffIds || [];
    return staff.filter((s) => ids.includes(s.id));
  }, [selectedMain, staff]);
  const [staffChoice, setStaffChoice] = useState("random"); // "random" | staffId

  // Paso 3: fecha y hora (demo)
  const [monthBase, setMonthBase] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");

  const daysOfMonth = (base) => {
    const d = new Date(base.getFullYear(), base.getMonth(), 1);
    const res = [];
    while (d.getMonth() === base.getMonth()) {
      res.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return res;
  };

  const generateSlots = (date) => {
    if (!selectedMain) return [];
    const weekday = date.getDay(); // 0 D
    if (weekday === 0) return [];
    const slots = [];
    for (let h = 10; h < 18; h++)
      for (const m of [0, 30])
        slots.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
    return slots;
  };
  const availableSlots = useMemo(
    () => (selectedDay ? generateSlots(selectedDay) : []),
    [selectedDay] // eslint-disable-line
  );

  // Paso 4: datos
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    acepta: true,
  });

  // Validaciones
  const stepValid = useMemo(() => {
    if (step === 1) return !!selectedMain;
    if (step === 2)
      return !!(
        staffChoice === "random" ||
        staffOptions.find((s) => s.id === staffChoice)
      );
    if (step === 3) return !!(selectedDay && selectedSlot);
    if (step === 4) {
      const okName = form.nombre.trim() && form.apellidos.trim();
      const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      const okPhone = (form.telefono || "").trim().length >= 6;
      return okName && okEmail && okPhone && form.acepta;
    }
    return false;
  }, [
    step,
    selectedMain,
    staffChoice,
    staffOptions,
    selectedDay,
    selectedSlot,
    form,
  ]);

  const goNext = () => stepValid && setStep((s) => Math.min(4, s + 1));
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  // Confirmar (demo)
  function reservar() {
    if (!stepValid) return;
    const dateText = selectedDay ? fmtDateLong(selectedDay) : "";
    const timeText = selectedSlot || "";
    const personName = form?.nombre?.trim() ? form.nombre.trim() : "cliente";
    const mapsQuery =
      business?.branchMode && currentBranch?.nombre
        ? `${business?.nombre || ""} ${currentBranch?.nombre || ""}`
        : business?.nombre || "Ubicación";
    setConfirm({ name: personName, dateText, timeText, mapsQuery });
  }

  if (!okContext) {
    return (
      <div className="p-4 text-zinc-100">
        <div className={clsx(glass, "p-4")}>
          <div className="text-sm">
            No se pudo cargar el booking solicitado.
          </div>
          <Link className="underline text-cyan-200" to="/">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative p-4 space-y-5 pb-28 text-zinc-100 min-h-screen",
        "bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(124,58,237,0.20),transparent_40%),radial-gradient(1200px_600px_at_90%_90%,rgba(34,211,238,0.20),transparent_40%),linear-gradient(120deg,#0f172a,#1e293b)]"
      )}
    >
      {confirm ? (
        <ConfirmationScreen
          confirm={confirm}
          onClose={() => {
            setConfirm(null);
            setStep(1);
            setMainId("");
            setExtraIds([]);
            setSelectedDay(null);
            setSelectedSlot("");
            setStaffChoice("random");
          }}
        />
      ) : (
        <>
          {/* Encabezado */}
          <header className="space-y-1">
            <h1 className="text-xl font-semibold">
              {business?.nombre}
              {business?.branchMode && currentBranch
                ? ` — ${currentBranch.nombre}`
                : ""}
            </h1>
            {/* ya no mostramos nombre de site */}
          </header>

          {/* Paso 1 */}
          {step === 1 && (
            <Step1Servicio
              categories={categories}
              mainCalendars={mainCalendars}
              onPick={(main) => {
                // Si el servicio tiene opciones, primero mostramos el modal de opciones.
                if (Array.isArray(main.options) && main.options.length) {
                  setOptionModal({ main }); // abrir modal de opciones
                } else {
                  // Si no tiene opciones, vamos directo a seleccionar extras como antes
                  setExtrasModal({ main, chosen: new Set() });
                }
              }}
            />
          )}

          {/* Paso 2 */}
          {step === 2 && (
            <Step2ProfesionalCards
              staffOptions={staffOptions}
              staffChoice={staffChoice}
              setStaffChoice={setStaffChoice}
            />
          )}

          {/* Paso 3 */}
          {step === 3 && (
            <Step3FechaHora
              monthBase={monthBase}
              setMonthBase={setMonthBase}
              monthlyDays={daysOfMonth(monthBase)}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              availableSlots={availableSlots}
              selectedSlot={selectedSlot}
              setSelectedSlot={setSelectedSlot}
              selectedMain={selectedMain}
              staffOptions={staffOptions}
              staffChoice={staffChoice}
              setStaffChoice={setStaffChoice}
            />
          )}

          {/* Paso 4 */}
          {step === 4 && (
            <Step4Datos
              form={form}
              setForm={setForm}
              selectedMain={selectedMain}
              extraIds={extraIds}
              extraCalendars={extraCalendars}
              selectedOption={selectedOption}
              totalPrice={totalPrice}
              totalDuration={totalDuration}
              selectedDay={selectedDay}
              selectedSlot={selectedSlot}
              staffChoice={staffChoice}
              staff={staff}
            />
          )}

          {/* Footer fijo */}
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
                      <span className="font-medium text-zinc-100">
                        {selectedMain.name}
                      </span>{" "}
                      · {totalDuration} min · {totalPrice.toFixed(2)} €
                      {selectedOption ? (
                        <>
                          {" · "}
                          <span className="text-slate-200">
                            Opción: {selectedOption.name}
                          </span>
                        </>
                      ) : null}
                      {extraIds?.length ? (
                        <>
                          {" · "}
                          <span className="text-slate-200">
                            Extras:{" "}
                            {extraIds
                              .map(
                                (id) =>
                                  extraCalendars.find((e) => e.id === id)?.name
                              )
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    "Selecciona un servicio para empezar"
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={goPrev}
                    disabled={step === 1}
                  >
                    ← Anterior
                  </Button>
                  {step < 4 ? (
                    <Button
                      variant="primary"
                      onClick={goNext}
                      disabled={!stepValid}
                    >
                      Siguiente →
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={reservar}
                      disabled={!stepValid}
                    >
                      Confirmar reserva
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </footer>
          {/* Modal de opciones */}
          {optionModal && (
            <OptionsModal
              main={optionModal.main}
              options={
                Array.isArray(optionModal.main.options)
                  ? optionModal.main.options
                  : []
              }
              onClose={() => setOptionModal(null)}
              onConfirm={(chosenOptionId) => {
                // fija el main y la option seleccionada
                setMainId(optionModal.main.id);
                setOptionId(chosenOptionId);
                setOptionModal(null);
                // tras elegir opción, abrimos extras (si los hay)
                const ids = optionModal.main.extrasSupported || [];
                const hasExtras = ids.length > 0;
                if (hasExtras) {
                  setExtrasModal({ main: optionModal.main, chosen: new Set() });
                } else {
                  // si no hay extras, saltamos directo al paso 2 (profesional)
                  setStep(2);
                }
              }}
            />
          )}

          {/* Modal de extras */}
          {extrasModal && (
            <ExtrasModal
              main={extrasModal.main}
              extras={supportedExtras}
              chosen={extrasModal.chosen}
              onClose={() => setExtrasModal(null)}
              onConfirm={(chosenIds) => {
                setMainId(extrasModal.main.id);
                setExtraIds(chosenIds);
                setExtrasModal(null);
                setStep(2);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

/* Paso 1 – Servicios */
function Step1Servicio({ categories, mainCalendars, onPick }) {
  const [catId, setCatId] = useState("all");
  const filtered = mainCalendars.filter((c) =>
    catId === "all" ? true : c.categoryId === catId
  );
  const categoriesToRender =
    catId === "all" ? categories : categories.filter((c) => c.id === catId);

  return (
    <section className={clsx(glass, "p-4")}>
      <h2 className="mb-4 text-xl font-semibold text-center sm:text-2xl">
        Elige servicio
      </h2>

      <div className="mb-4">
        <div className="grid gap-2 sm:max-w-xs">
          <select
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            className="px-3 py-2 text-sm border rounded-xl border-white/15 bg-white/10"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {categoriesToRender.map((cat) => {
          const cals = filtered.filter((c) => c.categoryId === cat.id);
          if (!cals.length) return null;
          return (
            <div key={cat.id} className="space-y-2">
              <div className="text-base font-semibold sm:text-lg">
                {cat.label}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {cals.map((c) => {
                  const hasOffer =
                    c.offerPrice != null &&
                    Number(c.offerPrice) < Number(c.price || 0);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onPick(c)}
                      className={clsx(cardGlass, "w-full text-left p-3")}
                    >
                      <div className="flex items-stretch gap-3">
                        <img
                          src={
                            c.imageUrl ||
                            "https://placehold.co/200x140?text=Servicio"
                          }
                          alt=""
                          className="object-cover w-40 border h-28 rounded-xl border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold truncate sm:text-lg">
                            {c.name}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-300 line-clamp-2">
                            {c.description}
                          </div>
                          <div className="mt-2 text-sm">
                            {hasOffer ? (
                              <div>
                                <span className="mr-1 line-through opacity-70">
                                  {Number(c.price || 0).toFixed(2)} €
                                </span>
                                <span className="font-semibold">
                                  {Number(c.offerPrice).toFixed(2)} €
                                </span>
                              </div>
                            ) : (
                              <div className="font-semibold">
                                {Number(c.price || 0).toFixed(2)} €
                              </div>
                            )}
                            <div className="text-xs text-slate-300">
                              {c.duration} min
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* Modal de Extras */
function ExtrasModal({ main, extras, chosen, onClose, onConfirm }) {
  const [selected, setSelected] = useState(new Set(chosen || []));
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 p-4">
      <div className={clsx(glass, "w-[min(96vw,720px)] p-5")}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">
            Añadir extras — {main.name}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        {extras.length ? (
          <div className="grid gap-3">
            {extras.map((e) => {
              const isSel = selected.has(e.id);
              return (
                <div
                  key={e.id}
                  className={clsx(cardGlass, "p-2 flex gap-2 items-center")}
                >
                  <img
                    src={e.imageUrl || "https://placehold.co/120x90?text=Extra"}
                    alt=""
                    className="object-cover w-24 h-20 border rounded-lg border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {e.name}
                    </div>
                    <div className="text-xs text-slate-300 line-clamp-2">
                      {e.description || "—"}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      {e.price != null && (
                        <span>{Number(e.price).toFixed(2)} €</span>
                      )}
                      {e.duration != null && <span>· {e.duration} min</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(e.id)}
                    className={clsx(
                      "rounded-full w-8 h-8 border flex items-center justify-center",
                      isSel
                        ? "border-emerald-400/50 bg-emerald-500/30 text-emerald-100"
                        : "border-white/15 bg-white/10 hover:bg-white/15"
                    )}
                    title={isSel ? "Quitar" : "Añadir"}
                  >
                    {isSel ? "✓" : "+"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-slate-300">
            Este servicio no tiene extras.
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(Array.from(selected))}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* Modal de Opciones */
function OptionsModal({ main, options = [], onClose, onConfirm }) {
  const [sel, setSel] = useState(null);

  useEffect(() => {
    // Si hay opción "base" (sin recargo) intenta pre-seleccionarla
    const base = options.find(
      (o) => (o.price ?? 0) === 0 && (o.duration ?? 0) === 0
    );
    if (base) setSel(base.id);
  }, [options]);

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 p-4">
      <div className={clsx(glass, "w-[min(96vw,720px)] p-5")}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">
            Elige opción — {main.name}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        {options.length ? (
          <div className="grid gap-3">
            {options.map((o) => {
              const active = sel === o.id;
              const hasAdd = (o.duration ?? 0) || (o.price ?? 0);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSel(o.id)}
                  className={clsx(
                    cardGlass,
                    "p-2 flex gap-2 items-center text-left",
                    active && "ring-2 ring-cyan-400/40"
                  )}
                >
                  <img
                    src={
                      o.imageUrl || "https://placehold.co/120x90?text=Opción"
                    }
                    alt=""
                    className="object-cover w-24 h-20 border rounded-lg border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {o.name}
                    </div>
                    <div className="text-xs text-slate-300 line-clamp-2">
                      {o.description || "—"}
                    </div>
                    <div className="mt-1 text-xs">
                      {hasAdd ? (
                        <>
                          {o.duration ? <span>+{o.duration} min</span> : null}
                          {o.price ? (
                            <span>
                              {o.duration ? " · " : ""}+
                              {Number(o.price).toFixed(2)} €
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span>Sin recargo</span>
                      )}
                    </div>
                  </div>
                  <div
                    className={clsx(
                      "rounded-full w-8 h-8 border flex items-center justify-center",
                      active
                        ? "border-cyan-400/50 bg-cyan-500/30 text-cyan-100"
                        : "border-white/15 bg-white/10"
                    )}
                  >
                    {active ? "✓" : ""}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-slate-300">
            Este servicio no tiene opciones.
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(sel)}
            disabled={!sel}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* Paso 2 – Profesional */
function Step2ProfesionalCards({ staffOptions, staffChoice, setStaffChoice }) {
  const Card = ({ active, children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        cardGlass,
        "p-3 text-left flex gap-3 items-center w-full",
        active && "ring-2 ring-cyan-400/40"
      )}
    >
      {children}
    </button>
  );

  return (
    <section className={clsx(glass, "p-4")}>
      <h2 className="mb-3 text-base font-semibold">2) Elige profesional</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <Card
          active={staffChoice === "random"}
          onClick={() => setStaffChoice("random")}
        >
          <div className="flex items-stretch w-full gap-3">
            <img
              src="https://placehold.co/200x140?text=Aleatorio"
              className="object-cover w-40 border h-28 rounded-xl border-white/10"
              alt=""
            />
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold truncate sm:text-lg">
                Aleatorio
              </div>
              <div className="mt-0.5 text-xs text-slate-300 line-clamp-2">
                Asignaremos la mejor opción disponible
              </div>
            </div>
          </div>
        </Card>

        {staffOptions.map((s) => (
          <Card
            key={s.id}
            active={staffChoice === s.id}
            onClick={() => setStaffChoice(s.id)}
          >
            <div className="flex items-stretch w-full gap-3">
              <img
                src={s.imageUrl || "https://placehold.co/200x140?text=Staff"}
                className="object-cover w-40 border h-28 rounded-xl border-white/10"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold truncate sm:text-lg">
                  {s.name}
                </div>
                <div className="mt-0.5 text-xs text-slate-300 line-clamp-2">
                  {s.bio || "Profesional del equipo"}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* Paso 3 – Fecha y hora */
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
  staffOptions,
  staffChoice,
  setStaffChoice,
}) {
  return (
    <section className={clsx(glass, "p-4")}>
      <h2 className="mb-3 text-base font-semibold">3) Elige día y hora</h2>

      {selectedMain && (
        <div className="mb-3">
          <label className="block mb-1 text-xs text-slate-300">
            Profesional
          </label>
          <select
            value={staffChoice}
            onChange={(e) => setStaffChoice(e.target.value)}
            className="px-3 py-2 text-sm border rounded-xl border-white/15 bg-white/10"
          >
            <option value="random">Aleatorio</option>
            {(selectedMain.staffIds || [])
              .map((id) => staffOptions.find((s) => s.id === id))
              .filter(Boolean)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_280px]">
        <div className="p-3 border rounded-xl border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              onClick={() =>
                setMonthBase(
                  (p) => new Date(p.getFullYear(), p.getMonth() - 1, 1)
                )
              }
            >
              ←
            </Button>
            <div className="text-sm font-semibold">
              {monthBase.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                setMonthBase(
                  (p) => new Date(p.getFullYear(), p.getMonth() + 1, 1)
                )
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
              const isSelected =
                selectedDay && d.toDateString() === selectedDay.toDateString();
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
                    isSelected &&
                      "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 border rounded-xl border-white/10 bg-white/5">
          <div className="mb-2 text-xs text-slate-300">Horas disponibles</div>

          {availableSlots.length ? (
            (() => {
              const toMinutes = (t) => {
                const [H, M] = t.split(":").map(Number);
                return H * 60 + M;
              };
              const morning = availableSlots.filter(
                (h) => toMinutes(h) < 14 * 60
              );
              const afternoon = availableSlots.filter(
                (h) => toMinutes(h) >= 14 * 60
              );
              const SlotBtn = ({ hh }) => (
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
              );
              return (
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs text-slate-300">Mañana</div>
                    <div className="grid grid-cols-3 gap-2">
                      {morning.length ? (
                        morning.map((h) => <SlotBtn hh={h} />)
                      ) : (
                        <div className="col-span-3 text-sm text-slate-300">
                          —
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-slate-300">Tarde</div>
                    <div className="grid grid-cols-3 gap-2">
                      {afternoon.length ? (
                        afternoon.map((h) => <SlotBtn hh={h} />)
                      ) : (
                        <div className="col-span-3 text-sm text-slate-300">
                          —
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="col-span-3 text-sm text-slate-300">
              {selectedDay
                ? "Sin franjas para este día."
                : "Selecciona un día."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* Paso 4 – Datos cliente */
function Step4Datos({
  form,
  setForm,
  selectedMain,
  selectedOption,
  extraIds,
  extraCalendars,
  totalPrice,
  totalDuration,
  selectedDay,
  selectedSlot,
  staffChoice,
  staff,
}) {
  const [paymentMethod, setPaymentMethod] = useState("online"); // 'online' | 'store'
  const [showSummary, setShowSummary] = useState(false);

      // ==== Desglose base / opción / extras ====
const basePrice = Number(selectedMain?.price || 0);
const baseDuration = Number(selectedMain?.duration || 0);

const optPrice = selectedOption?.price != null ? Number(selectedOption.price) : 0;
const optDuration = selectedOption?.duration != null ? Number(selectedOption.duration) : 0;

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
            onChange={(e) =>
              setForm((f) => ({ ...f, apellidos: e.target.value }))
            }
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
            onChange={(e) =>
              setForm((f) => ({ ...f, telefono: e.target.value }))
            }
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

      {/* Pago */}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => setPaymentMethod("online")}
          className={clsx(
            "px-3 py-2 rounded-xl border text-sm",
            paymentMethod === "online"
              ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
              : "border-white/15 bg-white/10 hover:bg-white/15"
          )}
        >
          Pagar online
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("store")}
          className={clsx(
            "px-3 py-2 rounded-xl border text-sm",
            paymentMethod === "store"
              ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-100"
              : "border-white/15 bg-white/10 hover:bg-white/15"
          )}
        >
          Pagar en tienda
        </button>
      </div>

      {paymentMethod === "online" && (
        <div className="p-3 mt-3 border rounded-xl border-white/10 bg-white/5">
          <div className="mb-2 text-sm font-semibold">Pago</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Titular">
              <Input
                value={form.cardName || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cardName: e.target.value }))
                }
              />
            </Field>
            <Field label="Número tarjeta">
              <Input
                value={form.cardNumber || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cardNumber: e.target.value }))
                }
              />
            </Field>
            <Field label="Caducidad (MM/AA)">
              <Input
                value={form.cardExp || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cardExp: e.target.value }))
                }
              />
            </Field>
            <Field label="CVC">
              <Input
                value={form.cardCvc || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cardCvc: e.target.value }))
                }
              />
            </Field>
          </div>
          <div className="mt-2 text-xs text-slate-300">
            * Demo UI. Reemplaza por tu pasarela.
          </div>
        </div>
      )}

      {/* Resumen (acordeón) */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowSummary((s) => !s)}
          className={clsx(
            "w-full flex items-center justify-between px-3 py-2 rounded-xl border",
            "border-white/10 bg-white/5 hover:bg-white/10"
          )}
          aria-expanded={showSummary}
          aria-controls="resumen-reserva"
        >
          <span className="text-sm font-semibold">
            {showSummary
              ? "Ocultar datos de tu reserva"
              : "Ver datos de tu reserva"}
          </span>
          <svg
            className={clsx(
              "w-4 h-4 transition-transform",
              showSummary ? "rotate-180" : "rotate-0"
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div
          id="resumen-reserva"
          className={clsx(
            "grid gap-2 mt-3 transition-all",
            showSummary ? "block" : "hidden"
          )}
        >
          {/* Servicio */}
<div className="flex items-center gap-3 p-3 border rounded-xl border-white/10 bg-white/5">
  <img
    src={selectedMain?.imageUrl || "https://placehold.co/80x60?text=Svc"}
    alt=""
    className="object-cover w-16 h-12 border rounded-lg border-white/10"
  />
  <div className="min-w-0">
    <div className="text-xs text-slate-300">Servicio</div>
    <div className="text-sm font-semibold truncate">
      {selectedMain?.name || "—"}
      {selectedOption ? (
        <span className="ml-1 text-slate-200">· Opción: {selectedOption.name}</span>
      ) : null}
    </div>
    {/* Mini desglose base + opción */}
    <div className="mt-1 text-xs text-slate-300">
      Base: {baseDuration} min · {basePrice.toFixed(2)} €
      {selectedOption ? (
        <>
          {" · "}Opción: {optDuration ? `+${optDuration} min` : "+0 min"} · +{optPrice.toFixed(2)} €
        </>
      ) : null}
    </div>
  </div>
</div>


          {/* Profesional */}
          <div className="flex items-center gap-3 p-3 border rounded-xl border-white/10 bg-white/5">
            {(() => {
              const s =
                staffChoice === "random"
                  ? null
                  : staff.find((x) => x.id === staffChoice);
              const img = s?.imageUrl || "https://placehold.co/80x60?text=Pro";
              const name =
                staffChoice === "random" ? "Aleatorio" : s?.name || "—";
              return (
                <>
                  <img
                    src={img}
                    alt=""
                    className="object-cover w-16 h-12 border rounded-lg border-white/10"
                  />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-300">Profesional</div>
                    <div className="text-sm font-semibold truncate">{name}</div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Extras */}
          <div className="p-3 border rounded-xl border-white/10 bg-white/5">
            <div className="mb-2 text-xs text-slate-300">Extras</div>
            {extraIds?.length ? (
              <div className="flex flex-wrap gap-2">
                {extraIds.map((id) => {
                  const ex = extraCalendars.find((e) => e.id === id);
                  if (!ex) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 px-2 py-1 border rounded-lg border-white/10 bg-white/5"
                    >
                      <img
                        src={
                          ex.imageUrl || "https://placehold.co/60x40?text=Ex"
                        }
                        alt=""
                        className="object-cover w-12 border rounded-md h-9 border-white/10"
                      />
                      <span className="text-sm">{ex.name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm">Ninguno</div>
            )}
          </div>
          

          {/* Datos y totales */}
          <div className="grid gap-2 sm:grid-cols-2">
            <Stat
              label="Fecha"
              value={selectedDay ? selectedDay.toLocaleDateString() : "—"}
            />
            <Stat label="Hora" value={selectedSlot || "—"} />
            <Stat label="Duración total" value={`${totalDuration} min`} />
            <Stat label="Total" value={`${totalPrice.toFixed(2)} €`} />
          </div>
          
        </div>
      </div>
    </section>
  );
}

/* Presentación */
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

/* ===================== Confirmación ===================== */
function ConfirmationScreen({ confirm, onClose }) {
  const { dateText, timeText, mapsQuery } = confirm;
  const line1 = "Cita reservada con éxito";
  const line3 = `${dateText} a las ${timeText}`;
  const mapsSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    mapsQuery
  )}&output=embed`;
  const [showMap, setShowMap] = useState(false);
  return (
    <div className="min-h-[80vh] grid place-items-center">
      <div
        className={clsx(
          glass,
          "w-[min(96vw,920px)] p-6 text-center text-zinc-100"
        )}
      >
        <SuccessTick className="mx-auto mb-4" />
        <Typewriter
          lines={[line1, line3]}
          onComplete={() => setShowMap(true)}
        />
        <div
          className={clsx(
            "mt-6 transition-all duration-700 ease-out",
            showMap
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none"
          )}
        >
          <div className="mb-2 text-xs text-slate-300">Ubicación</div>
          <div className="overflow-hidden border rounded-xl border-white/10">
            {showMap && (
              <iframe
                title="Ubicación"
                src={mapsSrc}
                className="w-full h-[300px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
          <div className="mt-2 text-xs text-slate-300">{mapsQuery}</div>
        </div>
        <div className="flex justify-center mt-6">
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function SuccessTick({ className }) {
  return (
    <div className={clsx("inline-block", className)}>
      <svg viewBox="0 0 52 52" className="w-16 h-16">
        <circle
          cx="26"
          cy="26"
          r="25"
          fill="none"
          className="stroke-emerald-400/70"
          strokeWidth="2"
          style={{
            strokeDasharray: 160,
            strokeDashoffset: 160,
            animation: "dash 0.6s ease-out forwards",
          }}
        />
        <path
          fill="none"
          className="stroke-emerald-400"
          strokeWidth="3"
          d="M14 27 l8 8 l16 -18"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 60,
            strokeDashoffset: 60,
            animation: "dash 0.5s 0.4s ease-out forwards",
          }}
        />
      </svg>
      <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}

function Typewriter({ lines = [], onComplete }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  useEffect(() => {
    if (idx >= lines.length) {
      typeof onComplete === "function" && onComplete();
      return;
    }
    const line = lines[idx];
    let i = 0;
    setText("");
    const int = setInterval(() => {
      i++;
      setText(line.slice(0, i));
      if (i >= line.length) {
        clearInterval(int);
        setTimeout(() => setIdx((n) => n + 1), 500);
      }
    }, 20);
    return () => clearInterval(int);
  }, [idx, lines, onComplete]);

  const rendered = [];
  for (let i = 0; i < lines.length; i++) {
    if (i < idx) {
      rendered.push(
        <p
          key={i}
          className={
            i === 0 ? "text-2xl sm:text-3xl font-bold" : "text-base sm:text-lg"
          }
        >
          {lines[i]}
        </p>
      );
    } else if (i === idx) {
      rendered.push(
        <p
          key={i}
          className={
            i === 0 ? "text-2xl sm:text-3xl font-bold" : "text-base sm:text-lg"
          }
        >
          {text}
          <span className="inline-block w-2 h-5 ml-1 align-baseline bg-emerald-400 animate-pulse" />
        </p>
      );
      break;
    }
  }
  return <div className="space-y-1">{rendered}</div>;
}
