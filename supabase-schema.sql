-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

DROP TABLE IF EXISTS ledger_data;

CREATE TABLE ledger_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accounts JSONB NOT NULL DEFAULT '[]',
  entries JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ledger_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ledger" ON ledger_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledger" ON ledger_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ledger" ON ledger_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ledger" ON ledger_data
  FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX ledger_data_user_id_key ON ledger_data (user_id);
