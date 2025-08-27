// src/api/products.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let products = [
  {
    id: 'p-1',
    name: 'Champú Nutritivo',
    description: 'Champú profesional para cabello seco.',
    price: 12.9,
    salePrice: 9.9,
    cost: 4,
    imageUrl: 'https://www.perfumeriasavenida.com/pub/media/catalog/product/cache/4fbcd446712066eccea2fe003f1c49fb/1/0/103346_1-elvive-aceite-extraordinario-champu-nutritivo.jpg',
    createdAt: '2025-08-01T10:00:00Z',
  },
  {
    id: 'p-2',
    name: 'Acondicionador Suave',
    description: 'Suaviza y desenreda sin apelmazar.',
    price: 14.5,
    salePrice: null,
    cost: 4,
    imageUrl: 'https://assets.supermercadosmas.com/img/615x615/product/image/223213/223213.jpg',
    createdAt: '2025-08-02T10:00:00Z',
  },
  {
    id: 'p-3',
    name: 'Cera Mate',
    description: 'Fijación media, acabado natural.',
    price: 11.0,
    salePrice: 8.5,
    cost: 4,
    imageUrl: 'https://www.druni.es/media/catalog/product/1/3/1305201.jpg?quality=80&fit=bounds&height=700&width=700&canvas=700:700',
    createdAt: '2025-08-03T10:00:00Z',
  },
  {
    id: 'p-4',
    name: 'Laca Fuerte',
    description: 'Control total sin residuos.',
    price: 13.2,
    cost: 4,
    salePrice: null,
    imageUrl: 'https://www.druni.es/media/catalog/product/1/3/1305006.jpg?quality=80&fit=bounds&height=700&width=700&canvas=700:700',
    createdAt: '2025-08-04T10:00:00Z',
  },
  {
    id: 'p-5',
    name: 'Aceite Capilar',
    description: 'Brillo y nutrición con argán.',
    price: 19.9,
    salePrice: 16.9,
    cost: 4,
    imageUrl: 'https://gaiahairexperience.com/cdn/shop/files/Argan_Oil_Front_1.png?v=1720774124',
    createdAt: '2025-08-05T10:00:00Z',
  },
  {
    id: 'p-6',
    name: 'Mascarilla Reparadora',
    description: 'Repara puntas y fibra capilar.',
    price: 17.5,
    salePrice: null,
    cost: 4,
    imageUrl: 'https://www.druni.es/media/catalog/product/1/3/1306033.jpg',
    createdAt: '2025-08-06T10:00:00Z',
  },
  {
    id: 'p-7',
    name: 'Tónico Anticaída',
    description: 'Fortalece la raíz y estimula.',
    price: 22.0,
    salePrice: 19.0,
    cost: 4,
    imageUrl: 'https://www.naturvital.com/upload/media/product/0001/04/c1a0a1387dbf2efe15d8946416db84df8c7afbf3.jpeg',
    createdAt: '2025-08-07T10:00:00Z',
  },
  {
    id: 'p-8',
    name: 'Peine Carbón',
    description: 'Antiestático, resistente al calor.',
    price: 7.9,
    cost: 4,
    salePrice: null,
    imageUrl: 'https://www.todopeluqueria.es/5360-large_default/peine-carbon-antistatic-sra812-steinhart.jpg',
    createdAt: '2025-08-08T10:00:00Z',
  },
  {
    id: 'p-9',
    name: 'Sérum Brillo',
    description: 'Efecto espejo sin grasa.',
    price: 18.0,
    salePrice: 14.0,
    cost: 4,
    imageUrl: 'https://es.lorealpartnershop.com/dw/image/v2/BCKD_PRD/on/demandware.static/-/Sites-master-PPD-ES/default/dwd07cc86d/products/3474637268442_EN_1.jpg?sw=496&sh=378&sm=fit',
    createdAt: '2025-08-09T10:00:00Z',
  },
];

export async function fetchProducts() {
  await sleep(120);
  return products.slice().sort((a,b)=>a.name.localeCompare(b.name));
}

export async function createProduct(payload) {
  await sleep(150);
  const id = `p-${Math.random().toString(36).slice(2,8)}`;
  const p = {
    id,
    name: payload.name?.trim() || 'Producto',
    description: payload.description?.trim() || '',
    price: Number(payload.price ?? 0),
    salePrice: payload.salePrice === '' || payload.salePrice == null ? null : Number(payload.salePrice),
    imageUrl: payload.imageUrl?.trim() || `https://picsum.photos/seed/${id}/480/320`,
    createdAt: new Date().toISOString(),
  };
  products.push(p);
  return { ok: true, id };
}

export async function updateProduct(payload) {
  await sleep(150);
  const i = products.findIndex(p => p.id === payload.id);
  if (i >= 0) {
    products[i] = {
      ...products[i],
      name: payload.name,
      description: payload.description,
      price: Number(payload.price ?? 0),
      salePrice: payload.salePrice === '' || payload.salePrice == null ? null : Number(payload.salePrice),
      imageUrl: payload.imageUrl,
    };
  }
  return { ok: true };
}

export async function deleteProducts(ids) {
  await sleep(120);
  const set = new Set(ids);
  products = products.filter(p => !set.has(p.id));
  return { ok: true, deleted: ids.length };
}
