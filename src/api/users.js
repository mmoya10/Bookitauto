// src/api/users.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Usuarios de ejemplo */
let users = [
  {
    id: 'u-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
    phone: '+34 600 111 111',
    imageUrl: 'https://picsum.photos/seed/u1/200/200',
    lastAppointment: '2025-08-18T16:30:00Z',
    signup: '2025-08-02T09:00:00Z', // ← este mes → “Nuevo”
  },
  {
    id: 'u-2',
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@example.com',
    phone: '+34 600 222 222',
    imageUrl: null,
    lastAppointment: '2025-07-29T11:00:00Z',
    signup: '2025-06-15T10:00:00Z',
  },
  {
    id: 'u-3',
    firstName: 'Luis',
    lastName: 'Martín',
    email: 'l.martin@example.com',
    phone: '+34 600 333 333',
    imageUrl: 'https://picsum.photos/seed/u3/200/200',
    lastAppointment: null,
    signup: '2025-08-12T12:20:00Z', // ← este mes → “Nuevo”
  },
  {
    id: 'u-4',
    firstName: 'Carmen',
    lastName: 'Santos',
    email: 'c.santos@example.com',
    phone: '+34 600 444 444',
    imageUrl: null,
    lastAppointment: '2025-08-01T09:30:00Z',
    signup: '2025-03-01T09:00:00Z',
  },
  {
    id: 'u-5',
    firstName: 'Mario',
    lastName: 'López',
    email: 'm.lopez@example.com',
    phone: '+34 600 555 555',
    imageUrl: 'https://picsum.photos/seed/u5/200/200',
    lastAppointment: '2025-08-17T15:00:00Z',
    signup: '2024-12-22T09:00:00Z',
  },
  {
    id: 'u-6',
    firstName: 'Elena',
    lastName: 'Ruiz',
    email: 'elena.ruiz@example.com',
    phone: '+34 600 666 666',
    imageUrl: null,
    lastAppointment: null,
    signup: '2025-08-05T10:10:00Z', // ← este mes → “Nuevo”
  },
  {
    id: 'u-7',
    firstName: 'Hugo',
    lastName: 'Navarro',
    email: 'h.navarro@example.com',
    phone: '+34 600 777 777',
    imageUrl: null,
    lastAppointment: '2025-08-10T13:00:00Z',
    signup: '2025-07-02T09:00:00Z',
  },
  {
    id: 'u-8',
    firstName: 'Nuria',
    lastName: 'Torres',
    email: 'n.torres@example.com',
    phone: '+34 600 888 888',
    imageUrl: 'https://picsum.photos/seed/u8/200/200',
    lastAppointment: null,
    signup: '2025-01-10T09:00:00Z',
  },
  {
    id: 'u-9',
    firstName: 'Pedro',
    lastName: 'Iglesias',
    email: 'pedro.i@example.com',
    phone: '+34 600 999 999',
    imageUrl: null,
    lastAppointment: '2025-06-14T10:00:00Z',
    signup: '2025-08-08T09:00:00Z', // ← este mes → “Nuevo”
  },
  {
    id: 'u-10',
    firstName: 'Lucía',
    lastName: 'Moya',
    email: 'lucia.moya@example.com',
    phone: '+34 600 000 000',
    imageUrl: 'https://picsum.photos/seed/u10/200/200',
    lastAppointment: '2025-08-19T18:10:00Z',
    signup: '2025-02-10T09:00:00Z',
  },
  {
    id: 'u-11',
    firstName: 'Rafa',
    lastName: 'Camacho',
    email: 'rcamacho@example.com',
    phone: '+34 611 234 567',
    imageUrl: null,
    lastAppointment: null,
    signup: '2025-08-03T12:00:00Z', // ← este mes → “Nuevo”
  },
  {
    id: 'u-12',
    firstName: 'Patricia',
    lastName: 'Vidal',
    email: 'pat.vidal@example.com',
    phone: '+34 611 765 432',
    imageUrl: null,
    lastAppointment: '2025-05-03T12:00:00Z',
    signup: '2025-04-20T10:00:00Z',
  },
];

export async function fetchUsers() {
  await sleep(140);
  // Orden básico por apellido, nombre
  return users
    .slice()
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'es', { sensitivity: 'base' })
    );
}


export async function createUser(payload) {
  await sleep(140);
  const id = `u-${Math.random().toString(36).slice(2,8)}`;
  const u = {
    id,
    firstName: (payload.firstName ?? "").trim() || "SinNombre",
    lastName:  (payload.lastName  ?? "").trim(),
    email:     (payload.email     ?? "").trim(),
    phone:     (payload.phone     ?? "").trim(),
    imageUrl:  payload.imageUrl?.trim() || null,
    lastAppointment: null,
    signup: new Date().toISOString(),
  };
  users.push(u);
  return u; // devolvemos el usuario creado
}
