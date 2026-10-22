/**
 * @typedef {Object} BusyBlock
 * @property {string} day - 'monday'|'tuesday'|...'sunday'
 * @property {string} start - 'HH:MM' 24h format
 * @property {string} end - 'HH:MM' 24h format
 */

/**
 * @typedef {Object} ScheduleInput
 * @property {BusyBlock[]} busyTimes
 * @property {string} gymOpenTime - 'HH:MM'
 * @property {string} gymCloseTime - 'HH:MM'
 * @property {number} preferredFrequency - workouts per week
 * @property {'morning'|'evening'} goalPriority
 */

/**
 * Finds available slots based on constraints.
 * @param {ScheduleInput} scheduleInput 
 * @returns {Promise<string[]>}
 */
const findAvailableSlots = async (scheduleInput) => {
  const { busyTimes = [], preferredFrequency = 4, goalPriority = 'morning' } = scheduleInput;
  // Gym hours are optional (user may train at several gyms): assume a wide window when omitted
  const gymOpenTime = scheduleInput.gymOpenTime || '05:00';
  const gymCloseTime = scheduleInput.gymCloseTime || '23:00';
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const slots = [];
  // Start from tomorrow's local date at midnight (UTC date string)
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // local midnight today

  for (let i = 0; i < 7; i++) {
    const dayName = daysOfWeek[currentDate.getDay()];
    const dayBusyBlocks = busyTimes.filter(b => b.day.toLowerCase() === dayName);

    // Convert times to minutes for easier math
    const openMinutes = timeToMinutes(gymOpenTime);
    const closeMinutes = timeToMinutes(gymCloseTime);

    let availableWindows = [{ start: openMinutes, end: closeMinutes }];

    // Subtract busy blocks
    for (const block of dayBusyBlocks) {
      const blockStart = timeToMinutes(block.start);
      const blockEnd = timeToMinutes(block.end);

      const newWindows = [];
      for (const window of availableWindows) {
        if (blockEnd <= window.start || blockStart >= window.end) {
          newWindows.push(window);
        } else {
          if (blockStart > window.start) newWindows.push({ start: window.start, end: blockStart });
          if (blockEnd < window.end) newWindows.push({ start: blockEnd, end: window.end });
        }
      }
      availableWindows = newWindows;
    }

    // Filter windows >= 60 minutes
    const validWindows = availableWindows.filter(w => (w.end - w.start) >= 60);

    if (validWindows.length > 0) {
      let bestWindow;
      if (goalPriority === 'morning') {
        bestWindow = validWindows.reduce((prev, curr) => prev.start < curr.start ? prev : curr);
      } else {
        bestWindow = validWindows.reduce((prev, curr) => prev.start > curr.start ? prev : curr);
      }

      // Build slot as local date + local time (avoids UTC midnight shift)
      const slotDate = new Date(currentDate);
      slotDate.setHours(Math.floor(bestWindow.start / 60), bestWindow.start % 60, 0, 0);
      slots.push({ date: slotDate, score: goalPriority === 'morning' ? -bestWindow.start : bestWindow.start });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const selectedSlots = slots
    .sort((a, b) => a.score - b.score)
    .slice(0, preferredFrequency)
    .sort((a, b) => a.date - b.date)
    .map(s => s.date.toISOString());

  return selectedSlots;
};

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

module.exports = {
  findAvailableSlots
};
