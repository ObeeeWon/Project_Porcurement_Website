-- ARPS Procurement System schema (Cloudflare D1)

CREATE TABLE IF NOT EXISTS requests (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Goods',
  budget_code   TEXT,
  total_pretax  REAL NOT NULL DEFAULT 0,
  total_taxed   REAL NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'Reviewing',
  it_review     INTEGER NOT NULL DEFAULT 0,
  fee           REAL NOT NULL DEFAULT 0,
  notes         TEXT,
  comment       TEXT,
  items         TEXT NOT NULL DEFAULT '[]',
  attachments   TEXT NOT NULL DEFAULT '{}',
  logs          TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);

CREATE TABLE IF NOT EXISTS vendors (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  products      TEXT,
  discount_rate TEXT,
  created_at    TEXT NOT NULL
);

-- Seed NSCC approved vendors
INSERT OR IGNORE INTO vendors (id, name, products, discount_rate, created_at) VALUES
  ('VND-AMZ', 'Amazon',  'Office supplies, electronics, lab consumables', '8%',  '2026-01-05'),
  ('VND-STP', 'Staples', 'Stationery, printers, furniture',               '12%', '2026-01-05'),
  ('VND-DRD', 'DrDrone', 'Drones, aerial imaging, UAV accessories',       '5%',  '2026-01-05');
