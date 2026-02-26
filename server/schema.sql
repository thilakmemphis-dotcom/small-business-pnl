-- Auth & ledger schema (server auto-creates on startup; use this for reference only)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_data (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  accounts JSONB NOT NULL DEFAULT '[]',
  entries JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);
