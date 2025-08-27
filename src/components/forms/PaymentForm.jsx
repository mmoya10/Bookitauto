// src/pages/Booking/components/PaymentForm.jsx
import { Input } from "../../components/common/Input";

/**
 * method: "online" | "store"
 * value: { cardName, cardNumber, cardExp, cardCvc }   // se usa si method === "online"
 * onChange: (partial) => void
 * errors?: { cardName?, cardNumber?, cardExp?, cardCvc? } // opcional
 * disabled?: boolean
 * showNote?: boolean
 */
export default function PaymentForm({
  method = "online",
  value,
  onChange,
  errors = {},
  disabled = false,
  showNote = true,
}) {
  if (method !== "online") return null; // si pagas en tienda no mostramos nada

  const v = value || {};
  const set = (k) => (e) => onChange({ [k]: e.target.value });

  return (
    <div className="p-3 mt-3 border rounded-xl border-white/10 bg-white/5">
      <div className="mb-2 text-sm font-semibold">Pago</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Titular" error={errors.cardName}>
          <Input
            value={v.cardName || ""}
            onChange={set("cardName")}
            disabled={disabled}
            autoComplete="cc-name"
          />
        </Field>
        <Field label="Número tarjeta" error={errors.cardNumber}>
          <Input
            value={v.cardNumber || ""}
            onChange={set("cardNumber")}
            disabled={disabled}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
          />
        </Field>
        <Field label="Caducidad (MM/AA)" error={errors.cardExp}>
          <Input
            value={v.cardExp || ""}
            onChange={set("cardExp")}
            disabled={disabled}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
          />
        </Field>
        <Field label="CVC" error={errors.cardCvc}>
          <Input
            value={v.cardCvc || ""}
            onChange={set("cardCvc")}
            disabled={disabled}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
          />
        </Field>
      </div>
      {showNote && (
        <div className="mt-2 text-xs text-slate-300">
          * Demo UI. Reemplaza por tu pasarela.
        </div>
      )}
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
