import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSubscription,
  fetchPlans,
  updateSubscription,
  requestCancellation,
  fetchInvoices,
  fetchInvoiceById,
  fetchInvoiceFile,
} from "../../api/billing";
import Button from "../../components/common/Button";
import { Input, Select } from "../../components/common/Input";
import Portal from "../../components/common/Portal";
import clsx from "clsx";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

const fmtEUR = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(n || 0));
const dmy = (iso) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function BillingPage() {
  const qc = useQueryClient();

  const { data: sub } = useQuery({ queryKey: ["subscription"], queryFn: fetchSubscription });
  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });
  const { data: invoices } = useQuery({ queryKey: ["invoices"], queryFn: () => fetchInvoices({ limit: 24 }) });

  const mUpdate = useMutation({
    mutationFn: updateSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setEditOpen(false);
    },
  });
  const mCancel = useMutation({
    mutationFn: requestCancellation,
    onSuccess: () => {
      setCancelOpen({ done: true });
    },
  });

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(null); // {done?:boolean}
  const [viewInv, setViewInv] = useState(null); // invoice object
  const [contactOpen, setContactOpen] = useState(null); // { invoiceId? }

  return (
    <div className="space-y-5 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Facturación</h1>
        <p className="text-sm text-slate-300">Gestiona tu suscripción y consulta tus facturas.</p>
      </header>

      {/* Sección 1: Plan actual */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="mb-2">
          <h2 className="text-base font-semibold">Suscripción</h2>
          <p className="text-xs text-slate-300">Tu plan actual y próximas facturaciones.</p>
        </div>

        {sub ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Plan" value={sub.planName} />
            <Stat label="Precio" value={fmtEUR(sub.priceMonthly) + "/mes"} />
            <Stat label="Próxima factura" value={dmy(sub.nextBillingDate)} />
          </div>
        ) : (
          <div className="text-sm text-slate-300">Cargando…</div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setEditOpen(true)}>Cambiar de plan</Button>
          <Button variant="danger" onClick={() => setCancelOpen({})}>Cancelar suscripción</Button>
        </div>
      </section>

      {/* Sección 2: Facturas */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Facturas</h2>
            <p className="text-xs text-slate-300">Histórico de los últimos meses.</p>
          </div>
          <button
            className="text-xs text-cyan-200 hover:underline"
            onClick={() => setContactOpen({})}
          >
            ¿No estás de acuerdo con alguna factura?
          </button>
        </div>

        <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="px-3 py-2">Factura</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Periodo</th>
                <th className="px-3 py-2">Importe</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map((inv) => (
                <InvoiceRow
                  key={inv.id}
                  inv={inv}
                  onView={async () => {
                    const full = await fetchInvoiceById(inv.id);
                    setViewInv(full);
                  }}
                  onDownload={async () => {
                    const file = await fetchInvoiceFile(inv.id);
                    const blob = new Blob([file.content], { type: file.mime });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = file.filename;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                />
              ))}
              {!invoices?.length && (
                <tr>
                  <td className="px-3 py-3 text-slate-300" colSpan={6}>
                    No hay facturas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Cambiar de plan */}
      {editOpen && sub && plans && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,560px)] p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Cambiar de plan</h3>
                <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Cerrar</Button>
              </div>
              <EditPlanForm
                currentId={sub.planId}
                plans={plans}
                submitting={mUpdate.isPending}
                onSubmit={(planId) => mUpdate.mutate({ planId })}
              />
            </div>
          </div>
        </Portal>
      )}

      {/* Modal: Cancelar suscripción */}
      {cancelOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,620px)] p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Cancelar suscripción</h3>
                <Button variant="ghost" size="sm" onClick={() => setCancelOpen(null)}>Cerrar</Button>
              </div>
              {!cancelOpen.done ? (
                <CancelForm
                  submitting={mCancel.isPending}
                  onSubmit={(payload) => mCancel.mutate(payload)}
                />
              ) : (
                <div className="text-sm">
                  Tu solicitud se ha enviado. <b>No es automática</b>: un agente se pondrá en contacto
                  contigo para completar la cancelación. Gracias.
                  <div className="mt-3">
                    <Button variant="primary" onClick={() => setCancelOpen(null)}>Entendido</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Modal: Ver factura */}
      {viewInv && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,600px)] p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Factura {viewInv.number}</h3>
                <Button variant="ghost" size="sm" onClick={() => setViewInv(null)}>Cerrar</Button>
              </div>
              <InvoicePreview inv={viewInv} />
            </div>
          </div>
        </Portal>
      )}

      {/* Modal: Contacto / Disputa */}
      {contactOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,560px)] p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Contactar con soporte</h3>
                <Button variant="ghost" size="sm" onClick={() => setContactOpen(null)}>Cerrar</Button>
              </div>
              <ContactForm
                invoiceId={contactOpen.invoiceId}
                onSubmit={() => {
                  alert("Mensaje enviado. Te contactaremos pronto.");
                  setContactOpen(null);
                }}
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

/* ============== Subcomponentes ============== */
function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function InvoiceRow({ inv, onView, onDownload }) {
  const badge =
    inv.status === "paid"
      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
      : inv.status === "pending"
      ? "border-yellow-400/40 bg-yellow-500/20 text-yellow-100"
      : "border-rose-400/40 bg-rose-500/20 text-rose-100";
  return (
    <tr className="border-t border-white/10">
      <td className="px-3 py-2">{inv.number}</td>
      <td className="px-3 py-2">{dmy(inv.date)}</td>
      <td className="px-3 py-2">
        {dmy(inv.periodFrom)} — {dmy(inv.periodTo)}
      </td>
      <td className="px-3 py-2">{fmtEUR(inv.amount)}</td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${badge}`}>
          {inv.status}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onView}>Ver</Button>
          <Button variant="ghost" size="sm" onClick={onDownload}>Descargar</Button>
        </div>
      </td>
    </tr>
  );
}

function EditPlanForm({ currentId, plans, submitting, onSubmit }) {
  const [planId, setPlanId] = useState(currentId);
  const selected = useMemo(() => plans.find((p) => p.id === planId), [plans, planId]);
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(planId);
      }}
    >
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Plan</span>
        <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {fmtEUR(p.priceMonthly)}/mes
            </option>
          ))}
        </Select>
      </div>
      {selected && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          Cambiarás a <b>{selected.name}</b> por <b>{fmtEUR(selected.priceMonthly)}/mes</b>. El prorrateo puede
          aplicarse en el periodo actual.
        </div>
      )}
      <div>
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Confirmar cambio"}
        </Button>
      </div>
    </form>
  );
}

function CancelForm({ submitting, onSubmit }) {
  const [reason, setReason] = useState("precio");
  const [details, setDetails] = useState("");
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ reason, details });
      }}
    >
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
        <b>Importante:</b> la cancelación <u>no es automática</u>. Un agente se pondrá en contacto contigo para
        completar el proceso.
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Motivo</span>
        <Select value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="precio">Precio</option>
          <option value="funcionalidad">Falta de funcionalidades</option>
          <option value="soporte">Soporte</option>
          <option value="otro">Otro</option>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Detalles</span>
        <textarea
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100 outline-none"
          placeholder="Cuéntanos más para poder ayudarte…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>

      <div>
        <Button variant="danger" type="submit" disabled={submitting}>
          {submitting ? "Enviando…" : "Solicitar cancelación"}
        </Button>
      </div>
    </form>
  );
}

function InvoicePreview({ inv }) {
  return (
    <div className="grid gap-2 text-sm">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300">Factura</div>
          <div className="font-semibold">{inv.number}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300">Fecha</div>
          <div className="font-semibold">{dmy(inv.date)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-slate-300">Periodo</div>
        <div className="font-semibold">
          {dmy(inv.periodFrom)} — {dmy(inv.periodTo)}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-slate-300">Importe</div>
        <div className="text-lg font-semibold">{fmtEUR(inv.amount)}</div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-slate-300">Concepto</div>
        <div>Suscripción al plan {inv.planName ?? "actual"}.</div>
      </div>
    </div>
  );
}

function ContactForm({ invoiceId, onSubmit }) {
  const [subject, setSubject] = useState(invoiceId ? `Duda con la factura ${invoiceId}` : "");
  const [message, setMessage] = useState("");
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!message.trim()) {
          alert("Escribe un mensaje, por favor.");
          return;
        }
        onSubmit({ subject, message });
      }}
    >
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Asunto</span>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" />
      </div>
      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Mensaje</span>
        <textarea
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100 outline-none"
          placeholder="Cuéntanos qué ha pasado…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div>
        <Button variant="primary" type="submit">Enviar</Button>
      </div>
    </form>
  );
}
