-- Phase 2 migration (idempotent)

-- 1. set_type enum + completed_at on workout_sets
DO $$ BEGIN
  CREATE TYPE set_type_enum AS ENUM ('warmup', 'working');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS set_type set_type_enum NOT NULL DEFAULT 'working';
ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. workout_logs: per-exercise notes within a workout
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INT NOT NULL REFERENCES exercises(id),
  exercise_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_workout_log UNIQUE (workout_id, exercise_id)
);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout ON workout_logs(workout_id);

-- 3. workout_templates: user-created routines
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercise_order_json JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON workout_templates(user_id);
