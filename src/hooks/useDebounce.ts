import { useEffect, useState } from 'react';

// Delays reflecting `value` until it's been stable for `delayMs` — used to
// turn a search input into a debounced value for a data-fetch effect's
// dependency array, so typing doesn't fire a request per keystroke.
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
