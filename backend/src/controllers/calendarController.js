const db = require('../config/db');

const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s) => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

/**
 * Builds an RFC 5545 calendar for the user's upcoming scheduled workouts.
 * @param {Array<{id:string, scheduled_date:Date, split_type:string}>} workouts
 */
const buildIcs = (workouts) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart Lifting Optimizer//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Smart Lifting Workouts',
  ];
  workouts.forEach((w) => {
    const start = new Date(w.scheduled_date);
    const end = new Date(start.getTime() + 60 * 60000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${w.id}@smart-lifting-optimizer`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${esc(`Workout - ${w.split_type.replace('_', ' ')}`)}`,
      `DESCRIPTION:${esc('Planned by Smart Lifting Optimizer')}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Workout starts soon',
      'END:VALARM',
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
};

const exportIcs = async (req, res, next) => {
  try {
    const workouts = await db.any(
      `SELECT id, scheduled_date, split_type FROM workouts
       WHERE user_id = $1 AND status IN ('scheduled','active') AND scheduled_date >= NOW() - INTERVAL '1 day'
       ORDER BY scheduled_date`,
      [req.user.id]
    );
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="workouts.ics"');
    res.send(buildIcs(workouts));
  } catch (error) {
    next(error);
  }
};

module.exports = { exportIcs, buildIcs };
