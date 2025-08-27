import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import Portal from "../../components/common/Portal";
import SelectableGallery from "../../components/common/SelectableGallery";
import MultiSelect from "../../components/common/MultiSelect";
import { Funnel } from "lucide-react";
import { Eye } from "lucide-react";

import {
  fetchCalendars,
  fetchCategories,
  fetchStaff,
  createCalendar,
  updateCalendar,
  deleteCalendars,
} from "../../api/calendars";
import { fetchBusiness, fetchBranches } from "../../api/business";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";
const slug = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function CalendarManagement() {
  const qc = useQueryClient();

  // ===== Data =====
  const { data: business } = useQuery({
    queryKey: ["cm-biz"],
    queryFn: fetchBusiness,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ["cm-branches"],
    queryFn: fetchBranches,
    enabled: !!business,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["cm-categories"],
    queryFn: fetchCategories,
  });
  const { data: staff = [] } = useQuery({
    queryKey: ["cm-staff"],
    queryFn: fetchStaff,
  });

  // filtros
  const [q, setQ] = useState("");
  const [fCats, setFCats] = useState([]);
  const [fCals, setFCals] = useState([]);
  const [fStaff, setFStaff] = useState([]);
  const [fTypes, setFTypes] = useState([]); // ['main','extra']

  // Calendars (solo activos)
  const { data: calendars = [] } = useQuery({
    queryKey: ["cm-calendars", q, fCats, fStaff, fTypes, fCals],
    queryFn: () =>
      fetchCalendars({
        q,
        categoryIds: fCats,
        staffIds: fStaff,
        types: fTypes,
        calendarIds: fCals,
      }).then((list) => list.filter((c) => c.status === "active")),
    enabled: !!(categories && staff),
  });

  // Mutations
  const mCreate = useMutation({
    mutationFn: createCalendar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cm-calendars"] });
      setModal(null);
    },
  });
  const mUpdate = useMutation({
    mutationFn: updateCalendar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cm-calendars"] });
      setModal(null);
    },
  });
  const mDelete = useMutation({
    mutationFn: (ids) => deleteCalendars(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cm-calendars"] }),
  });

  // UI State
  const [view, setView] = useState("cards"); // 'cards' | 'table'
  const [modal, setModal] = useState(null);
  const [filtersOpenCM, setFiltersOpenCM] = useState(false);

  // Opciones para MultiSelect
  const optCats = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories]
  );
  const optCals = useMemo(
    () => calendars.map((c) => ({ id: c.id, label: c.name })),
    [calendars]
  );
  const optStaff = useMemo(
    () => staff.map((p) => ({ id: p.id, label: p.name })),
    [staff]
  );
  const optTypes = [
    { id: "main", label: "Principales" },
    { id: "extra", label: "Extras" },
  ];

  return (
    <div className="space-y-6 text-zinc-100">
      <header className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Gestión de calendarios</h1>
        <p className="text-sm text-slate-300">
          Administra calendarios visibles en la página de reservas.
        </p>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() =>
              setModal({ mode: "create", calendar: { type: "main" } })
            }
          >
            + Añadir calendario
          </Button>

          <Button
            variant="ghost"
            title="Ver página de reservas"
            aria-label="Ver página de reservas"
            onClick={() => {
              if (!business) return;
              const bizSlug = slug(business.nombre || "negocio");
              let branchSlug = "principal";
              if (business.branchMode && branches.length) {
                branchSlug = slug(branches[0].nombre || "sucursal");
              }
              const url = `/booking/${bizSlug}/${branchSlug}`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          > 
            <Eye className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </div>
      </header>

      {/* ===== Filtros ===== */}
      <section className={clsx(glassCard, "p-4 relative z-0")}>
        {/* Botón Filtros (solo móvil) */}
        <div className="mb-3 md:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpenCM((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-white/10 bg-white/10 text-zinc-100 hover:bg-white/15"
            title="Mostrar/ocultar filtros"
          >
            <Funnel size={16} className="opacity-80" />
            Filtros
          </button>
        </div>

        {/* Contenido colapsable en móvil; siempre visible en desktop */}
        <div className={clsx(filtersOpenCM ? "block" : "hidden", "md:block")}>
          <div className="grid items-end gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="grid gap-1.5">
              <span className="text-xs text-slate-300">Buscar</span>
              <Input
                placeholder="Nombre o descripción…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs text-slate-300">Categorías</span>
              <MultiSelect items={optCats} values={fCats} onChange={setFCats} />
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs text-slate-300">Calendarios</span>
              <MultiSelect items={optCals} values={fCals} onChange={setFCals} />
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs text-slate-300">Personal</span>
              <MultiSelect
                items={optStaff}
                values={fStaff}
                onChange={setFStaff}
              />
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs text-slate-300">Tipo</span>
              <MultiSelect
                items={optTypes}
                values={fTypes}
                onChange={setFTypes}
                showSelectAll={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Listado ===== */}
      <SelectableGallery
        className="p-4"
        items={calendars}
        view={view}
        onViewChange={setView}
        toCard={(c) => ({
          id: c.id,
          title: c.name,
          subtitle:
            categories.find((x) => x.id === c.categoryId)?.label ||
            (c.type === "extra" ? "Extra" : "Sin categoría"),
          imageUrl:
            c.imageUrl || "https://placehold.co/640x360?text=Calendario",
          onEdit: () => setModal({ mode: "edit", calendar: c }),
          actionsNode: <StatusBadge status={c.status} />,
        })}
        toTable={{
          getId: (c) => c.id,
          onEdit: (c) => setModal({ mode: "edit", calendar: c }),
          columns: [
            {
              key: "name",
              label: "Nombre",
              render: (c) => <span className="font-medium">{c.name}</span>,
            },
            {
              key: "cat",
              label: "Categoría",
              render: (c) =>
                categories.find((x) => x.id === c.categoryId)?.label ||
                (c.type === "extra" ? "Extra" : "—"),
            },
            {
              key: "status",
              label: "Estado",
              render: (c) => <StatusBadge status={c.status} />,
            },
          ],
        }}
        onDeleteSelected={(ids) => {
          if (!ids?.length) return;
          if (window.confirm(`¿Eliminar ${ids.length} calendario(s)?`))
            mDelete.mutate(ids);
        }}
      />

      {/* ===== Modal Calendario ===== */}
      {modal && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,720px)] p-5")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">
                  {modal.mode === "edit"
                    ? "Editar calendario"
                    : "Nuevo calendario"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModal(null)}
                >
                  Cerrar
                </Button>
              </div>
              <CalendarForm
                mode={modal.mode}
                initial={modal.calendar}
                categories={categories}
                extras={calendars.filter((c) => c.type === "extra")}
                staff={staff}
                submitting={mCreate.isPending || mUpdate.isPending}
                onSubmit={(payload) => {
                  if (modal.mode === "edit") mUpdate.mutate(payload);
                  else mCreate.mutate(payload);
                }}
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

/* ========= Subcomponentes ========= */
function StatusBadge({ status }) {
  const cls =
    status === "active"
      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
      : status === "draft"
      ? "border-yellow-400/40 bg-yellow-500/20 text-yellow-100"
      : "border-rose-400/40 bg-rose-500/20 text-rose-100";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}
    >
      {status}
    </span>
  );
}
function CalendarForm({
  mode,
  initial,
  categories,
  extras,
  staff,
  submitting,
  onSubmit,
}) {
  const [type, setType] = useState(initial?.type || "main");
  const [form] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    imageUrl: initial?.imageUrl ?? "",
    status: initial?.status ?? "active",
    staffIds: initial?.staffIds ?? [],
    categoryId: initial?.categoryId ?? "",
    price: initial?.price ?? "",
    duration: initial?.duration ?? "",
    bufferBefore: initial?.bufferBefore ?? 0,
    bufferAfter: initial?.bufferAfter ?? 0,
    extrasSupported: initial?.extrasSupported ?? [],
  });

  useEffect(() => {
    setType(initial?.type || "main");
  }, [initial?.type]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const base = {
          id: form.id,
          type,
          name: form.name.trim(),
          description: form.description,
          imageUrl: form.imageUrl,
          status: form.status,
          staffIds: form.staffIds,
        };
        if (!base.name) return alert("El nombre es obligatorio");

        if (type === "main") {
          onSubmit({
            ...base,
            categoryId: form.categoryId || null,
            price: form.price,
            duration: form.duration,
            bufferBefore: form.bufferBefore,
            bufferAfter: form.bufferAfter,
            extrasSupported: form.extrasSupported,
          });
        } else {
          onSubmit({
            ...base,
            price: form.price === "" ? undefined : form.price,
            duration: form.duration === "" ? undefined : form.duration,
          });
        }
      }}
    >
      {/* Aquí los mismos inputs que ya tenías */}
      {/* ... */}
    </form>
  );
}
