// src/api/notifications.js
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const rid = () => Math.random().toString(36).slice(2, 10);

// ===== Mock "Reglas de envío" (por tenant/negocio) =====
let memNotificationSettings = {
  events: { confirmation: true, cancellation: true, rescheduled: true },
  // horas ANTES de la cita
  reminders: [
    { id: rid(), hoursBefore: 24 },
    { id: rid(), hoursBefore: 3 },
  ],
  // horas DESPUÉS de la cita
  review: { hoursAfter: 4, followup: true },
};

// ===== Mock "Canales de envío" =====
let memChannelsConfig = {
  // canal activo (email | sms | whatsapp)
  active: "email",
  // Solo email disponible por ahora
  email: {
    available: true,
    smtp: {
      host: "smtp.example.com",
      port: 587,
      secure: false, // STARTTLS
      user: "no-reply@example.com",
      pass: "password-demo",
      fromName: "Bookitauto",
      fromEmail: "no-reply@example.com",
      replyTo: "soporte@example.com",
    },
  },
  sms: { available: false, note: "Próximamente (Twilio)" },
  whatsapp: { available: false, note: "Próximamente (Meta WhatsApp Business API)" },
};

// ===== API =====
export async function fetchNotificationSettings() {
  await delay();
  return structuredClone(memNotificationSettings);
}

export async function updateNotificationSettings(payload) {
  await delay(250);
  // Reemplazo controlado
  if (payload?.events) {
    memNotificationSettings.events = { ...memNotificationSettings.events, ...payload.events };
  }
  if (Array.isArray(payload?.reminders)) {
    memNotificationSettings.reminders = payload.reminders.slice(0, 3);
  }
  if (payload?.review) {
    const next = { ...memNotificationSettings.review, ...payload.review };
    if (typeof next.hoursAfter === "number") {
      next.hoursAfter = Math.max(2, Math.min(48, next.hoursAfter));
    }
    memNotificationSettings.review = next;
  }
  return structuredClone(memNotificationSettings);
}

export async function fetchChannelsConfig() {
  await delay();
  return structuredClone(memChannelsConfig);
}

export async function updateChannelsConfig(payload) {
  await delay(250);
  // payload: { active?, email?, sms?, whatsapp? }
  if (payload?.active) memChannelsConfig.active = payload.active;
  if (payload?.email) {
    const cur = memChannelsConfig.email || {};
    memChannelsConfig.email = {
      ...cur,
      ...payload.email,
      smtp: { ...(cur.smtp || {}), ...(payload.email.smtp || {}) },
    };
  }
  if (payload?.sms) {
    memChannelsConfig.sms = { ...(memChannelsConfig.sms || {}), ...payload.sms };
  }
  if (payload?.whatsapp) {
    memChannelsConfig.whatsapp = { ...(memChannelsConfig.whatsapp || {}), ...payload.whatsapp };
  }
  return structuredClone(memChannelsConfig);
}
