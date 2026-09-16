import { useEffect, useState } from 'react';

/** Horodatage rafraîchi périodiquement, pour les dates relatives (« il y a 2 min »). */
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
