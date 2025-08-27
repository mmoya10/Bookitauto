// src/pages/Booking/components/CustomerForm.jsx
import { Input } from "../../components/common/Input";

/**
 * value: { nombre, apellidos, email, telefono, acepta }
 * onChange: (partial) => void   // e.g. onChange({ nombre: "..." })
 * errors?: { nombre?, apellidos?, email?, telefono?, acepta? } // opcional
 * disabled?: boolean
 */
export default function CustomerForm({ value, onChange, errors = {}, disabled = false }) {
  const v = value || {};

  const set = (key) => (e) => onChange({ [key]: e?.target?.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Nombre" error={errors.nombre}>
        <Input
          value={v.nombre || ""}
          onChange={set("nombre")}
          disabled={disabled}
          autoComplete="given-name"
        />
      </Field>
      <Field label="Apellidos" error={errors.apellidos}>
        <Input
          value={v.apellidos || ""}
          onChange={set("apellidos")}
          disabled={disabled}
          autoComplete="family-name"
        />
      </Field>
      <Field label="Email" error={errors.email}>
        <Input
          type="email"
          value={v.email || ""}
          onChange={set("email")}
          disabled={disabled}
          autoComplete="email"
        />
      </Field>
      <Field label="Teléfono" error={errors.telefono}>
        <Input
          value={v.telefono || ""}
          onChange={set("telefono")}
          disabled={disabled}
          autoComplete="tel"
        />
      </Field>

      <div className="sm:col-span-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="rounded size-4 border-white/20 bg-white/10"
            checked={!!v.acepta}
            onChange={set("acepta")}
            disabled={disabled}
          />
          Acepto recibir confirmación y recordatorios
        </label>
        {errors.acepta ? <p className="mt-1 text-xs text-rose-300">{errors.acepta}</p> : null}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs text-slate-300">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}
