import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cn } from '../src/utils/cn.js';
import { workoutName, formatDuration, formatClock, calculateBmi, GOAL_LABELS, LEVEL_LABELS } from '../src/utils/labels.js';
import { groupExercises, findNextSet, hasValue } from '../src/utils/workoutSets.js';

describe('frontend/src/utils/cn (shadcn class merger)', () => {
  it('merges conditional classes and resolves Tailwind conflicts', () => {
    assert.equal(cn('px-4 py-2', false && 'hidden', 'px-6'), 'py-2 px-6');
  });
});

describe('frontend/src/utils/labels', () => {
  it('workoutName prefers custom template name over split_type', () => {
    assert.equal(workoutName({ name: 'Heavy Push', split_type: 'PPL_PUSH' }), 'Heavy Push');
    assert.equal(workoutName({ name: '   ', split_type: 'PPL_PULL' }), 'Pull Day');
    assert.equal(workoutName({ split_type: 'PPL_LEGS' }), 'Leg Day');
    assert.equal(workoutName({ split_type: 'UPPER' }), 'Upper Body');
    assert.equal(workoutName({}), 'Workout');
  });

  it('formatClock formats elapsed seconds into M:SS or H:MM:SS', () => {
    assert.equal(formatClock(0), '0:00');
    assert.equal(formatClock(65), '1:05');
    assert.equal(formatClock(3661), '1:01:01');
  });

  it('formatDuration formats start and end timestamps into minutes or hours+minutes', () => {
    assert.equal(formatDuration(null, null), null);
    assert.equal(formatDuration('2026-10-23T10:00:00Z', '2026-10-23T10:45:00Z'), '45m');
    assert.equal(formatDuration('2026-10-23T10:00:00Z', '2026-10-23T11:15:00Z'), '1h 15m');
  });

  it('exports human-readable goal and experience level labels', () => {
    assert.equal(GOAL_LABELS.hypertrophy, 'Hypertrophy');
    assert.equal(LEVEL_LABELS.intermediate, 'Intermediate');
  });

  it('calculateBmi computes BMI and classifies Underweight, Normal, and Overweight', () => {
    assert.equal(calculateBmi(null, 70), null);
    assert.equal(calculateBmi(175, 0), null);
    assert.deepEqual(calculateBmi(180, 55), { bmi: 17, category: 'Underweight', variant: 'warning' });
    assert.deepEqual(calculateBmi(175, 70), { bmi: 22.9, category: 'Normal', variant: 'success' });
    assert.deepEqual(calculateBmi(175, 85), { bmi: 27.8, category: 'Overweight', variant: 'warning' });
  });
});

describe('frontend/src/utils/workoutSets', () => {
  const sampleSets = [
    { id: 's2', exercise_id: 10, exercise_name: 'Bench Press', muscle_group: 'Chest', set_type: 'working', set_number: 2, completed: false },
    { id: 's1', exercise_id: 10, exercise_name: 'Bench Press', muscle_group: 'Chest', set_type: 'working', set_number: 1, completed: true },
    { id: 'w1', exercise_id: 10, exercise_name: 'Bench Press', muscle_group: 'Chest', set_type: 'warmup', set_number: 1, completed: true },
    { id: 's3', exercise_id: 20, exercise_name: 'Incline Press', muscle_group: 'Chest', set_type: 'working', set_number: 1, completed: false },
  ];

  it('groupExercises groups sets by exercise_id and sorts warmups before working sets', () => {
    const grouped = groupExercises(sampleSets);
    assert.equal(grouped.length, 2);
    assert.equal(grouped[0].exercise_id, 10);
    assert.deepEqual(grouped[0].sets.map((s) => s.id), ['w1', 's1', 's2']);
    assert.equal(grouped[1].exercise_id, 20);
  });

  it('findNextSet locates the first incomplete set in workout order', () => {
    const next = findNextSet(sampleSets);
    assert.equal(next.exercise.exercise_id, 10);
    assert.equal(next.set.id, 's2');

    const allDone = sampleSets.map((s) => ({ ...s, completed: true }));
    assert.equal(findNextSet(allDone), null);
  });

  it('hasValue treats null, empty string, and 0 as empty so ghost text stays visible', () => {
    assert.equal(hasValue(null), false);
    assert.equal(hasValue(undefined), false);
    assert.equal(hasValue(''), false);
    assert.equal(hasValue(0), false);
    assert.equal(hasValue('0'), false);
    assert.equal(hasValue(60), true);
    assert.equal(hasValue('82.5'), true);
  });
});
