import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSpacesEnabled,
  setSpacesEnabled,
  fetchSpaces,
  createSpace,
  updateSpace,
  deleteSpaces,
} from "../../api/spaces";
import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import ViewToggle from "../../components/common/ToggleView";
import Portal from "../../components/common/Portal";
import clsx from "clsx";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

/* =================== Página =================== */
export default function SpacesPage() {
  const qc = useQueryClient();

  // ¿feature activada?
  const { data: enabledResp } = useQuery({ queryKey: ["spaces-enabled"], queryFn: fetchSpacesEnabled });
  const enabled = !!enabledResp?.enabled;

  const mEnable = useMutation({
    mutationFn: ({ enabled }) => setSpacesEnabled({ enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spaces-enabled"] }),
  });

  return (
    <div className="space-y-6 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Espacios</h1>
        <p className="text-sm text-slate-300">Activa y gestiona tus espacios físicos.</p>
      </header>

      {!enabled ? (
        <section className={clsx(glassCard, "p-5")}>
          <div className="mb-2">
            <h2 className="text-base font-semibold">Funcionalidad desactivada</h2>
            <p className="text-sm text-slate-300">
              Activa “Espacios” para organizar y reservar salas, cabinas o zonas de trabajo.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => mEnable.mutate({ enabled: true })}
            disabled={mEnable.isPending}
          >
            {mEnable.isPending ? "Activando…" : "Activar Espacios"}
          </Button>
        </section>
      ) : (
        <EnabledSpaces />
      )}
    </div>
  );
}

/* =================== Contenido cuando está habilitado =================== */
function EnabledSpaces() {
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [view, setView] = useState("cards"); // 'cards' | 'table'
  const [selected, setSelected] = useState([]); // ids seleccionados para eliminar
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', space? }

  // datos
  const { data: spaces } = useQuery({
    queryKey: ["spaces", q],
    queryFn: () => fetchSpaces({ q }),
  });

  // mutaciones
  const mCreate = useMutation({
    mutationFn: createSpace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      setModal(null);
    },
  });
  const mUpdate = useMutation({
    mutationFn: updateSpace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      setModal(null);
    },
  });
  const mDelete = useMutation({
    mutationFn: () => deleteSpaces(selected),
    onSuccess: () => {
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });

  const allChecked = useMemo(() => {
    const ids = (spaces ?? []).map((s) => s.id);
    return ids.length > 0 && selected.length === ids.length;
  }, [spaces, selected]);

  const toggleAll = () => {
    if (!spaces?.length) return;
    if (allChecked) setSelected([]);
    else setSelected(spaces.map((s) => s.id));
  };

  const toggleOne = (id) => {
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  };

  return (
    <>
      {/* Filtros */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Buscar</span>
            <Input placeholder="Buscar por nombre…" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Vista</span>
            <ViewToggle value={view} onChange={setView} />
          </div>

          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={!selected.length || mDelete.isPending}
              onClick={() => {
                if (!selected.length) return;
                if (window.confirm(`¿Eliminar ${selected.length} espacio(s)?`)) {
                  mDelete.mutate();
                }
              }}
            >
              {mDelete.isPending ? "Eliminando…" : "Eliminar seleccionados"}
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                setModal({
                  mode: "create",
                  space: { name: "", description: "", capacity: 0, imageUrl: "" },
                })
              }
            >
              + Añadir espacio
            </Button>
          </div>
        </div>
      </section>

      {/* Lista */}
      <section className={clsx(glassCard, "p-4")}>
        {view === "cards" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(spaces ?? []).map((s) => (
              <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 rounded border-white/20 bg-white/10"
                    checked={selected.includes(s.id)}
                    onChange={() => toggleOne(s.id)}
                  />
                  <div className="min-w-0">
                    <img
                      src={s.imageUrl}
                      alt=""
                      className="mb-2 h-28 w-full rounded-lg object-cover border border-white/10"
                    />
                    <div className="text-sm font-semibold truncate">{s.name}</div>
                    <div className="text-xs text-slate-300 truncate">{s.description}</div>
                    <div className="mt-1 text-xs">
                      Capacidad: <b>{s.capacity}</b>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModal({ mode: "edit", space: s })}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelected([s.id]);
                          if (window.confirm("¿Eliminar este espacio?")) {
                            deleteSpaces([s.id]).then(() => {
                              // invalidamos lista
                              const ev = new Event("invalidate-spaces");
                              window.dispatchEvent(ev);
                            });
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!spaces?.length && (
              <div className="text-sm text-slate-300">No hay espacios.</div>
            )}
          </div>
        ) : (
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
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2">Capacidad</th>
                  <th className="px-3 py-2">Imagen</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(spaces ?? []).map((s) => (
                  <tr key={s.id} className="border-t border-white/10">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-white/20 bg-white/10"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleOne(s.id)}
                      />
                    </td>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.description}</td>
                    <td className="px-3 py-2">{s.capacity}</td>
                    <td className="px-3 py-2">
                      <img
                        src={s.imageUrl}
                        alt=""
                        className="h-10 w-16 rounded-md object-cover border border-white/10"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setModal({ mode: "edit", space: s })}>
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelected([s.id]);
                            if (window.confirm("¿Eliminar este espacio?")) {
                              deleteSpaces([s.id]).then(() => {
                                const ev = new Event("invalidate-spaces");
                                window.dispatchEvent(ev);
                              });
                            }
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!spaces?.length && (
                  <tr>
                    <td className="px-3 py-3 text-slate-300" colSpan={6}>
                      No hay espacios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal crear/editar */}
      {modal && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,620px)] p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  {modal.mode === "edit" ? "Editar espacio" : "Nuevo espacio"}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
                  Cerrar
                </Button>
              </div>
              <SpaceForm
                space={modal.space}
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

      {/* Pequeño listener para invalidar cuando borro desde card */}
      <InvalidateOnEvent event="invalidate-spaces" queryKey={["spaces"]} />
    </>
  );
}

/* =================== Subcomponentes =================== */

function SpaceForm({ space, submitting, onSubmit }) {
  const [form, setForm] = useState({ ...space });
  const [tab, setTab] = useState("url"); // 'url' | 'upload'

  useEffect(() => setForm({ ...space }), [space]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          id: form.id,
          name: (form.name || "").trim(),
          description: form.description || "",
          capacity: Number(form.capacity || 0),
          imageUrl: form.imageUrl || "",
        };
        if (!payload.name) return alert("El nombre es obligatorio");
        onSubmit(payload);
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre *">
          <Input value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Capacidad">
          <Input
            type="number"
            min="0"
            value={form.capacity}
            onChange={(e)=>setForm(f=>({ ...f, capacity: e.target.value }))}
          />
        </Field>
      </div>

      <Field label="Descripción">
        <Input value={form.description} onChange={(e)=>setForm(f=>({ ...f, description: e.target.value }))} />
      </Field>

      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Imagen</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={()=>setTab("url")}
            className={clsx(
              "rounded-lg px-2 py-1 text-xs border",
              tab==="url" ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            URL
          </button>
          <button
            type="button"
            onClick={()=>setTab("upload")}
            className={clsx(
              "rounded-lg px-2 py-1 text-xs border",
              tab==="upload" ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            Subir
          </button>
        </div>

        {tab === "url" ? (
          <Input
            placeholder="https://…"
            value={form.imageUrl}
            onChange={(e)=>setForm(f=>({ ...f, imageUrl: e.target.value }))}
          />
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setForm((f)=>({ ...f, imageUrl: ev.target.result }));
              reader.readAsDataURL(file);
            }}
            className="text-sm"
          />
        )}
        {form.imageUrl && (
          <img
            src={form.imageUrl}
            alt="preview"
            className="mt-2 h-28 w-full rounded-lg object-cover border border-white/10"
          />
        )}
      </div>

      <div>
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : form.id ? "Guardar cambios" : "Crear espacio"}
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

function InvalidateOnEvent({ event, queryKey }) {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey });
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, qc, queryKey]);
  return null;
}
