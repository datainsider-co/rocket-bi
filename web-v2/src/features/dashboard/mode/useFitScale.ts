import { useLayoutEffect, useRef, useState } from 'react';
import { fitScale } from './dashboardMode.utils';

/** The scale that fits the content into the viewport's height while `enabled` (TV mode); 1 otherwise. */
export function useFitScale(enabled: boolean) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!enabled || !viewport || !content) {
      setScale(1);
      return;
    }
    // A transform doesn't change offsetHeight, so the content is measured unscaled.
    const measure = () => setScale(fitScale(content.offsetHeight, viewport.clientHeight));
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    measure();
    return () => observer.disconnect();
  }, [enabled]);

  return { viewportRef, contentRef, scale };
}
