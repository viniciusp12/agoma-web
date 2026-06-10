import { useState, useEffect } from 'react';
import { fetchPlaceDetails } from '../services/googlePlaces';
import type { PlaceDetails } from '../types';

interface UseReviewsReturn {
  data: PlaceDetails | null;
  loading: boolean;
  error: string | null;
}

export function useReviews(): UseReviewsReturn {
  const [data, setData] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaceDetails()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
