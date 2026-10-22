// End-to-end API test. Creates a fresh user each run (no reliance on seeded accounts).
// Usage: start the backend first (cd backend && npm run dev), then: npm run test:api
const BASE = process.env.API_BASE || 'http://localhost:3001/api';
let cookie = '';
let failures = 0;

const call = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const sc = res.headers.get('set-cookie');
  if (sc) cookie = sc.split(';')[0];
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
};
const check = (name, ok, extra = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${ok ? '' : extra}`);
};

const main = async () => {
  try {
    await fetch(BASE + '/health');
  } catch {
    console.error(`\nCannot reach the backend at ${BASE}.\nStart it first:  cd backend && npm run dev   (then re-run this test)\n`);
    process.exit(2);
  }

  const email = `apitest_${Date.now()}@example.com`;
  const password = 'TestPass123';
  let r;

  console.log('\n-- Auth & validation');
  r = await call('POST', '/auth/register', { email: 'not-an-email', password });
  check('register: invalid email rejected', r.status === 400 && r.body.field === 'email', JSON.stringify(r.body));
  r = await call('POST', '/auth/register', { email, password: 'short' });
  check('register: weak password explains requirements', r.status === 400 && r.body.field === 'password' && /8 characters/.test(r.body.error), JSON.stringify(r.body));
  r = await call('POST', '/auth/register', { email, password: 'onlyletters' });
  check('register: password needs a number', r.status === 400 && /number/.test(r.body.error));
  r = await call('POST', '/auth/register', { email, password });
  check('register: ok', r.status === 201 && r.body.user.onboarded === false, JSON.stringify(r.body));
  r = await call('GET', '/auth/me');
  check('me: returns full profile (email, onboarded flag)', r.status === 200 && r.body.user.email === email, JSON.stringify(r.body));
  cookie = '';
  r = await call('POST', '/auth/register', { email, password });
  check('register: duplicate email -> 409 EMAIL_TAKEN', r.status === 409 && r.body.code === 'EMAIL_TAKEN');
  r = await call('POST', '/auth/login', { email: `nobody_${Date.now()}@example.com`, password });
  check('login: unknown email -> USER_NOT_FOUND naming the email', r.status === 404 && r.body.code === 'USER_NOT_FOUND' && r.body.error.includes('nobody_'));
  r = await call('POST', '/auth/login', { email, password: 'WrongPass999' });
  check('login: wrong password -> WRONG_PASSWORD', r.status === 401 && r.body.code === 'WRONG_PASSWORD');
  r = await call('POST', '/auth/login', { email: email.toUpperCase(), password });
  check('login: ok (email case-insensitive)', r.status === 200);

  console.log('\n-- Onboarding & profile');
  const base = { experienceLevel: 'beginner', goal: 'strength', splitType: 'PPL' };
  r = await call('POST', '/onboarding', base);
  check('onboarding: name required', r.status === 400 && r.body.field === 'firstName');
  r = await call('POST', '/onboarding', { ...base, firstName: 'Tester', heightCm: 10, weightKg: 80 });
  check('onboarding: validates height', r.status === 400 && r.body.field === 'heightCm');
  r = await call('POST', '/onboarding', { ...base, firstName: 'Tester', heightCm: 181, weightKg: 82.5, schedule: { preferredFrequency: 4, goalPriority: 'morning' } });
  check('onboarding: ok WITHOUT gym hours (multi-gym users)', r.status === 201 && r.body.workouts.length >= 12, JSON.stringify(r.body).slice(0, 200));
  r = await call('POST', '/onboarding', { ...base, firstName: 'Tester', heightCm: 181, weightKg: 82.5 });
  check('onboarding: cannot run twice', r.status === 409);
  r = await call('GET', '/auth/me');
  check('profile saved by onboarding', r.body.user.first_name === 'Tester' && Number(r.body.user.height_cm) === 181 && r.body.user.goal === 'strength' && r.body.user.onboarded === true, JSON.stringify(r.body));
  r = await call('PUT', '/auth/profile', { firstName: 'Tess', weightKg: 80, goal: 'hypertrophy' });
  check('profile edit', r.status === 200 && r.body.user.first_name === 'Tess' && r.body.user.goal === 'hypertrophy');
  r = await call('PUT', '/auth/profile', { goal: 'bogus' });
  check('profile edit validates goal', r.status === 400);

  console.log('\n-- New users start empty');
  r = await call('GET', '/analytics/summary');
  check('summary has zero activity', r.status === 200 && r.body.week.completed === 0 && r.body.week.sets === 0 && r.body.week.volume === 0 && r.body.weekly_volume.length === 8 && r.body.weekly_volume.every((w) => w.volume === 0) && r.body.heatmap.length === 7 && r.body.heatmap.every((d) => d.level === 0), JSON.stringify(r.body).slice(0, 300));
  check('summary counts planned workouts', r.body.week.planned >= 0);
  r = await call('GET', '/analytics/profile-stats');
  check('profile stats empty', r.status === 200 && r.body.workouts === 0 && r.body.top_lifts.length === 0);

  console.log('\n-- Workout lifecycle');
  r = await call('GET', '/workouts');
  const planned = r.body.slice().sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  const [w1, w2] = planned;
  check('workouts listed with volume field', r.status === 200 && planned.length >= 12 && w1.volume !== undefined);
  r = await call('GET', `/workouts/${w1.id}`);
  const detail = r.body;
  const set = detail.sets[0];
  check('seeded sets have no fake 0kg default', detail.sets.every((s) => s.weight_kg === null));

  r = await call('PUT', `/workouts/${w1.id}/sets/${set.id}`, { weight_kg: 60, reps: 8, completed: true });
  check('cannot log a set before starting', r.status === 409 && r.body.code === 'NOT_STARTED');
  r = await call('POST', `/workouts/${w1.id}/start`);
  check('start workout', r.status === 200 && r.body.status === 'active' && r.body.started_at);
  r = await call('POST', `/workouts/${w2.id}/start`);
  check('only one workout in progress', r.status === 409 && r.body.code === 'ACTIVE_EXISTS');

  r = await call('PUT', `/workouts/${w1.id}/sets/${set.id}`, { weight_kg: 60, reps: 8, completed: true });
  check('log set', r.status === 200 && r.body.completed && r.body.completed_at);
  r = await call('PUT', `/workouts/${w1.id}/sets/${set.id}`, { weight_kg: 99, reps: 1 });
  check('completed set is locked against edits', r.status === 409 && r.body.code === 'SET_LOCKED');
  r = await call('PUT', `/workouts/${w1.id}/sets/${set.id}`, { weight_kg: 62.5, reps: 8, completed: false });
  check('un-tick allows editing', r.status === 200 && !r.body.completed && Number(r.body.weight_kg) === 62.5);
  r = await call('PUT', `/workouts/${w1.id}/sets/${set.id}`, { weight_kg: 62.5, reps: 8, completed: true });
  check('re-log set', r.status === 200 && r.body.completed);
  r = await call('PUT', `/workouts/${w1.id}/sets/${set.id}`, { 'completed = true; DROP TABLE users; --': 1 });
  check('unknown update keys ignored (SQL-injection safe)', r.status === 200 || r.status === 409);
  r = await call('PUT', `/workouts/${w1.id}/sets/${set.id}`, { set_type: 'bogus', completed: false });
  check('invalid set_type rejected', r.status === 400);

  r = await call('GET', '/exercises');
  const catalog = r.body;
  const inWorkout = new Set(detail.sets.map((s) => s.exercise_id));
  const extra = catalog.find((c) => !inWorkout.has(c.id));
  r = await call('POST', `/workouts/${w1.id}/exercises`, { exercise_id: extra.id, sets: 3, reps: 10, weight_kg: 20 });
  check('add exercise to workout', r.status === 201);
  r = await call('POST', `/workouts/${w1.id}/exercises`, { exercise_id: extra.id });
  check('adding duplicate exercise rejected', r.status === 409);
  r = await call('GET', `/workouts/${w1.id}`);
  check('added exercise has 3 sets with default weight', r.body.sets.filter((s) => s.exercise_id === extra.id).length === 3 && r.body.sets.filter((s) => s.exercise_id === extra.id).every((s) => Number(s.weight_kg) === 20));
  r = await call('DELETE', `/workouts/${w1.id}/exercises/${extra.id}`);
  check('remove exercise', r.status === 200);
  r = await call('GET', `/workouts/${w1.id}`);
  check('removed exercise gone', !r.body.sets.some((s) => s.exercise_id === extra.id));

  // Swap: target an exercise that has no completed sets
  const target = detail.sets.find((s) => s.exercise_id !== set.exercise_id).exercise_id;
  const alt = catalog.find((c) => !inWorkout.has(c.id) && c.id !== target);
  r = await call('PUT', `/workouts/${w1.id}/exercises/${target}/swap`, { new_exercise_id: alt.id });
  check('swap exercise reports updated sets', r.status === 200 && r.body.updated_sets === 3, JSON.stringify(r.body));
  r = await call('GET', `/workouts/${w1.id}`);
  check('swap persisted in workout detail', r.body.sets.filter((s) => s.exercise_id === alt.id).length === 3 && !r.body.sets.some((s) => s.exercise_id === target));

  r = await call('PUT', `/workouts/${w1.id}/exercises/${set.exercise_id}/notes`, { notes: 'Left knee feels fine' });
  check('save notes', r.status === 200);
  r = await call('GET', `/workouts/${w1.id}`);
  check('notes round-trip', r.body.notes_by_exercise[set.exercise_id] === 'Left knee feels fine');
  r = await call('POST', `/workouts/${w1.id}/sets`, { exercise_id: set.exercise_id, set_type: 'warmup' });
  check('add warm-up set', r.status === 201 && r.body.set_type === 'warmup');

  r = await call('PUT', `/workouts/${w1.id}/status`, { status: 'completed' });
  check('status endpoint cannot bypass lifecycle', r.status === 400);

  r = await call('POST', `/workouts/${w1.id}/discard`);
  check('discard workout', r.status === 200);
  r = await call('GET', `/workouts/${w1.id}`);
  check('discard resets status and sets', r.body.status === 'scheduled' && !r.body.started_at && r.body.sets.every((s) => !s.completed));

  r = await call('POST', `/workouts/${w1.id}/start`);
  const s2 = (await call('GET', `/workouts/${w1.id}`)).body.sets.find((s) => s.set_type === 'working');
  r = await call('PUT', `/workouts/${w1.id}/sets/${s2.id}`, { weight_kg: 60, reps: 8, completed: true });
  check('log after restart', r.status === 200);
  r = await call('POST', `/workouts/${w1.id}/finish`);
  check('finish workout', r.status === 200 && r.body.status === 'completed' && r.body.ended_at);
  r = await call('POST', `/workouts/${w1.id}/exercises`, { exercise_id: extra.id });
  check('completed workout cannot be edited', r.status === 409);

  console.log('\n-- History, previous performance & stats');
  r = await call('GET', `/workouts/${w2.id}`);
  const same = r.body.sets.find((s) => s.exercise_id === s2.exercise_id);
  check('previous performance available in next workout', r.body.previous.some((p) => p.exercise_id === s2.exercise_id && Number(p.weight_kg) === 60 && p.reps === 8));
  r = await call('GET', '/workouts');
  const done = r.body.find((w) => w.id === w1.id);
  check('history entry has volume + duration fields', done.status === 'completed' && done.volume === 480 && done.started_at && done.ended_at, JSON.stringify(done));
  r = await call('GET', '/analytics/profile-stats');
  check('profile stats reflect completed workout', r.body.workouts === 1 && r.body.sets === 1 && r.body.volume === 480 && r.body.top_lifts.length === 1 && r.body.streak_weeks >= 1, JSON.stringify(r.body));
  r = await call('GET', '/analytics/summary');
  check('summary reflects activity', r.body.week.sets === 1 || r.body.weekly_volume.some((w) => w.volume === 480), JSON.stringify(r.body.week));
  r = await call('GET', '/analytics/recovery');
  check('recovery map data', r.status === 200 && r.body.length === 8 && r.body.some((m) => m.sets > 0));

  console.log('\n-- Templates, AI fallbacks, export');
  const tplEx = [{ exercise_id: catalog[0].id, sets: 2, rep_min: 8, rep_max: 10, weight_kg: 42.5 }];
  r = await call('POST', '/templates', { name: 'Weighted', exercises: tplEx });
  check('template saves default weight', r.status === 201 && r.body.exercise_order_json[0].weight_kg === 42.5, JSON.stringify(r.body));
  const tplId = r.body.id;
  r = await call('POST', `/templates/${tplId}/start`);
  const tw = r.body.workout_id;
  r = await call('GET', `/workouts/${tw}`);
  check('template workout is named and uses default weight', r.body.name === 'Weighted' && r.body.sets.every((s) => Number(s.weight_kg) === 42.5), JSON.stringify(r.body.sets[0]));
  await call('DELETE', `/templates/${tplId}`);
  r = await call('POST', '/ai/pre-workout-brief', { workout_id: w2.id });
  check('pre-workout brief', r.status === 200 && typeof r.body.brief === 'string', `source=${r.body.source}`);
  r = await call('POST', '/ai/smart-swap', { exercise_id: set.exercise_id, reason: 'lower back pain' });
  check('smart swap', r.status === 200 && r.body.alternatives.length > 0, `source=${r.body.source}`);
  r = await call('POST', '/ai/generate-routine', { prompt: 'dumbbells only, 45 minutes' });
  check('generate routine', r.status === 200 && r.body.exercises.length > 0, `source=${r.body.source}`);
  r = await call('GET', '/schedule/export');
  check('ics export', r.status === 200 && String(r.body).startsWith('BEGIN:VCALENDAR'));

  console.log('\n-- Session');
  cookie = '';
  r = await call('GET', '/auth/me');
  check('me requires auth', r.status === 401);
  r = await call('POST', '/ai/smart-swap', { exercise_id: 1 });
  check('AI routes require auth', r.status === 401);

  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
  process.exit(failures ? 1 : 0);
};

main();
