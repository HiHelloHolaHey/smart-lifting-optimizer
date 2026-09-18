import React, { createContext, useContext, useState, useCallback } from 'react';
import { workouts as workoutsApi } from '../api/endpoints';

const WorkoutContext = createContext(null);

export const WorkoutProvider = ({ children }) => {
  const [workouts, setWorkouts] = useState([]);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await workoutsApi.getAll();
      setWorkouts(data.workouts || data);
    } catch (err) {
      console.error('Failed to fetch workouts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkout = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await workoutsApi.getById(id);
      setCurrentWorkout(data.workout || data);
    } catch (err) {
      console.error('Failed to fetch workout', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const logSet = async (workoutId, setId, setData) => {
    try {
      const { data } = await workoutsApi.updateSet(workoutId, setId, setData);
      // Optionally update currentWorkout locally or re-fetch
      await fetchWorkout(workoutId);
      return data;
    } catch (err) {
      console.error('Failed to log set', err);
      throw err;
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        currentWorkout,
        loading,
        fetchWorkouts,
        fetchWorkout,
        logSet,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
