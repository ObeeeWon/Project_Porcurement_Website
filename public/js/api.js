// ARPS shared API client. Replaces the old localStorage data layer.
// All role pages talk to the same Cloudflare D1 backend through these helpers.

const ARPS = (() => {
  async function req(path, options) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    let data = null;
    try { data = await res.json(); } catch { /* ignore */ }
    if (!res.ok || (data && data.ok === false)) {
      const err = new Error((data && data.error) || ('http_' + res.status));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    async getRequests() {
      const d = await req('/api/requests');
      return d.requests || [];
    },
    async getRequest(id) {
      const d = await req('/api/requests/' + encodeURIComponent(id));
      return d.request;
    },
    async createRequest(payload) {
      const d = await req('/api/requests', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return d.request;
    },
    async updateRequest(id, payload) {
      const d = await req('/api/requests/' + encodeURIComponent(id), {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      return d.request;
    },
    async getVendors() {
      const d = await req('/api/vendors');
      return d.vendors || [];
    },
    async createVendor(payload) {
      const d = await req('/api/vendors', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return d.vendor;
    }
  };
})();

window.ARPS = ARPS;
