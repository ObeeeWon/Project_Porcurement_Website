import { json, preflight, rowToRequest } from './_shared.js';

export async function onRequestOptions() {
  return preflight();
}

// GET /api/requests -> all requests, newest first
export async function onRequestGet({ env }) {
  if (!env.PROCUREMENT_DB) return json({ ok: false, error: 'no_db' }, 500);
  const { results } = await env.PROCUREMENT_DB
    .prepare('SELECT * FROM requests ORDER BY created_at DESC')
    .all();
  return json({ ok: true, requests: (results || []).map(rowToRequest) });
}

// POST /api/requests -> create a new request
export async function onRequestPost({ request, env }) {
  if (!env.PROCUREMENT_DB) return json({ ok: false, error: 'no_db' }, 500);

  let body;
  try {
    const text = await request.text();
    if (text.length > 64 * 1024) return json({ ok: false, error: 'too_large' }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const budgetCode = String(body.budgetCode || '').trim();
  if (!budgetCode) return json({ ok: false, error: 'budget_code_required' }, 400);

  const items = Array.isArray(body.items) ? body.items : [];
  const fee = Number(body.fee) || 0;
  const notes = String(body.notes || '').trim();
  if (fee > 0 && !notes) {
    return json({ ok: false, error: 'notes_required_with_fee' }, 400);
  }

  const type = body.type === 'Services' ? 'Services' : 'Goods';
  const totalPretax = Number(body.totalPretax) || 0;
  const totalTaxed = Number(body.totalTaxed) || 0;
  const itReview = body.itReview ? 1 : 0;
  const attachments = body.attachments && typeof body.attachments === 'object' ? body.attachments : {};

  const id = 'ARPS-' + Math.floor(10000 + Math.random() * 90000);
  const createdAt = new Date().toISOString().slice(0, 10);
  const logs = [{ time: new Date().toLocaleString(), user: 'REQUESTOR', action: 'Submitted' }];

  await env.PROCUREMENT_DB.prepare(
    `INSERT INTO requests
      (id, created_at, type, budget_code, total_pretax, total_taxed, status, it_review, fee, notes, comment, items, attachments, logs)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'Reviewing', ?7, ?8, ?9, '', ?10, ?11, ?12)`
  ).bind(
    id, createdAt, type, budgetCode, totalPretax, totalTaxed,
    itReview, fee, notes, JSON.stringify(items),
    JSON.stringify(attachments), JSON.stringify(logs)
  ).run();

  const { results } = await env.PROCUREMENT_DB
    .prepare('SELECT * FROM requests WHERE id = ?1')
    .bind(id).all();

  return json({ ok: true, request: rowToRequest(results[0]) }, 201);
}
