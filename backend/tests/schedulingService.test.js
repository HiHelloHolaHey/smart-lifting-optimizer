const { findAvailableSlots } = require('../src/services/schedulingService');

describe('schedulingService.findAvailableSlots', () => {
  test('returns preferredFrequency ISO slots defaulting to wide hours when gymOpenTime/gymCloseTime are omitted', async () => {
    const slots = await findAvailableSlots({
      busyTimes: [],
      preferredFrequency: 4,
      goalPriority: 'morning',
    });

    expect(Array.isArray(slots)).toBe(true);
    expect(slots).toHaveLength(4);
    slots.forEach((iso) => {
      const d = new Date(iso);
      expect(Number.isNaN(d.getTime())).toBe(false);
      // Morning priority with default 05:00 open should schedule at 05:00 local time
      expect(d.getHours()).toBe(5);
      expect(d.getMinutes()).toBe(0);
    });
  });

  test('respects custom gymOpenTime and morning vs evening goalPriority', async () => {
    const morningSlots = await findAvailableSlots({
      gymOpenTime: '07:30',
      gymCloseTime: '21:00',
      busyTimes: [],
      preferredFrequency: 3,
      goalPriority: 'morning',
    });

    expect(morningSlots).toHaveLength(3);
    const firstMorning = new Date(morningSlots[0]);
    expect(firstMorning.getHours()).toBe(7);
    expect(firstMorning.getMinutes()).toBe(30);

    // When morning is blocked on all days from 07:30 to 18:00, evening priority picks the 18:00 window
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const busyMorning = days.map((day) => ({ day, start: '07:30', end: '18:00' }));

    const eveningSlots = await findAvailableSlots({
      gymOpenTime: '07:30',
      gymCloseTime: '21:00',
      busyTimes: busyMorning,
      preferredFrequency: 2,
      goalPriority: 'evening',
    });

    expect(eveningSlots).toHaveLength(2);
    const firstEvening = new Date(eveningSlots[0]);
    expect(firstEvening.getHours()).toBe(18);
    expect(firstEvening.getMinutes()).toBe(0);
  });

  test('subtracts busy blocks and skips days with fewer than 60 contiguous free minutes', async () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    // Block almost the entire day except a 30-minute window on 5 days, leaving only 2 valid days
    const todayIdx = new Date().getDay();
    const blockedDays = days.filter((_, idx) => idx !== todayIdx && idx !== (todayIdx + 1) % 7);
    const busyTimes = blockedDays.map((day) => ({ day, start: '06:00', end: '21:40' }));

    const slots = await findAvailableSlots({
      gymOpenTime: '06:00',
      gymCloseTime: '22:00',
      busyTimes,
      preferredFrequency: 5,
      goalPriority: 'morning',
    });

    expect(slots).toHaveLength(2);
    // Returned slots must be sorted chronologically
    expect(new Date(slots[0]).getTime()).toBeLessThan(new Date(slots[1]).getTime());
  });
});
