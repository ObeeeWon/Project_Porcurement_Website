import { json, preflight, rowToRequest, STATUSES } from '../_shared.js';

export async function onRequestOptions() {
  return preflight();
}

async function fetchRow(env, id) {
  const { results } = await env.PROCUREMENT_DB
    .prepare('SELECT * FROM requests WHERE id = ?1')
    .bind(id).all();
  return results && results[0] ? results[0] : null;
}

// GET /api/requests/:id
export async function onRequestGet({ env, params }) {
  if (!env.PROCUREMENT_DB) return json({ ok: false, error: 'no_db' }, 500);
  const row = await fetchRow(env, params.id);
  if (!row) return json({ ok: false, error: 'not_found' }, 404);
  return json({ ok: true, request: rowToRequest(row) });
}

// PATCH /api/requests/:id -> update status / comment, append a log entry
export async function onRequestPatch({ request, env, params }) {
  if (!env.PROCUREMENT_DB) return json({ ok: false, error: 'no_db' }, 500);

  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const row = await fetchRow(env, params.id);
  if (!row) return json({ ok: false, error: 'not_found' }, 404);

  const status = body.status;
  if (!status || !STATUSES.includes(status)) {
    return json({ ok: false, error: 'invalid_status' }, 400);
  }

  const comment = body.comment != null ? String(body.comment).slice(0, 500) : (row.comment || '');
  const user = String(body.user || 'SYSTEM').slice(0, 32).toUpperCase();
  const action = String(body.action || status).slice(0, 80);

  let logs = [];
  try { logs = JSON.parse(row.logs); } catch { logs = []; }
  logs.push({ time: new Date().toLocaleString(), user, action });

  await env.PROCUREMENT_DB.prepare(
    'UPDATE requests SET status = ?1, comment = ?2, logs = ?3 WHERE id = ?4'
  ).bind(status, comment, JSON.stringify(logs), params.id).run();

  const updated = await fetchRow(env, params.id);
  return json({ ok: true, request: rowToRequest(updated) });
}
