import { useEffect, useState, type RefObject } from 'react';
import { isScrolledPast } from './dashboardDetail.utils';

/** Whether the element has been scrolled down (v1 `onScrollDashboard`: past 1% of its way). */
export function useScrolled(ref: RefObject<HTMLElement | null>): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setScrolled(isScrolledPast(element.scrollTop, element.scrollHeight, element.clientHeight));
    element.addEventListener('scroll', update, { passive: true });
    return () => element.removeEventListener('scroll', update);
  }, [ref]);
  return scrolled;
}
