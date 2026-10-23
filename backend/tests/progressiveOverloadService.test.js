jest.mock('../src/models/workoutSetModel');
jest.mock('../src/models/onermModel');
jest.mock('../src/services/llmService');

const workoutSetModel = require('../src/models/workoutSetModel');
const onermModel = require('../src/models/onermModel');
const llm = require('../src/services/llmService');
const { calculateDeterministic, calculateNextSession } = require('../src/services/progressiveOverloadService');

describe('progressiveOverloadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    llm.isConfigured.mockReturnValue(false);
  });

  test('returns 60% of 1RM rounded to nearest 2.5kg when user has no history for the exercise', async () => {
    workoutSetModel.getLastNSessionsForExercise.mockResolvedValue([]);
    onermModel.findByUser.mockResolvedValue([{ exercise_id: 1, estimated_1rm_kg: 100 }]);

    const res = await calculateDeterministic('user-1', 1);
    expect(res).toEqual({
      suggested_weight_kg: 60,
      suggested_reps: 8,
      increment_reason: 'Baseline suggestion based on 1RM or defaults.',
      ready_for_progression: true,
    });
  });

  test('defaults to 20kg empty bar when no history and no 1RM exist', async () => {
    workoutSetModel.getLastNSessionsForExercise.mockResolvedValue([]);
    onermModel.findByUser.mockResolvedValue([]);

    const res = await calculateDeterministic('user-1', 99);
    expect(res.suggested_weight_kg).toBe(20);
    expect(res.suggested_reps).toBe(8);
  });

  test('increases weight by 2.5% (rounded to 0.5kg) when all sets in last session met target reps', async () => {
    workoutSetModel.getLastNSessionsForExercise.mockResolvedValue([
      { workout_id: 'w2', scheduled_date: '2026-10-20T10:00:00Z', weight_kg: 80, reps: 8, completed: true },
      { workout_id: 'w2', scheduled_date: '2026-10-20T10:00:00Z', weight_kg: 80, reps: 8, completed: true },
      { workout_id: 'w1', scheduled_date: '2026-10-13T10:00:00Z', weight_kg: 80, reps: 8, completed: true },
    ]);

    const res = await calculateDeterministic('user-1', 1);
    expect(res.suggested_weight_kg).toBe(82); // 80 * 1.025 = 82.0
    expect(res.suggested_reps).toBe(8);
    expect(res.ready_for_progression).toBe(true);
  });

  test('keeps weight and adds +1 rep when weight was already increased in the most recent session', async () => {
    workoutSetModel.getLastNSessionsForExercise.mockResolvedValue([
      { workout_id: 'w2', scheduled_date: '2026-10-20T10:00:00Z', weight_kg: 82.5, reps: 8, completed: true },
      { workout_id: 'w1', scheduled_date: '2026-10-13T10:00:00Z', weight_kg: 80, reps: 8, completed: true },
    ]);

    const res = await calculateDeterministic('user-1', 1);
    expect(res.suggested_weight_kg).toBe(82.5);
    expect(res.suggested_reps).toBe(9);
    expect(res.ready_for_progression).toBe(true);
  });

  test('maintains current weight and reps when not all sets were completed', async () => {
    workoutSetModel.getLastNSessionsForExercise.mockResolvedValue([
      { workout_id: 'w2', scheduled_date: '2026-10-20T10:00:00Z', weight_kg: 80, reps: 8, completed: true },
      { workout_id: 'w2', scheduled_date: '2026-10-20T10:00:00Z', weight_kg: 80, reps: 6, completed: false },
    ]);

    const res = await calculateDeterministic('user-1', 1);
    expect(res.suggested_weight_kg).toBe(80);
    expect(res.ready_for_progression).toBe(false);
  });

  test('calculateNextSession falls back cleanly to rules when AI returns out-of-bounds weight', async () => {
    llm.isConfigured.mockReturnValue(true);
    workoutSetModel.getLastNSessionsForExercise.mockResolvedValue([
      { workout_id: 'w2', scheduled_date: '2026-10-20T10:00:00Z', weight_kg: 80, reps: 8, completed: true, set_type: 'working' },
    ]);
    llm.generateJson.mockResolvedValue({
      suggested_weight_kg: 150, // way outside +/-5%
      suggested_reps: 8,
      increment_reason: 'Unrealistic jump',
    });

    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await calculateNextSession('user-1', 1);
    expect(res.source).toBe('rules');
    expect(res.suggested_weight_kg).toBe(82);
    spy.mockRestore();
  });
});
