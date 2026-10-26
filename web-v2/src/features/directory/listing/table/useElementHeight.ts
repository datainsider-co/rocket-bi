import { useCallback, useState } from 'react';

/** Height of the element given the returned ref, kept up to date with a ResizeObserver. 0 until measured. */
export function useElementHeight<T extends HTMLElement>() {
  const [height, setHeight] = useState(0);

  const ref = useCallback((element: T | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, height };
}
