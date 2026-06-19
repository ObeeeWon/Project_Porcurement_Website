// Shared helpers for ARPS Pages Functions

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

export function preflight() {
  return new Response(null, { headers: CORS });
}

// Parse a request row from D1 into a client-friendly object.
export function rowToRequest(row) {
  if (!row) return null;
  const parse = (v, fallback) => {
    try { return JSON.parse(v); } catch { return fallback; }
  };
  return {
    id: row.id,
    date: row.created_at,
    type: row.type,
    budgetCode: row.budget_code,
    totalPretax: row.total_pretax,
    total: typeof row.total_taxed === 'number'
      ? '$' + row.total_taxed.toFixed(2)
      : row.total_taxed,
    totalTaxed: row.total_taxed,
    status: row.status,
    itReview: !!row.it_review,
    fee: row.fee,
    notes: row.notes || '',
    comment: row.comment || '',
    items: parse(row.items, []),
    attachments: parse(row.attachments, {}),
    logs: parse(row.logs, [])
  };
}

export const STATUSES = [
  'Reviewing',
  'Pending IT',
  'IT Approved',
  'Approved',
  'Finalized',
  'Rejected'
];
