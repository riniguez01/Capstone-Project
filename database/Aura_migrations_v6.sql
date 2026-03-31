-- Aura_migrations_v6.sql
-- Fix: date_scheduling.status CHECK constraint was missing 'pending'
-- The v2 migration only allowed: 'approved', 'rejected', 'modified'
-- but dateController inserts 'pending' on new requests — this caused inserts to fail.

ALTER TABLE date_scheduling
DROP CONSTRAINT IF EXISTS check_schedule_status;

ALTER TABLE date_scheduling
ADD CONSTRAINT check_schedule_status
CHECK (status IN ('pending', 'approved', 'rejected', 'modified'));