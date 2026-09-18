import { useState, useEffect } from 'react';
import { workouts } from '../api/endpoints';

export const useProgressOverload = (exerciseId) => {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!exerciseId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchSuggestion = async () => {
      try {
        setLoading(true);
        const { data } = await workouts.getNextForExercise(exerciseId);
        if (isMounted) {
          setSuggestion(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setSuggestion(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSuggestion();

    return () => {
      isMounted = false;
    };
  }, [exerciseId]);

  return { suggestion, loading, error };
};
