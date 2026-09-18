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
