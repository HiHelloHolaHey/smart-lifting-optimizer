jest.mock('../src/models/exerciseModel');

const exerciseModel = require('../src/models/exerciseModel');
const { findAlternatives } = require('../src/services/swapService');

describe('swapService.findAlternatives', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws when original exercise does not exist', async () => {
    exerciseModel.findById.mockResolvedValue(null);
    await expect(findAlternatives(9999)).rejects.toThrow('Exercise not found');
  });

  test('scores alternatives by single-equipment simplicity (+2) and compound match (+1)', async () => {
    exerciseModel.findById.mockResolvedValue({
      id: 1,
      name: 'Barbell Bench Press',
      muscle_group: 'Chest',
      equipment_needed: ['barbell'],
      is_compound: true,
    });

    exerciseModel.findAlternatives.mockResolvedValue([
      { id: 2, name: 'Cable Chest Fly', muscle_group: 'Chest', equipment_needed: ['cable', 'machine'], is_compound: false }, // score 0
      { id: 3, name: 'Dumbbell Bench Press', muscle_group: 'Chest', equipment_needed: ['dumbbell'], is_compound: true }, // score 3 (+2 single eq, +1 compound)
      { id: 4, name: 'Push-Up', muscle_group: 'Chest', equipment_needed: ['bodyweight'], is_compound: false }, // score 2 (+2 single eq)
    ]);

    const res = await findAlternatives(1);
    expect(res.map((r) => r.id)).toEqual([3, 4, 2]);
    expect(res[0].score).toBe(3);
    expect(res[1].score).toBe(2);
    expect(res[2].score).toBe(0);
  });
});
