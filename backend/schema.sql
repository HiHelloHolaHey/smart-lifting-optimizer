CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    experience_level TEXT CHECK (experience_level IN ('beginner','intermediate','advanced')),
    goal TEXT CHECK (goal IN ('strength','hypertrophy','weight_loss','endurance')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment_needed JSONB NOT NULL DEFAULT '[]',
    is_compound BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMPTZ NOT NULL,
    split_type TEXT NOT NULL CHECK (split_type IN ('PPL_PUSH', 'PPL_PULL', 'PPL_LEGS', 'UPPER', 'LOWER', 'FULL_BODY')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','completed','skipped')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercises(id),
    weight_kg DECIMAL(6,2),
    reps INT,
    set_number INT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    gym_open_time TIME NOT NULL DEFAULT '06:00',
    gym_close_time TIME NOT NULL DEFAULT '22:00',
    busy_times_json JSONB NOT NULL DEFAULT '[]',
    preferred_frequency INT DEFAULT 4,
    goal_priority TEXT DEFAULT 'morning',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE one_rep_maxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercises(id),
    estimated_1rm_kg DECIMAL(6,2),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_orm_user_exercise UNIQUE (user_id, exercise_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_workouts_user_date ON workouts(user_id, scheduled_date);
CREATE INDEX idx_workout_sets_workout_id ON workout_sets(workout_id);
CREATE INDEX idx_workout_sets_exercise_id ON workout_sets(exercise_id);
CREATE INDEX idx_one_rep_maxes_user_exercise ON one_rep_maxes(user_id, exercise_id);

-- ===== Phase 2 additions (see migrations/002_phase2.sql) =====

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


-- 4. Workout lifecycle & custom naming (Phase 2.1)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_active_workout_per_user ON workouts(user_id) WHERE status = 'active';
