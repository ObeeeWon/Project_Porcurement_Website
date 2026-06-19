#!/usr/bin/env node
/**
 * Create the CNAME for procurement.fung-ai.com -> procurement-ah3.pages.dev
 * Requires a Cloudflare API token with Zone:DNS:Edit for fung-ai.com.
 *
 * Usage:
 *   CLOUDFLARE_DNS_TOKEN=your_token npm run dns:setup
 */
const ZONE_ID = 'c8bdaf38bc1132a1e3e7cb366eab8201';
const RECORD = {
  type: 'CNAME',
  name: 'procurement',
  content: 'procurement-ah3.pages.dev',
  proxied: true,
  ttl: 1
};

const token = process.env.CLOUDFLARE_DNS_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  console.error('Missing CLOUDFLARE_DNS_TOKEN (or CLOUDFLARE_API_TOKEN) with Zone:DNS:Edit for fung-ai.com');
  console.error('Create one at: https://dash.cloudflare.com/profile/api-tokens');
  process.exit(1);
}

const api = 'https://api.cloudflare.com/client/v4';
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function main() {
  const list = await fetch(`${api}/zones/${ZONE_ID}/dns_records?type=CNAME&name=procurement.fung-ai.com`, { headers });
  const listed = await list.json();
  if (!listed.success) {
    console.error('DNS list failed:', listed.errors);
    process.exit(1);
  }

  if (listed.result?.length) {
    const id = listed.result[0].id;
    const upd = await fetch(`${api}/zones/${ZONE_ID}/dns_records/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(RECORD)
    });
    const body = await upd.json();
    if (!body.success) {
      console.error('DNS update failed:', body.errors);
      process.exit(1);
    }
    console.log('Updated existing CNAME:', body.result.name, '->', body.result.content);
  } else {
    const create = await fetch(`${api}/zones/${ZONE_ID}/dns_records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(RECORD)
    });
    const body = await create.json();
    if (!body.success) {
      console.error('DNS create failed:', body.errors);
      process.exit(1);
    }
    console.log('Created CNAME:', body.result.name, '->', body.result.content);
  }

  console.log('Waiting for DNS propagation...');
  await new Promise(r => setTimeout(r, 5000));
  const resolved = await fetch('https://procurement.fung-ai.com/api/vendors').catch(() => null);
  if (resolved?.ok) {
    console.log('SUCCESS: https://procurement.fung-ai.com is live');
  } else {
    console.log('CNAME created. Domain may take 1-2 minutes to become active.');
    console.log('Check: https://procurement.fung-ai.com');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
