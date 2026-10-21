import client from './client';

export const auth = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  logout: () => client.post('/auth/logout'),
  getMe: () => client.get('/auth/me'),
};

export const onboarding = {
  onboard: (data) => client.post('/onboarding', data),
};

export const schedule = {
  generate: (data) => client.post('/schedule/generate', data),
};

export const workouts = {
  getAll: () => client.get('/workouts'),
  getById: (id) => client.get(`/workouts/${id}`),
  updateSet: (workoutId, setId, data) => client.put(`/workouts/${workoutId}/sets/${setId}`, data),
  getNextForExercise: (exerciseId) => client.get(`/workouts/next/${exerciseId}`),
  addSet: (workoutId, data) => client.post(`/workouts/${workoutId}/sets`, data),
  updateStatus: (workoutId, status) => client.put(`/workouts/${workoutId}/status`, { status }),
  swapExercise: (workoutId, exerciseId, newExerciseId) => client.put(`/workouts/${workoutId}/exercises/${exerciseId}/swap`, { new_exercise_id: newExerciseId }),
  saveNotes: (workoutId, exerciseId, notes) => client.put(`/workouts/${workoutId}/exercises/${exerciseId}/notes`, { notes }),
};

export const exercises = {
  swap: (exerciseId) => client.get(`/exercises/${exerciseId}/alternatives`),
};

export const exerciseCatalog = {
  list: () => client.get('/exercises'),
};

export const ai = {
  preWorkoutBrief: (workoutId) => client.post('/ai/pre-workout-brief', { workout_id: workoutId }),
  smartSwap: (exerciseId, reason) => client.post('/ai/smart-swap', { exercise_id: exerciseId, reason }),
  generateRoutine: (prompt) => client.post('/ai/generate-routine', { prompt }),
};

export const templates = {
  list: () => client.get('/templates'),
  create: (data) => client.post('/templates', data),
  update: (id, data) => client.put(`/templates/${id}`, data),
  remove: (id) => client.delete(`/templates/${id}`),
  start: (id) => client.post(`/templates/${id}/start`),
};

export const analytics = {
  recovery: () => client.get('/analytics/recovery'),
  volume: () => client.get('/analytics/volume'),
};