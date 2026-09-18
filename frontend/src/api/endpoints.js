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
};

export const exercises = {
  swap: (exerciseId) => client.get(`/exercises/${exerciseId}/alternatives`),
};
