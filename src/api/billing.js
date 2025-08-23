// src/api/billing.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const todayISO = () => new Date().toISOString();

let subscription = {
  model: "per_unit", // per_unit = por uso (sucursal + empleado)
  currency: "EUR",
  cycle: "monthly",
  status: "active", // active | past_due | canceled
  nextBillingDate: "2025-09-01",

  // precios unitarios
  unitPrices: {
    branch: 9.9,   // €/sucursal
    staff: 8.9,    // €/empleado
  },

  // contadores actuales (ejemplo solicitado: 2 y 2)
  counts: {
    branches: 2,
    staff: 2,
  },
};




// facturas de ejemplo últimos meses
const genInvoices = () => {
  const arr = [];
  const now = new Date("2025-08-20T10:00:00Z");

  const amountFor = (counts, unitPrices) =>
    Number(counts.branches) * Number(unitPrices.branch) +
    Number(counts.staff) * Number(unitPrices.staff);

  for (let i = 0; i < 8; i++) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0));
    const id = `inv-${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}`;

    const amount = amountFor(subscription.counts, subscription.unitPrices);

    arr.push({
      id,
      number: `F-${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1).padStart(2, "0")}-${String(1000 + i)}`,
      date: to.toISOString(),
      periodFrom: from.toISOString(),
      periodTo: to.toISOString(),
      amount,
      currency: "EUR",
      status: i === 0 ? "pending" : "paid",
      // guardamos meta para vista/descarga
      meta: {
        model: subscription.model,
        unitPrices: { ...subscription.unitPrices },
        counts: { ...subscription.counts },
      },
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
  return [];
}
export async function updateSubscription() {
  await sleep(100);
  throw new Error("El modelo actual es por uso (sucursales + empleados). No hay planes.");
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

  const { counts, unitPrices } = inv.meta ?? { counts: subscription.counts, unitPrices: subscription.unitPrices };
  const lines = [
    `Factura: ${inv.number}`,
    `Fecha: ${new Date(inv.date).toISOString().slice(0, 10)}`,
    `Periodo: ${new Date(inv.periodFrom).toISOString().slice(0, 10)} a ${new Date(inv.periodTo).toISOString().slice(0, 10)}`,
    "",
    "Detalle de suscripción (modelo por uso):",
    `- Sucursales: ${counts.branches} x ${unitPrices.branch.toFixed(2)} EUR = ${(counts.branches * unitPrices.branch).toFixed(2)} EUR`,
    `- Empleados: ${counts.staff} x ${unitPrices.staff.toFixed(2)} EUR = ${(counts.staff * unitPrices.staff).toFixed(2)} EUR`,
    `Total: ${inv.amount.toFixed(2)} ${inv.currency}`,
    `Estado: ${inv.status}`,
  ];

  return { filename: `${inv.number}.txt`, mime: "text/plain", content: lines.join("\n") };
}

