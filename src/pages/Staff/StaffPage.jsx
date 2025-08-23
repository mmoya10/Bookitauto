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
import SelectableGallery from "../../components/common/SelectableGallery";
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
  // vista del listado controlada desde la página
const [view, setView] = useState("cards");


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
  setConfirm(null);
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
  setConfirm(null);
},

  });


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
            variant="primary"
            onClick={() =>
              setModal({ open: true, mode: "create", staff: null })
            }
          >
            + Añadir personal
          </Button>
        </div>
      </section>

{/* Listado (componente reutilizable) */}
<SelectableGallery
  items={filtered}
  view={view}
  onViewChange={setView}
  // Tarjetas (avatar arriba + acciones extra)
  toCard={(s) => ({
    id: s.id,
    title: s.name,
    subtitle: s.description,
    imageUrl: s.imageUrl,
    onEdit: () => setModal({ open: true, mode: "edit", staff: s }),
    // Acciones extra (calendarios y ausencias)
    actionsNode: (
      <>
        <Button variant="ghost" size="sm" onClick={() => setCalModal({ id: s.id, name: s.name })}>
          Calendarios
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setAbsModal({ id: s.id, name: s.name })}>
          Ausencias
        </Button>
      </>
    ),
  })}
  // Tabla
  toTable={{
    getId: (s) => s.id,
    // Renderizamos acciones directamente en una columna (incluye Editar)
    columns: [
      {
        key: "staff",
        label: "Personal",
        render: (s) => (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 overflow-hidden border rounded-full border-white/10 bg-white/5">
              <img
                src={s.imageUrl}
                alt=""
                className="absolute object-cover w-auto h-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
              />
            </div>
            <div className="font-medium">{s.name}</div>
          </div>
        ),
      },
      {
        key: "desc",
        label: "Descripción",
        render: (s) => <span className="text-slate-300">{s.description}</span>,
      },
      {
        key: "actions",
        label: "",
        render: (s) => (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, mode: "edit", staff: s })}>
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCalModal({ id: s.id, name: s.name })}>
              Calendarios
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAbsModal({ id: s.id, name: s.name })}>
              Ausencias
            </Button>
          </div>
        ),
      },
    ],
    // No pasamos onEdit aquí para evitar el botón "Editar" duplicado en la última columna
  }}
  onDeleteSelected={(ids) => {
    if (!ids?.length) return;
    setConfirm({ ids }); // Reutilizamos tu modal de confirmación
  }}
/>


      {/* Modal crear/editar */}
      {modal.open && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,680px)] p-5")}>
              <div className="flex items-center justify-between mb-3">
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
              <h3 className="mb-2 text-base font-semibold">
                Eliminar personal
              </h3>
              <p className="text-sm text-slate-300">
                Vas a eliminar <b>{confirm.ids.length}</b> registro(s). Esta
                acción no se puede deshacer.
              </p>
              <div className="flex gap-2 mt-3">
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
  // estado UI
// vista del listado (controlada desde la página)

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
        <div className="p-3 border rounded-xl border-white/10 bg-white/5">
          <div className="mb-2 text-xs text-slate-300">Vista previa</div>
          <img
            src={imageMode === "file" ? preview : imageUrl}
            alt="preview"
            className="object-contain border rounded-lg max-h-40 border-white/10"
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

      <div className="flex items-center gap-2 mt-1">
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
          <div className="flex items-center justify-between mb-2">
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
                  className="px-3 py-1 text-sm border rounded-full border-white/10 bg-white/10"
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Ausencias · {name}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>

          {/* Nav meses */}
          <div className="flex items-center justify-between mb-3">
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
          <div className="overflow-auto border rounded-xl border-white/10 bg-white/5">
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
