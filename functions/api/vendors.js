import { json, preflight } from './_shared.js';

export async function onRequestOptions() {
  return preflight();
}

function rowToVendor(row) {
  return {
    id: row.id,
    name: row.name,
    products: row.products || '',
    discountRate: row.discount_rate || '',
    createdAt: row.created_at
  };
}

// GET /api/vendors
export async function onRequestGet({ env }) {
  if (!env.PROCUREMENT_DB) return json({ ok: false, error: 'no_db' }, 500);
  const { results } = await env.PROCUREMENT_DB
    .prepare('SELECT * FROM vendors ORDER BY name ASC')
    .all();
  return json({ ok: true, vendors: (results || []).map(rowToVendor) });
}

// POST /api/vendors -> register a vendor
export async function onRequestPost({ request, env }) {
  if (!env.PROCUREMENT_DB) return json({ ok: false, error: 'no_db' }, 500);

  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const name = String(body.name || '').trim().slice(0, 120);
  if (!name) return json({ ok: false, error: 'name_required' }, 400);

  const products = String(body.products || '').trim().slice(0, 500);
  const discountRate = String(body.discountRate || '').trim().slice(0, 32);
  const id = 'VND-' + Math.floor(1000 + Math.random() * 9000);
  const createdAt = new Date().toISOString().slice(0, 10);

  await env.PROCUREMENT_DB.prepare(
    'INSERT INTO vendors (id, name, products, discount_rate, created_at) VALUES (?1, ?2, ?3, ?4, ?5)'
  ).bind(id, name, products, discountRate, createdAt).run();

  return json({ ok: true, vendor: rowToVendor({ id, name, products, discount_rate: discountRate, created_at: createdAt }) }, 201);
}
