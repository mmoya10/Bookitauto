import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStaffList,
  createStaff,
  updateStaff,
  deleteStaff,
  fetchStaffCalendars,
  fetchStaffAbsencesMonth,
} from "../../api/staff";
import Button from "../../components/common/Button";
import ToggleView from "../../components/common/ToggleView";
import { Input } from "../../components/common/Input";
import Portal from "../../components/common/Portal";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function StaffPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["staff"], queryFn: fetchStaffList });

  // estado UI
  const [query, setQuery] = useState("");
  const [view, setView] = useState("cards"); // "table" | "cards"
  const [selected, setSelected] = useState([]); // ids
  const [modal, setModal] = useState({ open: false, mode: "create", staff: null });
  const [calModal, setCalModal] = useState(null); // { id, name }
  const [absModal, setAbsModal] = useState(null); // { id, name }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data ?? [];
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [data, query]);

  // mutaciones
  const mCreate = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setModal({ open: false, mode: "create", staff: null });
    },
  });
  const mUpdate = useMutation({
    mutationFn: updateStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setModal({ open: false, mode: "create", staff: null });
    },
  });
  const mDelete = useMutation({
    mutationFn: (ids) => deleteStaff(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setSelected([]);
      setConfirm(null);
    },
  });

  // seleccionar
  const allIds = filtered.map((p) => p.id);
  const allChecked = selected.length > 0 && selected.length === allIds.length;
  const toggleAll = () => setSelected(allChecked ? [] : allIds);
  const toggleOne = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // confirmación delete
  const [confirm, setConfirm] = useState(null); // { ids }

  return (
    <div className="space-y-5 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Gestión de personal</h1>
        <p className="text-sm text-slate-300">
          Crea, edita y consulta calendarios activos y ausencias de tu equipo.
        </p>
      </header>

      {/* Filtros/acciones */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-start">
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Buscar</span>
            <Input
              placeholder="Nombre o descripción…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Button
            variant="ghost"
            onClick={() => setConfirm({ ids: selected })}
            disabled={!selected.length}
          >
            Eliminar seleccionados ({selected.length})
          </Button>

          <Button
            variant="primary"
            onClick={() =>
              setModal({ open: true, mode: "create", staff: null })
            }
          >
            + Añadir personal
          </Button>
        </div>
      </section>

      {/* Listado */}
      <section className={clsx(glassCard, "p-3")}>
        {/* toolbar interna */}
        <div className="mb-3 flex items-center justify-end">
          <ToggleView value={view} onChange={setView} />
        </div>

        {view === "table" ? (
          <TableView
            items={filtered}
            selected={selected}
            toggleAll={toggleAll}
            allChecked={allChecked}
            toggleOne={toggleOne}
            onEdit={(s) => setModal({ open: true, mode: "edit", staff: s })}
            onCalendars={(s) => setCalModal({ id: s.id, name: s.name })}
            onAbsences={(s) => setAbsModal({ id: s.id, name: s.name })}
          />
        ) : (
          <CardsView
            items={filtered}
            selected={selected}
            toggleOne={toggleOne}
            onEdit={(s) => setModal({ open: true, mode: "edit", staff: s })}
            onCalendars={(s) => setCalModal({ id: s.id, name: s.name })}
            onAbsences={(s) => setAbsModal({ id: s.id, name: s.name })}
          />
        )}

        {!filtered?.length && (
          <div className="px-3 py-8 text-center text-sm text-slate-400">
            No hay personal que coincida con la búsqueda.
          </div>
        )}
      </section>

      {/* Modal crear/editar */}
      {modal.open && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,680px)] p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  {modal.mode === "edit" ? "Editar personal" : "Nuevo personal"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setModal({ open: false, mode: "create", staff: null })
                  }
                >
                  Cerrar
                </Button>
              </div>
              <StaffForm
                staffItem={modal.staff}
                submitting={mCreate.isPending || mUpdate.isPending}
                onSubmit={(payload) => {
                  if (modal.mode === "edit") {
                    mUpdate.mutate({ ...payload, id: modal.staff.id });
                  } else {
                    mCreate.mutate(payload);
                  }
                }}
              />
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Calendarios activos */}
      {calModal && (
        <CalendarsModal onClose={() => setCalModal(null)} staffMeta={calModal} />
      )}

      {/* Modal Ausencias */}
      {absModal && (
        <AbsencesModal onClose={() => setAbsModal(null)} staffMeta={absModal} />
      )}

      {/* Confirm eliminar */}
      {confirm && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,480px)] p-5")}>
              <h3 className="text-base font-semibold mb-2">
                Eliminar personal
              </h3>
              <p className="text-sm text-slate-300">
                Vas a eliminar <b>{confirm.ids.length}</b> registro(s). Esta
                acción no se puede deshacer.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => mDelete.mutate(confirm.ids)}
                  disabled={mDelete.isPending}
                >
                  {mDelete.isPending ? "Eliminando…" : "Eliminar"}
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

/* =================== Vistas =================== */
function TableView({
  items,
  selected,
  toggleAll,
  allChecked,
  toggleOne,
  onEdit,
  onCalendars,
  onAbsences,
}) {
  return (
    <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-300">
            <th className="px-3 py-2">
              <input
                type="checkbox"
                className="size-4 rounded border-white/20 bg-white/10"
                checked={allChecked}
                onChange={toggleAll}
              />
            </th>
            <th className="px-3 py-2">Personal</th>
            <th className="px-3 py-2">Descripción</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-t border-white/10">
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-white/20 bg-white/10"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleOne(p.id)}
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-10 w-10 object-cover rounded-full border border-white/10"
                  />
                  <div className="font-medium">{p.name}</div>
                </div>
              </td>
              <td className="px-3 py-2 text-slate-300">{p.description}</td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onCalendars(p)}>
                    Calendarios
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onAbsences(p)}>
                    Ausencias
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardsView({ items, selected, toggleOne, onEdit, onCalendars, onAbsences }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="relative">
            <img
              src={p.imageUrl}
              alt=""
              className="h-36 w-full object-cover rounded-lg border border-white/10"
            />
            <label className="absolute left-2 top-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs">
              <input
                type="checkbox"
                className="size-3.5 rounded border-white/20 bg-white/10"
                checked={selected.includes(p.id)}
                onChange={() => toggleOne(p.id)}
              />
              Seleccionar
            </label>
          </div>

          <div className="mt-2">
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="text-xs text-slate-300 line-clamp-2">
              {p.description}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onCalendars(p)}>
              Calendarios
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAbsences(p)}>
              Ausencias
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =================== Formulario =================== */
function StaffForm({ staffItem, onSubmit, submitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: staffItem ?? {
      name: "",
      description: "",
      imageUrl: "",
    },
  });

  // reset cuando llega un item nuevo (editar)
  useEffect(() => {
    if (staffItem) {
      reset({
        name: staffItem.name ?? "",
        description: staffItem.description ?? "",
        imageUrl: staffItem.imageUrl ?? "",
      });
      setPreview(staffItem.imageUrl ?? "");
      setImageMode("url");
    } else {
      reset({ name: "", description: "", imageUrl: "" });
      setPreview("");
      setImageMode("url");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffItem]);

  // modo imagen: url | file
  const [imageMode, setImageMode] = useState("url");
  const [preview, setPreview] = useState(staffItem?.imageUrl ?? "");

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file); // demo local
    setPreview(url);
    setValue("imageUrl", url, { shouldDirty: true });
  };

  const imageUrl = watch("imageUrl");

  return (
    <form
      className="grid gap-3"
      onSubmit={handleSubmit((v) => {
        onSubmit(v);
      })}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Nombre</span>
          <Input
            placeholder="Nombre"
            {...register("name", { required: true })}
          />
          {errors.name && (
            <span className="text-xs text-red-300">Requerido</span>
          )}
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Foto</span>

          {/* toggle URL / Subir */}
          <div className="inline-flex gap-2">
            <button
              type="button"
              className={clsx(
                "rounded-xl border px-3 py-1.5 text-xs transition",
                imageMode === "url"
                  ? "border-transparent text-white bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] shadow-[0_8px_24px_rgba(124,58,237,0.35)]"
                  : "border-white/10 bg-white/10 text-slate-200 hover:bg-white/15"
              )}
              onClick={() => setImageMode("url")}
            >
              URL
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-xl border px-3 py-1.5 text-xs transition",
                imageMode === "file"
                  ? "border-transparent text-white bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] shadow-[0_8px_24px_rgba(124,58,237,0.35)]"
                  : "border-white/10 bg-white/10 text-slate-200 hover:bg-white/15"
              )}
              onClick={() => setImageMode("file")}
            >
              Subir
            </button>
          </div>

          {imageMode === "url" ? (
            <Input placeholder="https://…" {...register("imageUrl")} />
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100 file:mr-3 file:rounded-lg file:border-none file:bg-white/20 file:px-3 file:py-1.5 file:text-xs hover:bg-white/15"
              />
              <input type="hidden" {...register("imageUrl")} />
            </>
          )}
        </div>
      </div>

      {/* preview */}
      {(preview || imageUrl) && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 mb-2">Vista previa</div>
          <img
            src={imageMode === "file" ? preview : imageUrl}
            alt="preview"
            className="max-h-40 rounded-lg border border-white/10 object-contain"
          />
        </div>
      )}

      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Descripción</span>
        <textarea
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-white/20 hover:bg-white/15 transition min-h-[90px]"
          placeholder="Breve descripción…"
          {...register("description")}
        />
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : staffItem ? "Guardar cambios" : "Crear personal"}
        </Button>
      </div>
    </form>
  );
}

/* =================== Modal: Calendarios activos =================== */
function CalendarsModal({ staffMeta, onClose }) {
  const { id, name } = staffMeta;
  const { data, isLoading } = useQuery({
    queryKey: ["staff-calendars", id],
    queryFn: () => fetchStaffCalendars(id),
  });

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
        <div className={clsx(glassCard, "w-[min(96vw,520px)] p-5")}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold">Calendarios de {name}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
          {isLoading ? (
            <div className="text-sm text-slate-300">Cargando…</div>
          ) : data?.length ? (
            <div className="flex flex-wrap gap-2">
              {data.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm"
                >
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-300">Sin calendarios activos.</div>
          )}
        </div>
      </div>
    </Portal>
  );
}

/* =================== Modal: Ausencias por mes =================== */
function AbsencesModal({ staffMeta, onClose }) {
  const { id, name } = staffMeta;
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });

  const year = cursor.getUTCFullYear();
  const monthIndex = cursor.getUTCMonth();

  const { data, isLoading } = useQuery({
    queryKey: ["staff-absences-month", id, year, monthIndex],
    queryFn: () => fetchStaffAbsencesMonth(id, year, monthIndex),
  });

  const pretty = format(cursor, "LLLL yyyy", { locale: es });

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
        <div className={clsx(glassCard, "w-[min(96vw,640px)] p-5")}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Ausencias · {name}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>

          {/* Nav meses */}
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCursor((d) => addMonths(d, -1))}
            >
              ← Mes anterior
            </Button>
            <div className="text-sm font-medium">{pretty}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCursor((d) => addMonths(d, +1))}
            >
              Mes siguiente →
            </Button>
          </div>

          {/* Tabla ausencias */}
          <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-300">
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Inicio</th>
                  <th className="px-3 py-2">Fin</th>
                  <th className="px-3 py-2">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-300" colSpan={4}>
                      Cargando…
                    </td>
                  </tr>
                ) : data?.length ? (
                  data.map((a) => (
                    <tr key={a.id} className="border-t border-white/10">
                      <td className="px-3 py-2">{a.type || "Ausencia"}</td>
                      <td className="px-3 py-2">{a.start}</td>
                      <td className="px-3 py-2">{a.end}</td>
                      <td className="px-3 py-2">{a.qty || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-3 text-slate-300" colSpan={4}>
                      Sin ausencias en este mes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Portal>
  );
}
