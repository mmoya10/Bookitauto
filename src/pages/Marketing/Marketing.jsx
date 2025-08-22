// src/pages/Marketing.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Button from "../../components/common/Button";
import Portal from "../../components/common/Portal";
import Toggle from "../../components/common/Toggle";

// ====== API ======
import {
  fetchMarketing,          // GET { couponsEnabled, packsEnabled, (marketingEnabled si existe, se ignora) }
  setCouponsEnabled,       // POST boolean -> {ok:true}
  setPacksEnabled,         // POST boolean -> {ok:true}

  fetchCoupons,            // GET -> Coupon[]
  createCoupon,            // POST payload -> Coupon
  updateCoupon,            // PUT {id, ...payload} -> Coupon
  deleteCoupon,            // DELETE id -> {ok:true}

  fetchPacks,              // GET -> Pack[]
  createPack,              // POST payload -> Pack
  updatePack,              // PUT {id, ...payload} -> Pack
  deletePack,              // DELETE id -> {ok:true}
} from "../../api/marketing";

// ====== Estilos comunes ======
const glass = "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]";
const secTitle = "text-sm font-semibold text-zinc-100";

// ====== Helpers ======
function toUserArray(val) {
  if (val === "__all__" || val === "" || val == null) return "__all__";
  if (Array.isArray(val)) return val;
  return val.split(",").map((x) => x.trim()).filter(Boolean);
}
function usersToInput(value) {
  if (value === "__all__" || value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

// ====== Pantalla principal ======
export default function Marketing() {
  const qc = useQueryClient();

  // Ajustes (solo usamos couponsEnabled y packsEnabled)
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["marketing:settings"],
    queryFn: fetchMarketing,
  });

  const mSetCoupons = useMutation({
    mutationFn: setCouponsEnabled,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing:settings"] }),
  });
  const mSetPacks = useMutation({
    mutationFn: setPacksEnabled,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing:settings"] }),
  });

  // Listas
  const { data: coupons } = useQuery({
    queryKey: ["marketing:coupons"],
    queryFn: fetchCoupons,
    enabled: !!settings?.couponsEnabled,
  });
  const { data: packs } = useQuery({
    queryKey: ["marketing:packs"],
    queryFn: fetchPacks,
    enabled: !!settings?.packsEnabled,
  });

  // Modales
  const [couponModal, setCouponModal] = useState({ open: false, editing: null });
  const [packModal, setPackModal] = useState({ open: false, editing: null });

  if (loadingSettings) {
    return (
      <div className="p-4">
        <div className={clsx(glass, "p-4")}>Cargando…</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Cabecera / Toggles módulos */}
      <div className={clsx(glass, "p-4 flex flex-col gap-4")}>
        <div className="text-lg font-semibold">Marketing</div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Cupones */}
          <Toggle
            align="left"
            label="Cupones"
            description="Gestiona códigos de descuento por porcentaje o valor fijo"
            checked={!!settings?.couponsEnabled}
            onChange={(v) => mSetCoupons.mutate(v)}
          />

          {/* Packs */}
          <Toggle
            align="left"
            label="Packs"
            description="Paquetes promocionales (% off, valor fijo o servicio gratis)"
            checked={!!settings?.packsEnabled}
            onChange={(v) => mSetPacks.mutate(v)}
          />
        </div>
      </div>

      {/* Cupones */}
      <section className={clsx(glass, "p-4")}>
        <div className="mb-3 flex items-center justify-between">
          <div className={secTitle}>Cupones</div>
          <Button
            onClick={() => setCouponModal({ open: true, editing: null })}
            disabled={!settings?.couponsEnabled}
          >
            Añadir cupón
          </Button>
        </div>

        {!settings?.couponsEnabled ? (
          <div className="text-sm text-slate-300">Los cupones están desactivados.</div>
        ) : !coupons?.length ? (
          <div className="text-sm text-slate-300">Aún no hay cupones.</div>
        ) : (
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="text-left bg-white/5">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Validez</th>
                  <th className="px-3 py-2">Usuarios</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2 capitalize">{c.discountType}</td>
                    <td className="px-3 py-2">
                      {c.discountType === "percent" ? `${c.amount}%` : `${c.amount} €`}
                    </td>
                    <td className="px-3 py-2">
                      {c.validFrom ? new Date(c.validFrom).toLocaleDateString() : "—"} –{" "}
                      {c.validTo ? new Date(c.validTo).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {c.users === "__all__" ? "Todos" : Array.isArray(c.users) ? c.users.length : 0}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setCouponModal({ open: true, editing: c })}
                        >
                          Editar
                        </Button>
                        <DeleteCouponButton id={c.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Packs */}
      <section className={clsx(glass, "p-4")}>
        <div className="mb-3 flex items-center justify-between">
          <div className={secTitle}>Packs</div>
          <Button
            onClick={() => setPackModal({ open: true, editing: null })}
            disabled={!settings?.packsEnabled}
          >
            Añadir pack
          </Button>
        </div>

        {!settings?.packsEnabled ? (
          <div className="text-sm text-slate-300">Los packs están desactivados.</div>
        ) : !packs?.length ? (
          <div className="text-sm text-slate-300">Aún no hay packs.</div>
        ) : (
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="text-left bg-white/5">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Validez</th>
                  <th className="px-3 py-2">Usuarios</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {packs.map((p) => (
                  <tr key={p.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2 capitalize">
                      {p.discountType === "service" ? "servicio" : p.discountType}
                    </td>
                    <td className="px-3 py-2">
                      {p.discountType === "percent"
                        ? `${p.amount}%`
                        : p.discountType === "value"
                        ? `${p.amount} €`
                        : "Servicio gratis"}
                    </td>
                    <td className="px-3 py-2">
                      {p.validFrom ? new Date(p.validFrom).toLocaleDateString() : "—"} –{" "}
                      {p.validTo ? new Date(p.validTo).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {p.users === "__all__" ? "Todos" : Array.isArray(p.users) ? p.users.length : 0}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPackModal({ open: true, editing: p })}
                        >
                          Editar
                        </Button>
                        <DeletePackButton id={p.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modales */}
      {couponModal.open && (
        <CouponModal
          initial={couponModal.editing}
          onClose={() => setCouponModal({ open: false, editing: null })}
        />
      )}
      {packModal.open && (
        <PackModal
          initial={packModal.editing}
          onClose={() => setPackModal({ open: false, editing: null })}
        />
      )}
    </div>
  );
}

// ====== Eliminar Cupón ======
function DeleteCouponButton({ id }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => deleteCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing:coupons"] }),
  });
  return (
    <Button
      variant="danger"
      size="sm"
      onClick={() => m.mutate()}
      disabled={m.isPending}
      title="Eliminar cupón"
    >
      {m.isPending ? "Eliminando…" : "Eliminar"}
    </Button>
  );
}

// ====== Eliminar Pack ======
function DeletePackButton({ id }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => deletePack(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing:packs"] }),
  });
  return (
    <Button
      variant="danger"
      size="sm"
      onClick={() => m.mutate()}
      disabled={m.isPending}
      title="Eliminar pack"
    >
      {m.isPending ? "Eliminando…" : "Eliminar"}
    </Button>
  );
}

// ====== Modal Cupón ======
function CouponModal({ initial, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const [form, setForm] = useState(() => ({
    name: initial?.name ?? "",
    discountType: initial?.discountType ?? "percent", // "percent" | "value"
    amount: initial?.amount ?? 10,
    validFrom: initial?.validFrom ? initial.validFrom.slice(0, 10) : "",
    validTo: initial?.validTo ? initial.validTo.slice(0, 10) : "",
    target: initial?.users === "__all__" ? "all" : "specific",
    users: usersToInput(initial?.users),
  }));

  const mSave = useMutation({
    mutationFn: (payload) =>
      isEdit ? updateCoupon({ id: initial.id, ...payload }) : createCoupon(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing:coupons"] });
      onClose();
    },
  });

  function submit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      discountType: form.discountType,
      amount: Number(form.amount),
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      users: form.target === "all" ? "__all__" : toUserArray(form.users),
    };
    mSave.mutate(payload);
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[1300] bg-black/40 grid place-items-center p-4" onClick={onClose}>
        <div className={clsx(glass, "w-[min(720px,96vw)] p-4")} onClick={(e) => e.stopPropagation()}>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-semibold">{isEdit ? "Editar cupón" : "Nuevo cupón"}</div>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>

          <form onSubmit={submit} className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <Field label="Nombre">
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Tipo descuento">
                <select
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                  value={form.discountType}
                  onChange={(e) => setForm((s) => ({ ...s, discountType: e.target.value }))}
                >
                  <option value="percent">Porcentaje (%)</option>
                  <option value="value">Valor €</option>
                </select>
              </Field>

              <Field label="Valor descuento">
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Desde">
                  <input
                    type="date"
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                    value={form.validFrom}
                    onChange={(e) => setForm((s) => ({ ...s, validFrom: e.target.value }))}
                  />
                </Field>
                <Field label="Hasta">
                  <input
                    type="date"
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                    value={form.validTo}
                    onChange={(e) => setForm((s) => ({ ...s, validTo: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <fieldset className="rounded-lg border border-white/10 p-3">
              <legend className="px-1 text-xs text-slate-300">Usuarios objetivo</legend>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="target"
                    className="accent-violet-500"
                    checked={form.target === "all"}
                    onChange={() => setForm((s) => ({ ...s, target: "all" }))}
                  />
                  Para todos
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="target"
                    className="accent-violet-500"
                    checked={form.target === "specific"}
                    onChange={() => setForm((s) => ({ ...s, target: "specific" }))}
                  />
                  Usuarios concretos
                </label>
              </div>

              {form.target === "specific" && (
                <div className="mt-2">
                  <textarea
                    rows={2}
                    placeholder="IDs o emails separados por coma"
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                    value={form.users}
                    onChange={(e) => setForm((s) => ({ ...s, users: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Ejemplo: user1@dominio.com, user2@dominio.com
                  </p>
                </div>
              )}
            </fieldset>

            <div className="mt-1 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mSave.isPending}>
                {mSave.isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear cupón"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

// ====== Modal Pack ======
function PackModal({ initial, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const [form, setForm] = useState(() => ({
    name: initial?.name ?? "",
    discountType: initial?.discountType ?? "percent", // "percent" | "value" | "service"
    amount: initial?.amount ?? 10,
    validFrom: initial?.validFrom ? initial.validFrom.slice(0, 10) : "",
    validTo: initial?.validTo ? initial.validTo.slice(0, 10) : "",
    target: initial?.users === "__all__" ? "all" : "specific",
    users: usersToInput(initial?.users),
  }));

  const amountDisabled = form.discountType === "service";

  const mSave = useMutation({
    mutationFn: (payload) =>
      isEdit ? updatePack({ id: initial.id, ...payload }) : createPack(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing:packs"] });
      onClose();
    },
  });

  function submit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      discountType: form.discountType, // "percent" | "value" | "service"
      amount: amountDisabled ? null : Number(form.amount),
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      users: form.target === "all" ? "__all__" : toUserArray(form.users),
    };
    mSave.mutate(payload);
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[1300] bg-black/40 grid place-items-center p-4" onClick={onClose}>
        <div className={clsx(glass, "w-[min(720px,96vw)] p-4")} onClick={(e) => e.stopPropagation()}>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-semibold">{isEdit ? "Editar pack" : "Nuevo pack"}</div>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>

          <form onSubmit={submit} className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <Field label="Nombre">
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Tipo descuento">
                <select
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                  value={form.discountType}
                  onChange={(e) => setForm((s) => ({ ...s, discountType: e.target.value }))}
                >
                  <option value="percent">Porcentaje (%)</option>
                  <option value="value">Valor €</option>
                  <option value="service">Servicio gratis</option>
                </select>
              </Field>

              <Field label="Valor descuento">
                <input
                  type="number"
                  step="0.01"
                  className={clsx(
                    "w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2",
                    amountDisabled && "opacity-50"
                  )}
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                  disabled={amountDisabled}
                  required={!amountDisabled}
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Desde">
                  <input
                    type="date"
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                    value={form.validFrom}
                    onChange={(e) => setForm((s) => ({ ...s, validFrom: e.target.value }))}
                  />
                </Field>
                <Field label="Hasta">
                  <input
                    type="date"
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                    value={form.validTo}
                    onChange={(e) => setForm((s) => ({ ...s, validTo: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <fieldset className="rounded-lg border border-white/10 p-3">
              <legend className="px-1 text-xs text-slate-300">Usuarios objetivo</legend>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="targetPack"
                    className="accent-violet-500"
                    checked={form.target === "all"}
                    onChange={() => setForm((s) => ({ ...s, target: "all" }))}
                  />
                  Para todos
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="targetPack"
                    className="accent-violet-500"
                    checked={form.target === "specific"}
                    onChange={() => setForm((s) => ({ ...s, target: "specific" }))}
                  />
                  Usuarios concretos
                </label>
              </div>

              {form.target === "specific" && (
                <div className="mt-2">
                  <textarea
                    rows={2}
                    placeholder="IDs o emails separados por coma"
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                    value={form.users}
                    onChange={(e) => setForm((s) => ({ ...s, users: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-slate-400">Ejemplo: id1, id2, id3</p>
                </div>
              )}
            </fieldset>

            <div className="mt-1 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mSave.isPending}>
                {mSave.isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear pack"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

// ====== Campo con etiqueta ======
function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-slate-300">{label}</span>
      {children}
    </label>
  );
}
