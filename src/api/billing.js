// src/api/billing.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const todayISO = () => new Date().toISOString();

let subscription = {
  planId: "pro",
  planName: "Pro",
  priceMonthly: 29,
  currency: "EUR",
  cycle: "monthly",
  status: "active", // active | past_due | canceled
  nextBillingDate: "2025-09-01",
};

const plans = [
  { id: "basic", name: "Básico", priceMonthly: 9, currency: "EUR" },
  { id: "pro", name: "Pro", priceMonthly: 29, currency: "EUR" },
  { id: "business", name: "Business", priceMonthly: 59, currency: "EUR" },
];

// facturas de ejemplo últimos meses
const genInvoices = () => {
  const arr = [];
  const now = new Date("2025-08-20T10:00:00Z");
  for (let i = 0; i < 8; i++) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0));
    const id = `inv-${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}`;
    arr.push({
      id,
      number: `F-${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}-${String(1000 + i)}`,
      date: to.toISOString(),
      periodFrom: from.toISOString(),
      periodTo: to.toISOString(),
      amount: subscription.priceMonthly,
      currency: "EUR",
      status: i === 0 ? "pending" : "paid", // la más reciente "pending"
    });
  }
  return arr;
};
let invoices = genInvoices();

/* ========= API ========= */
export async function fetchSubscription() {
  await sleep(100);
  return { ...subscription };
}
export async function fetchPlans() {
  await sleep(80);
  return plans.slice();
}
export async function updateSubscription({ planId }) {
  await sleep(150);
  const p = plans.find((x) => x.id === planId);
  if (!p) throw new Error("Plan no encontrado");
  subscription.planId = p.id;
  subscription.planName = p.name;
  subscription.priceMonthly = p.priceMonthly;
  // generar a partir de ahora nuevas facturas con nuevo precio (dejamos mock simple)
  invoices = genInvoices();
  return { ok: true, subscription: { ...subscription } };
}
export async function requestCancellation({ reason, details }) {
  await sleep(200);
  // no cancelamos automáticamente; devolvemos ticket simulado
  return { ok: true, ticketId: `CNL-${Math.random().toString(36).slice(2, 8)}`, receivedAt: todayISO() };
}
export async function fetchInvoices({ limit = 20 } = {}) {
  await sleep(120);
  return invoices.slice(0, limit);
}
export async function fetchInvoiceById(id) {
  await sleep(100);
  const inv = invoices.find((i) => i.id === id);
  if (!inv) throw new Error("Factura no encontrada");
  return inv;
}
export async function fetchInvoiceFile(id) {
  await sleep(150);
  const inv = invoices.find((i) => i.id === id);
  if (!inv) throw new Error("Factura no encontrada");
  // Contenido ficticio (podrías generar PDF en backend real)
  const text = [
    `Factura: ${inv.number}`,
    `Fecha: ${new Date(inv.date).toISOString().slice(0, 10)}`,
    `Periodo: ${new Date(inv.periodFrom).toISOString().slice(0, 10)} a ${new Date(inv.periodTo).toISOString().slice(0, 10)}`,
    `Importe: ${inv.amount.toFixed(2)} ${inv.currency}`,
    `Estado: ${inv.status}`,
    "",
    "Detalle:",
    `- Suscripción ${subscription.planName} (${subscription.planId})`,
  ].join("\n");
  return { filename: `${inv.number}.txt`, mime: "text/plain", content: text };
}
