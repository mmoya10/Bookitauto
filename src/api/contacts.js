// src/api/contacts.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let contact = {
  businessName: "Mi Pelu",
  email: "hola@mipelu.com",
  phone: "+34 600 111 222",
  whatsapp: "+34 600 111 222",
  address: "C/ Peluquería, 123 · Barcelona",
  hours: "L–V 09:00–19:00 · S 09:00–14:00",
  website: "https://mipelu.ejemplo",
};

export async function fetchBusinessContact() {
  await sleep(120);
  return { ...contact };
}

export async function sendContactMessage({ name, email, phone, subject, message }) {
  await sleep(250);
  // aquí enviarías al backend/CRM/email real
  console.log("CONTACT_MESSAGE", { name, email, phone, subject, message, at: new Date().toISOString() });
  return { ok: true };
}
