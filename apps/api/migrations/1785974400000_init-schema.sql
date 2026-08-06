-- Up Migration

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Atualiza updated_at automaticamente em qualquer UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------
-- professionals: os usuários autenticados do sistema
-- ---------------------------------------------------------------
CREATE TABLE professionals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  slug          TEXT        NOT NULL UNIQUE,
  timezone      TEXT        NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT professionals_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TRIGGER professionals_set_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- services: o que o profissional oferece
-- ---------------------------------------------------------------
CREATE TABLE services (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID        NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  duration_minutes INTEGER     NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  price_cents      INTEGER     NOT NULL CHECK (price_cents >= 0),
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_professional ON services (professional_id);

CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- working_hours: expediente semanal (0 = domingo ... 6 = sábado)
-- ---------------------------------------------------------------
CREATE TABLE working_hours (
  id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID     NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday         SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time      TIME     NOT NULL,
  end_time        TIME     NOT NULL,
  CONSTRAINT working_hours_valid_range CHECK (end_time > start_time),
  CONSTRAINT working_hours_unique UNIQUE (professional_id, weekday, start_time)
);

CREATE INDEX idx_working_hours_professional ON working_hours (professional_id, weekday);

-- ---------------------------------------------------------------
-- appointments: os agendamentos
-- ---------------------------------------------------------------
CREATE TYPE appointment_status AS ENUM ('confirmed', 'cancelled');

CREATE TABLE appointments (
  id              UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID               NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id      UUID               NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  client_name     TEXT               NOT NULL,
  client_email    TEXT,
  client_phone    TEXT,
  starts_at       TIMESTAMPTZ        NOT NULL,
  ends_at         TIMESTAMPTZ        NOT NULL,
  status          appointment_status NOT NULL DEFAULT 'confirmed',
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT now(),
  CONSTRAINT appointments_valid_range CHECK (ends_at > starts_at),
  CONSTRAINT appointments_has_contact CHECK (client_email IS NOT NULL OR client_phone IS NOT NULL)
);

CREATE INDEX idx_appointments_agenda ON appointments (professional_id, starts_at);

-- Regra RN01 gravada no banco: dois agendamentos confirmados do mesmo
-- profissional não podem ter intervalos de tempo que se cruzem.
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    professional_id                     WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'confirmed');


-- Down Migration

DROP TABLE IF EXISTS appointments;
DROP TYPE IF EXISTS appointment_status;
DROP TABLE IF EXISTS working_hours;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS professionals;
DROP FUNCTION IF EXISTS set_updated_at();