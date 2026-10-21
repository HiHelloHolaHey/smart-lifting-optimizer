// Phase 2 API test. Requires backend running on :3001 and the smoketest user (run smoketest.js once).
const BASE = 'http://localhost:3001/api';
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
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
};

(async () => {
  let r = await call('POST', '/auth/login', { email: 'smoketest@smartlift.dev', password: 'SmokeTest1!' });
  check('login', r.status === 200);

  r = await call('GET', '/workouts');
  const workout = r.body[0];
  check('list workouts', r.status === 200 && workout, `count=${r.body.length}`);

  r = await call('GET', `/workouts/${workout.id}`);
  check('workout detail + previous + notes', r.status === 200 && Array.isArray(r.body.previous) && r.body.notes_by_exercise, `sets=${r.body.sets.length}`);
  const set = r.body.sets[0];

  r = await call('PUT', `/workouts/${workout.id}/sets/${set.id}`, { weight_kg: 60, reps: 8, completed: true });
  check('complete set sets completed_at', r.status === 200 && r.body.completed && r.body.completed_at);

  r = await call('PUT', `/workouts/${workout.id}/sets/${set.id}`, { 'completed = true; DROP TABLE users; --': 1 });
  check('set update ignores unknown keys', r.status === 200);

  r = await call('PUT', `/workouts/${workout.id}/sets/${set.id}`, { set_type: 'bogus' });
  check('invalid set_type rejected', r.status === 400);

  r = await call('POST', `/workouts/${workout.id}/sets`, { exercise_id: set.exercise_id, set_type: 'warmup' });
  check('add warmup set', r.status === 201 && r.body.set_type === 'warmup');

  r = await call('PUT', `/workouts/${workout.id}/exercises/${set.exercise_id}/notes`, { notes: 'Left knee feels fine' });
  check('save exercise notes', r.status === 200 && r.body.exercise_notes === 'Left knee feels fine');
  r = await call('GET', `/workouts/${workout.id}`);
  check('notes round-trip', r.body.notes_by_exercise[set.exercise_id] === 'Left knee feels fine');

  r = await call('GET', `/workouts/next/${set.exercise_id}`);
  check('overload suggestion', r.status === 200 && r.body.suggested_weight_kg !== undefined, `source=${r.body.source}`);

  r = await call('POST', '/ai/pre-workout-brief', { workout_id: workout.id });
  check('pre-workout-brief', r.status === 200 && typeof r.body.brief === 'string', `source=${r.body.source}`);
  r = await call('POST', '/ai/pre-workout-brief', {});
  check('brief validates input', r.status === 400);

  r = await call('POST', '/ai/smart-swap', { exercise_id: set.exercise_id, reason: 'lower back pain' });
  check('smart-swap', r.status === 200 && r.body.alternatives.length > 0, `source=${r.body.source} n=${r.body.alternatives.length}`);
  const alt = r.body.alternatives[0];

  // Real swap in a workout: use the freshly started template workout so history isn't touched
  const probe = (await call('POST', '/templates', { name: 'Swap probe', exercises: [{ exercise_id: set.exercise_id, sets: 2, rep_min: 8, rep_max: 10 }] })).body;
  const started = (await call('POST', `/templates/${probe.id}/start`)).body.workout_id;
  r = await call('PUT', `/workouts/${started}/exercises/${set.exercise_id}/swap`, { new_exercise_id: alt.id });
  check('swap exercise in workout', r.status === 200 && r.body.updated_sets === 2, JSON.stringify(r.body));
  r = await call('GET', `/workouts/${started}`);
  check('swap persisted', r.body.sets.every((s) => s.exercise_id === alt.id));
  r = await call('PUT', `/workouts/${started}/exercises/${set.exercise_id}/swap`, {});
  check('swap validates input', r.status === 400);
  await call('DELETE', `/templates/${probe.id}`);

  r = await call('POST', '/ai/generate-routine', { prompt: 'I only have dumbbells and 45 minutes' });
  check('generate-routine', r.status === 200 && r.body.exercises.length > 0, `source=${r.body.source} n=${r.body.exercises.length}`);
  const routine = r.body;

  r = await call('POST', '/templates', { name: 'Test Push', exercises: routine.exercises });
  check('create template', r.status === 201);
  const tplId = r.body.id;
  r = await call('GET', '/templates');
  check('list templates with names', r.status === 200 && r.body.some((t) => t.id === tplId && t.exercise_order_json[0].name));
  r = await call('POST', `/templates/${tplId}/start`);
  check('start template -> workout', r.status === 201 && r.body.workout_id);
  r = await call('DELETE', `/templates/${tplId}`);
  check('delete template', r.status === 200);

  r = await call('GET', '/exercises');
  check('exercise catalog', r.status === 200 && r.body.length > 40, `n=${r.body.length}`);
  r = await call('GET', '/analytics/recovery');
  check('recovery map data', r.status === 200 && r.body.length === 8, JSON.stringify(r.body.find((m) => m.sets > 0) || {}));
  r = await call('GET', '/analytics/volume');
  check('monthly volume', r.status === 200 && Array.isArray(r.body));

  r = await call('GET', '/schedule/export');
  check('ics export', r.status === 200 && String(r.headers.get('content-type')).includes('text/calendar') && r.body.startsWith('BEGIN:VCALENDAR'));

  r = await call('PUT', `/workouts/${workout.id}/status`, { status: 'nonsense' });
  check('status validation', r.status === 400);

  cookie = '';
  r = await call('POST', '/ai/smart-swap', { exercise_id: 1 });
  check('AI routes require auth', r.status === 401);

  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
  process.exit(failures ? 1 : 0);
})();
