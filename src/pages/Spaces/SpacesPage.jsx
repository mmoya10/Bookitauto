import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSpaces,
  createSpace,
  updateSpace,
  deleteSpaces,
} from "../../api/spaces";
import SelectableGallery from "../../components/common/SelectableGallery";

import Button from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import Portal from "../../components/common/Portal";
import clsx from "clsx";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

/* =================== Página =================== */
export default function SpacesPage() {
  return (
    <div className="space-y-6 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Espacios &amp; Equipos</h1>
        <p className="text-sm text-slate-300">Gestiona salas, cabinas, puestos y equipos.</p>
      </header>

      <EnabledSpaces />
    </div>
  );
}


/* =================== Contenido cuando está habilitado =================== */
function EnabledSpaces() {
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [view, setView] = useState("cards"); // 'cards' | 'table'
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
    mutationFn: (ids) => deleteSpaces(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });

  return (
    <>
      {/* Filtros + CTA nuevo */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Buscar</span>
            <Input
              placeholder="Buscar por nombre…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="primary"
              onClick={() =>
                setModal({
                  mode: "create",
                  space: { name: "", description: "", capacity: 0, imageUrl: "" },
                })
              }
            >
              + Añadir espacio/equipo
            </Button>
          </div>
        </div>
      </section>

      {/* Listado con SelectableGallery */}
      <SelectableGallery
        items={spaces ?? []}
        view={view}
        onViewChange={setView}
        toCard={(s) => ({
          id: s.id,
          title: s.name,
          subtitle: s.description,
          imageUrl: s.imageUrl,
          onEdit: () => setModal({ mode: "edit", space: s }),
          actionsNode: (
            <>
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/10">
                Capacidad: <b className="ml-1">{s.capacity ?? 0}</b>
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (window.confirm("¿Eliminar este elemento?")) {
                    mDelete.mutate([s.id]);
                  }
                }}
              >
                Eliminar
              </Button>
            </>
          ),
        })}
        toTable={{
          getId: (s) => s.id,
          onEdit: (s) => setModal({ mode: "edit", space: s }),
          columns: [
            {
              key: "main",
              label: "Espacio / Equipo",
              render: (s) => (
                <div className="flex items-center gap-3">
                  <img
                    src={s.imageUrl}
                    alt=""
                    className="object-cover w-16 h-10 border rounded-md border-white/10"
                  />
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-slate-300">{s.description}</div>
                  </div>
                </div>
              ),
            },
            {
              key: "cap",
              label: "Capacidad",
              render: (s) => <span>{s.capacity ?? 0}</span>,
            },
          ],
        }}
        onDeleteSelected={(ids) => {
          if (!ids?.length) return;
          if (window.confirm(`¿Eliminar ${ids.length} elemento(s)?`)) {
            mDelete.mutate(ids);
          }
        }}
        className="p-4"
      />

      {/* Modal crear/editar */}
      {modal && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,620px)] p-5")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">
                  {modal.mode === "edit" ? "Editar elemento" : "Nuevo elemento"}
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
            className="object-cover w-full mt-2 border rounded-lg h-28 border-white/10"
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
