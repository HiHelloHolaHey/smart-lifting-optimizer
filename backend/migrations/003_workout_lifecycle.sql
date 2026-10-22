-- Phase 2.1 migration (idempotent)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Only one workout can be in progress per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_active_workout_per_user ON workouts(user_id) WHERE status = 'active';
