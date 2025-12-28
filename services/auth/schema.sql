-- Schema compatible avec Supabase Auth
-- À exécuter sur votre PostgreSQL

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  phone TEXT,
  phone_confirmed_at TIMESTAMP WITH TIME ZONE,
  raw_user_meta_data JSONB DEFAULT '{}',
  raw_app_meta_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);

-- Fonction pour compatibilité avec RLS Supabase
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::UUID
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::json->>'role', 'anon')
$$;
