// src/pages/Negocio/Negocio.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Button from "../../components/common/Button";
import Portal from "../../components/common/Portal";
import Toggle from "../../components/common/Toggle";
import { useEffect } from "react";

import {
  fetchBusiness,
  updateBusiness,
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../../api/business";


import { BUSINESS_TYPES, LANGUAGES, CURRENCIES, TIMEZONES } from "../../api/business";


const glass = "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]";
const secTitle = "text-sm font-semibold text-zinc-100";

export default function Negocio() {
  const qc = useQueryClient();
  const { data: business } = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const { data: branches } = useQuery({ queryKey: ["branches"], queryFn: fetchBranches, enabled: !!business });
  // ===== Notificaciones: queries


  // Formulario de datos principales + preview de logo
const [mainForm, setMainForm] = useState(null);
const [logoPreview, setLogoPreview] = useState(null);

// Cuando cargue/actualice "business", inicializa el formulario
useEffect(() => {
  if (!business) return;
  setMainForm({
    logoUrl: business.logoUrl || "",
    nombre: business.nombre || "",
    razonSocial: business.razonSocial || "",
    email: business.email || "",
    telefono: business.telefono || "",
    web: business.web || "",
    tipo: business.tipo || "peluqueria",
    idioma: business.idioma || "es",
    currency: business.currency || "EUR",
    timezone: business.timezone || "Europe/Madrid",
  });
  setLogoPreview(null);
}, [business]);


  const mUpdate = useMutation({
    mutationFn: updateBusiness,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business"] }),
  });
  function onChange(k, v) {
  setMainForm((s) => ({ ...s, [k]: v }));
}

function onLogoChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result);
    setLogoPreview(dataUrl);
    setMainForm((s) => ({ ...s, logoUrl: dataUrl }));
  };
  reader.readAsDataURL(file);
}

function onCancelMain() {
  if (!business) return;
  setMainForm({
    logoUrl: business.logoUrl || "",
    nombre: business.nombre || "",
    razonSocial: business.razonSocial || "",
    email: business.email || "",
    telefono: business.telefono || "",
    web: business.web || "",
    tipo: business.tipo || "peluqueria",
    idioma: business.idioma || "es",
    currency: business.currency || "EUR",
    timezone: business.timezone || "Europe/Madrid",
  });
  setLogoPreview(null);
}

function onSaveMain() {
  if (!mainForm) return;
  if (!mainForm.nombre?.trim()) return alert("El nombre es obligatorio");
  if (mainForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mainForm.email)) {
    return alert("Correo no válido");
  }
  mUpdate.mutate(mainForm, {
    onSuccess: () => setLogoPreview(null),
  });
}



  const [modal, setModal] = useState({ open: false, editing: null });

if (!business || !mainForm ) {
  return <div className="p-4">Cargando negocio…</div>;
}

// Mostrar solo una sucursal si NO hay modo sucursal
 const singleMode = !business.branchMode;
 const shownBranches = singleMode
   ? (branches?.length ? [branches[0]] : [])
   : (branches || []);

  // ===== Helpers notificaciones =====
  

  return (
    <div className="p-4 space-y-4">
      {/* Datos principales */}
      {/* ============ Datos principales (EDITABLE) ============ */}
<section className={clsx(glass, "p-5 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]")}>
  {/* Logo */}
  <div className="flex flex-col items-center gap-3">
    <div className="relative">
      <img
        src={logoPreview || mainForm.logoUrl || "https://placehold.co/128x128?text=LOGO"}
        alt="Logo"
        className="object-cover border size-28 rounded-xl border-white/10 bg-white/10"
      />
      <label className="absolute bottom-0 right-0 grid text-xs border rounded-full cursor-pointer size-8 place-items-center border-white/10 bg-white/20 hover:bg-white/30">
        <input type="file" onChange={onLogoChange} className="hidden" accept="image/*" />
        ✏️
      </label>
    </div>
    <div className="text-[11px] text-slate-400">PNG/JPG, máx. ~2MB (demo local)</div>
  </div>

  {/* Campos */}
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
    {/* Nombre comercial */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Nombre</span>
      <input
        value={mainForm.nombre}
        onChange={(e) => onChange("nombre", e.target.value)}
        placeholder="Nombre comercial"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
        required
      />
    </label>

    {/* Razón social */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Nombre legal (Razón social)</span>
      <input
        value={mainForm.razonSocial}
        onChange={(e) => onChange("razonSocial", e.target.value)}
        placeholder="Nombre legal"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      />
    </label>

    {/* Email */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Email</span>
      <input
        type="email"
        value={mainForm.email}
        onChange={(e) => onChange("email", e.target.value)}
        placeholder="nombre@empresa.com"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      />
    </label>

    {/* Teléfono */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Teléfono</span>
      <input
        value={mainForm.telefono}
        onChange={(e) => onChange("telefono", e.target.value)}
        placeholder="+34 600 000 000"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      />
    </label>

    {/* Web */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Web</span>
      <input
        type="url"
        value={mainForm.web}
        onChange={(e) => onChange("web", e.target.value)}
        placeholder="https://tusitio.com"
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      />
    </label>

    {/* Tipo negocio */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Tipo de negocio</span>
      <select
        value={mainForm.tipo}
        onChange={(e) => onChange("tipo", e.target.value)}
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      >
        {BUSINESS_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </label>

    {/* Idioma */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Idioma</span>
      <select
        value={mainForm.idioma}
        onChange={(e) => onChange("idioma", e.target.value)}
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
    </label>

    {/* Moneda */}
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">Moneda</span>
      <select
        value={mainForm.currency}
        onChange={(e) => onChange("currency", e.target.value)}
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      >
        {CURRENCIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </label>

    {/* Zona horaria */}
    <label className="grid gap-1 md:col-span-2">
      <span className="text-xs text-slate-300">Zona horaria</span>
      <select
        value={mainForm.timezone}
        onChange={(e) => onChange("timezone", e.target.value)}
        className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>{tz}</option>
        ))}
      </select>
    </label>

    {/* Acciones */}
    <div className="flex items-center gap-2 pt-1 md:col-span-2">
      <Button onClick={onSaveMain} disabled={mUpdate.isPending}>
        {mUpdate.isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
      <Button variant="ghost" onClick={onCancelMain} disabled={mUpdate.isPending}>
        Cancelar
      </Button>
    </div>
  </div>
</section>


      {/* Toggle modo sucursal */}
      <div className={clsx(glass, "p-4")}>
        <Toggle
          align="left"
          label="Modo sucursales"
          description="Activa para gestionar múltiples sucursales"
          checked={business.branchMode}
          onChange={(v) => mUpdate.mutate({ branchMode: v })}
        />
      </div>

       {/* Sucursales */}
      <section className={clsx(glass, "p-4")}>
        <div className="flex items-center justify-between mb-3">
          <div className={secTitle}>Sucursales</div>
          <Button
            onClick={() => setModal({ open: true, editing: null })}
            disabled={singleMode && shownBranches.length >= 1}
            title={singleMode ? "Activa el modo sucursales para añadir más" : "Añadir sucursal"}
          >
            Añadir
          </Button>
        </div>

        {!shownBranches?.length ? (
          <div className="text-sm text-slate-300">Aún no hay sucursales.</div>
        ) : (
          <div className="overflow-auto border rounded-xl border-white/10">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="text-left bg-white/5">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Dirección</th>
                  <th className="px-3 py-2">CP</th>
                  <th className="px-3 py-2">Ciudad</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Teléfono</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shownBranches.map((b) => (
                  <tr key={b.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{b.nombre}</td>
                    <td className="px-3 py-2">{b.direccion}</td>
                    <td className="px-3 py-2">{b.cp}</td>
                    <td className="px-3 py-2">{b.ciudad}</td>
                    <td className="px-3 py-2">{b.email}</td>
                    <td className="px-3 py-2">{b.telefono}</td>
                    <td className="flex justify-end gap-2 px-3 py-2">
                      <Button size="sm" variant="secondary" onClick={() => setModal({ open: true, editing: b })}>
                        Editar
                      </Button>
                      {!singleMode && <DeleteBranchButton id={b.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

     
     

      {/* Modales */}
      {modal.open && (
        <BranchModal
          initial={modal.editing}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}

    </div>
  );
}


/* ===================== Delete sucursal ===================== */
function DeleteBranchButton({ id }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => deleteBranch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
  return (
    <Button size="sm" variant="danger" onClick={() => m.mutate()} disabled={m.isPending}>
      {m.isPending ? "Eliminando…" : "Eliminar"}
    </Button>
  );
}

/* ===================== Modal sucursal ===================== */
function BranchModal({ initial, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    direccion: initial?.direccion ?? "",
    cp: initial?.cp ?? "",
    ciudad: initial?.ciudad ?? "",
    email: initial?.email ?? "",
    telefono: initial?.telefono ?? "",
  });

  const mSave = useMutation({
    mutationFn: (payload) =>
      isEdit ? updateBranch({ id: initial.id, ...payload }) : createBranch(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      onClose();
    },
  });

  function submit(e) {
    e.preventDefault();
    mSave.mutate(form);
  }

  return (
    <Portal>
      <div className="fixed inset-0 grid p-4 bg-black/40 place-items-center" onClick={onClose}>
        <div className={clsx(glass, "w-[min(600px,95vw)] p-4")} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">{isEdit ? "Editar sucursal" : "Nueva sucursal"}</div>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>

          <form onSubmit={submit} className="grid gap-2">
            {["nombre","direccion","cp","ciudad","email","telefono"].map((f)=>(
              <label key={f} className="grid gap-1">
                <span className="text-xs capitalize text-slate-300">{f}</span>
                <input
                  value={form[f]}
                  onChange={(e)=>setForm(s=>({...s,[f]:e.target.value}))}
                  className="px-3 py-2 border rounded-lg border-white/10 bg-white/10"
                  required={f==="nombre"}
                />
              </label>
            ))}
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mSave.isPending}>
                {mSave.isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear sucursal"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

