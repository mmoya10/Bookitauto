// src/pages/Calendars/CalendarManagement.jsx
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Button from "../../components/common/Button";
import { Input, Select } from "../../components/common/Input";
import Portal from "../../components/common/Portal";
import SelectableGallery from "../../components/common/SelectableGallery";
import MultiSelect from "../../components/common/MultiSelect";

import {
  fetchCalendars,
  fetchCategories,
  fetchStaff,
  fetchBookingSites,
  updateBookingSite,
  deleteBookingSite,
  createCalendar,
  updateCalendar,
  deleteCalendars,
  setActiveBookingSite,
} from "../../api/calendars";
import { fetchBusiness, fetchBranches } from "../../api/business"; // AÑADIR


const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";
  const slug = (s="") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");



export default function CalendarManagement() {
  const qc = useQueryClient();

  // ===== Data =====
  const { data: business } = useQuery({ queryKey: ["cm-biz"], queryFn: fetchBusiness });
const { data: branches = [] } = useQuery({ queryKey: ["cm-branches"], queryFn: fetchBranches, enabled: !!business });

  const { data: categories = [] } = useQuery({ queryKey: ["cm-categories"], queryFn: fetchCategories });
  const { data: staff = [] } = useQuery({ queryKey: ["cm-staff"], queryFn: fetchStaff });
  const { data: sites = [] } = useQuery({ queryKey: ["cm-sites"], queryFn: fetchBookingSites });
const activeBookingId = sites?.find((b) => b.active)?.id || "";

const mSetActiveBooking = useMutation({
  mutationFn: setActiveBookingSite,
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["cm-sites"] });
  },
});



  // filtros
  const [q, setQ] = useState("");
  const [fCats, setFCats] = useState([]);
  const [fCals, setFCals] = useState([]);
  const [fStaff, setFStaff] = useState([]);
  const [fTypes, setFTypes] = useState([]); // ['main','extra']

  // Calendars (filtered by query + filters)
  const { data: calendars = [] } = useQuery({
    queryKey: ["cm-calendars", q, fCats, fStaff, fTypes, fCals],
    queryFn: () =>
      fetchCalendars({
        q,
        categoryIds: fCats,
        staffIds: fStaff,
        types: fTypes,
        calendarIds: fCals,
      }),
    enabled: !!(categories && staff && sites),
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
  const mUpdateSite = useMutation({
    mutationFn: updateBookingSite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cm-sites"] }),
  });

  // UI State
    const [view, setView] = useState("cards"); // 'cards' | 'table'
  const [modal, setModal] = useState(null); // { mode:'create'|'edit', calendar? }

  // Gestión booking sites (panel)
  const [manageSitesOpen, setManageSitesOpen] = useState(false);
  const [manageSiteId, setManageSiteId] = useState(activeBookingId || (sites[0]?.id ?? ""));
  useEffect(() => {
    // si cambia el activo o la lista, reajusta selección por defecto
    const nextActive = sites?.find((s) => s.active)?.id || (sites[0]?.id ?? "");
    setManageSiteId((prev) => prev || nextActive);
  }, [sites, activeBookingId]);


  // Opciones para MultiSelect
  const optCats = useMemo(() => categories.map((c) => ({ id: c.id, label: c.label })), [categories]);
  const optCals = useMemo(() => calendars.map((c) => ({ id: c.id, label: c.name })), [calendars]);
  const optStaff = useMemo(() => staff.map((p) => ({ id: p.id, label: p.name })), [staff]);
  const optTypes = [
    { id: "main", label: "Principales" },
    { id: "extra", label: "Extras" },
  ];

  return (
    <div className="space-y-6 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Calendar Management</h1>
        <p className="text-sm text-slate-300">Gestiona calendarios, categorías, visibilidad en booking y personal.</p>
      </header>

      {/* ===== Sección 1: Filtros + Acciones ===== */}
      <section className={clsx(glassCard, "p-4 z-30")}>
        <div className="grid items-end gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Buscar</span>
            <Input placeholder="Nombre o descripción…" value={q} onChange={(e) => setQ(e.target.value)} />
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
            <MultiSelect items={optStaff} values={fStaff} onChange={setFStaff} />
          </div>

          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Tipo</span>
            <MultiSelect items={optTypes} values={fTypes} onChange={setFTypes} showSelectAll={false} />
          </div>
        </div>


       <div className="flex flex-wrap gap-2 mt-3">
  <Button
    variant="secondary"
    onClick={() => setManageSitesOpen(true)}
  >
    Gestionar booking sites
  </Button>

  <Button
    variant="primary"
    onClick={() => setModal({ mode: "create", calendar: { type: "main" } })}
  >
    + Añadir calendario
  </Button>
</div>

      </section>

      {/* ===== Sección 2: Listado ===== */}
      {/* ===== Panel: Gestión booking sites ===== */}
{manageSitesOpen && (
  <section className={clsx(glassCard, "p-4")}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-base font-semibold">Gestionar booking sites</h2>
        <p className="text-xs text-slate-300">
          Ver/editar visibilidad de categorías y calendarios del site seleccionado. Solo puede haber un site activo.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setManageSitesOpen(false)}>Cerrar</Button>
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <label className="grid gap-1.5">
        <span className="text-xs text-slate-300">Booking activo</span>
        <select
          className="px-3 py-2 text-sm border rounded-xl border-white/10 bg-white/10 text-zinc-100"
          value={activeBookingId}
          onChange={(e) => mSetActiveBooking.mutate({ id: e.target.value })}
        >
          {(sites ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} {b.active ? "— (activo)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs text-slate-300">Seleccionar site</span>
        <select
          className="px-3 py-2 text-sm border rounded-xl border-white/10 bg-white/10 text-zinc-100"
          value={manageSiteId}
          onChange={(e) => setManageSiteId(e.target.value)}
        >
          {(sites ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid items-end gap-2">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => mSetActiveBooking.mutate({ id: manageSiteId })}
            disabled={!manageSiteId || activeBookingId === manageSiteId}
            title="Establecer este site como activo"
          >
            Hacer activo
          </Button>

          <Button
            variant="danger"
            onClick={() => {
              if (!manageSiteId) return;
              if (window.confirm("¿Eliminar este booking site?")) {
                deleteBookingSite(manageSiteId).then(() => {
                  qc.invalidateQueries({ queryKey: ["cm-sites"] });
                });
              }
            }}
          >
            Eliminar
          </Button>

          <Button
            variant="ghost"
            title="Ver booking site"
            onClick={() => {
  const site = (sites ?? []).find(s => s.id === manageSiteId);
  if (!site || !business) return;

  const bizSlug = slug(business.nombre || "negocio");
  let branchSlug = "sucursal";
  if (business.branchMode && branches.length) {
    // usa la primera sucursal por ahora (puedes cambiar la regla si quieres)
    branchSlug = slug(branches[0].nombre || "sucursal");
  } else {
    branchSlug = slug("principal");
  }
  const siteSlug = slug(site.name || "site");
  const url = `/booking/${bizSlug}/${branchSlug}/${siteSlug}`;
  window.open(url, "_blank", "noopener,noreferrer");
}}

          >
            👁
          </Button>
        </div>
      </div>
    </div>

    <div className="mt-4">
      <BookingSiteForm
        site={sites.find((s) => s.id === manageSiteId)}
        categories={categories}
        calendars={calendars}
        submitting={mUpdateSite.isPending}
        onSubmit={(payload) => mUpdateSite.mutate(payload)}
      />
    </div>
  </section>
)}

      <SelectableGallery
        className="p-4"
        items={calendars}
        view={view}
        onViewChange={setView}
        toCard={(c) => ({
          id: c.id,
          title: c.name,
          subtitle: categories.find((x) => x.id === c.categoryId)?.label || (c.type === "extra" ? "Extra" : "Sin categoría"),
          imageUrl: c.imageUrl || "https://placehold.co/640x360?text=Calendario",
          onEdit: () => setModal({ mode: "edit", calendar: c }),
          actionsNode: (
            <StatusBadge status={c.status} />
          ),
        })}
        toTable={{
          getId: (c) => c.id,
          onEdit: (c) => setModal({ mode: "edit", calendar: c }),
          columns: [
            { key: "name", label: "Nombre", render: (c) => <span className="font-medium">{c.name}</span> },
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
if (window.confirm(`¿Eliminar ${ids.length} calendario(s)?`)) mDelete.mutate(ids);
        }}
      />

      {/* ===== Modal Calendario ===== */}
      {modal && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,720px)] p-5")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">
                  {modal.mode === "edit" ? "Editar calendario" : "Nuevo calendario"}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cerrar</Button>
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
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {status}
    </span>
  );
}

function CalendarForm({ mode, initial, categories, extras, staff, submitting, onSubmit }) {
  const isEdit = mode === "edit";
  const [type, setType] = useState(initial?.type || "main"); // 'main' | 'extra'
  const [form, setForm] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    imageUrl: initial?.imageUrl ?? "",
    status: initial?.status ?? "active",
    // comunes
    staffIds: initial?.staffIds ?? [],
    // main
    categoryId: initial?.categoryId ?? "",
    price: initial?.price ?? "",
    duration: initial?.duration ?? "",
    bufferBefore: initial?.bufferBefore ?? 0,
    bufferAfter: initial?.bufferAfter ?? 0,
    extrasSupported: initial?.extrasSupported ?? [],
    // extra
    // price/duration opcionales ya arriba
  });

  useEffect(() => {
    setType(initial?.type || "main");
  }, [initial?.type]);

  const optCats = categories.map((c) => ({ id: c.id, label: c.label }));
  const optExtras = extras.map((c) => ({ id: c.id, label: c.name }));
  const optStaff = staff.map((s) => ({ id: s.id, label: s.name }));

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
            // opcionales
            price: form.price === "" ? undefined : form.price,
            duration: form.duration === "" ? undefined : form.duration,
          });
        }
      }}
    >
      {/* Tipo */}
      {!isEdit && (
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Tipo de calendario</span>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="main">Principal</option>
            <option value="extra">Extra</option>
          </Select>
        </div>
      )}

      {/* Básicos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre *">
          <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        </Field>
        <Field label="Estado">
          <Select
            value={form.status}
            onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
          >
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </Select>
        </Field>
      </div>

      <Field label="Descripción">
        <Input value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
      </Field>

      <Field label="Imagen (URL)">
        <Input value={form.imageUrl} onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))} />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Personal asignado">
          <MultiSelect items={optStaff} values={form.staffIds} onChange={(v) => setForm((s) => ({ ...s, staffIds: v }))} />
        </Field>

        {type === "main" ? (
          <Field label="Categoría">
            <MultiSelect
              items={optCats}
              values={form.categoryId ? [form.categoryId] : []}
              onChange={(v) => setForm((s) => ({ ...s, categoryId: v[0] || "" }))}
              showSelectAll={false}
              placeholder="Selecciona 1"
            />
          </Field>
        ) : (
          <div />
        )}
      </div>

      {type === "main" ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Field label="Precio (€)">
              <Input
                type="number" step="0.01"
                value={form.price}
                onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
              />
            </Field>
            <Field label="Duración (min)">
              <Input
                type="number"
                value={form.duration}
                onChange={(e) => setForm((s) => ({ ...s, duration: e.target.value }))}
              />
            </Field>
            <Field label="Buffer antes (min)">
              <Input
                type="number"
                value={form.bufferBefore}
                onChange={(e) => setForm((s) => ({ ...s, bufferBefore: e.target.value }))}
              />
            </Field>
            <Field label="Buffer después (min)">
              <Input
                type="number"
                value={form.bufferAfter}
                onChange={(e) => setForm((s) => ({ ...s, bufferAfter: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Extras soportados">
            <MultiSelect
              items={optExtras}
              values={form.extrasSupported}
              onChange={(v) => setForm((s) => ({ ...s, extrasSupported: v }))}
            />
          </Field>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Precio (€) (opcional)">
            <Input
              type="number" step="0.01"
              value={form.price}
              onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
            />
          </Field>
          <Field label="Duración (min) (opcional)">
            <Input
              type="number"
              value={form.duration}
              onChange={(e) => setForm((s) => ({ ...s, duration: e.target.value }))}
            />
          </Field>
        </div>
      )}

      <div className="mt-1">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear calendario"}
        </Button>
      </div>
    </form>
  );
}

function BookingSiteForm({ site, categories, calendars, submitting, onSubmit }) {
  const [catIds, setCatIds] = useState(site?.categoryIds ?? []);
  const [calIds, setCalIds] = useState(site?.calendarIds ?? []);

  const optCats = categories.map((c) => ({ id: c.id, label: c.label }));
  const optCals = calendars.map((c) => ({ id: c.id, label: c.name }));

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ id: site.id, categoryIds: catIds, calendarIds: calIds });
      }}
    >
      <div className="p-3 border rounded-xl border-white/10 bg-white/5">
        <div className="text-xs text-slate-300">Booking</div>
        <div className="text-lg font-semibold">{site?.name}</div>
      </div>

      <Field label="Categorías visibles">
        <MultiSelect items={optCats} values={catIds} onChange={setCatIds} />
      </Field>

      <Field label="Calendarios visibles">
        <MultiSelect items={optCals} values={calIds} onChange={setCalIds} />
      </Field>

      <div className="mt-1">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar visibilidad"}
        </Button>
      </div>
    </form>
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
