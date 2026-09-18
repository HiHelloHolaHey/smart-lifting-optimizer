INSERT INTO exercises (name, muscle_group, equipment_needed, is_compound) VALUES
-- Chest
('Barbell Bench Press', 'Chest', '["barbell"]', true),
('Dumbbell Bench Press', 'Chest', '["dumbbell"]', false),
('Incline Barbell Press', 'Chest', '["barbell"]', false),
('Incline Dumbbell Press', 'Chest', '["dumbbell"]', false),
('Cable Chest Fly', 'Chest', '["cable"]', false),
('Chest Press Machine', 'Chest', '["machine"]', false),
('Dumbbell Fly', 'Chest', '["dumbbell"]', false),
('Push-Up', 'Chest', '["bodyweight"]', false),
('Dips', 'Chest', '["bodyweight"]', false),

-- Back
('Barbell Row', 'Back', '["barbell"]', true),
('Dumbbell Row', 'Back', '["dumbbell"]', false),
('Pull-Up', 'Back', '["bodyweight"]', true),
('Lat Pulldown', 'Back', '["cable", "machine"]', false),
('Seated Cable Row', 'Back', '["cable"]', false),
('T-Bar Row', 'Back', '["barbell"]', false),
('Face Pull', 'Back', '["cable"]', false),
('Rear Delt Fly', 'Back', '["dumbbell"]', false),

-- Shoulders
('Barbell Overhead Press', 'Shoulders', '["barbell"]', true),
('Dumbbell Shoulder Press', 'Shoulders', '["dumbbell"]', false),
('Lateral Raise', 'Shoulders', '["dumbbell"]', false),
('Cable Lateral Raise', 'Shoulders', '["cable"]', false),
('Arnold Press', 'Shoulders', '["dumbbell"]', false),
('Machine Shoulder Press', 'Shoulders', '["machine"]', false),

-- Biceps
('Barbell Curl', 'Biceps', '["barbell"]', false),
('Dumbbell Curl', 'Biceps', '["dumbbell"]', false),
('Hammer Curl', 'Biceps', '["dumbbell"]', false),
('Cable Curl', 'Biceps', '["cable"]', false),
('Preacher Curl', 'Biceps', '["barbell", "machine"]', false),
('Incline Dumbbell Curl', 'Biceps', '["dumbbell"]', false),

-- Triceps
('Close-Grip Bench Press', 'Triceps', '["barbell"]', false),
('Tricep Pushdown', 'Triceps', '["cable"]', false),
('Overhead Tricep Extension', 'Triceps', '["cable", "dumbbell"]', false),
('Skull Crusher', 'Triceps', '["barbell"]', false),
('Diamond Push-Up', 'Triceps', '["bodyweight"]', false),
('Dip Machine', 'Triceps', '["machine"]', false),

-- Legs
('Barbell Back Squat', 'Legs', '["barbell"]', true),
('Leg Press', 'Legs', '["machine"]', false),
('Romanian Deadlift', 'Legs', '["barbell"]', false),
('Leg Extension', 'Legs', '["machine"]', false),
('Leg Curl', 'Legs', '["machine"]', false),
('Dumbbell Lunge', 'Legs', '["dumbbell"]', false),
('Goblet Squat', 'Legs', '["dumbbell"]', false),
('Bulgarian Split Squat', 'Legs', '["dumbbell"]', false),
('Calf Raise', 'Legs', '["machine", "barbell"]', false),
('Hack Squat', 'Legs', '["machine"]', false),

-- Glutes
('Hip Thrust', 'Glutes', '["barbell"]', false),
('Cable Kickback', 'Glutes', '["cable"]', false),
('Glute Bridge', 'Glutes', '["bodyweight"]', false),

-- Core
('Plank', 'Core', '["bodyweight"]', false),
('Cable Crunch', 'Core', '["cable"]', false),
('Ab Wheel Rollout', 'Core', '["bodyweight"]', false),
('Russian Twist', 'Core', '["dumbbell"]', false),
('Hanging Leg Raise', 'Core', '["bodyweight"]', false),

-- Remaining Compounds
('Deadlift', 'Back', '["barbell"]', true),
('Power Clean', 'Back', '["barbell"]', true)
ON CONFLICT (name) DO NOTHING;
