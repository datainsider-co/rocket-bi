import { useEffect, useRef, useState } from 'react';

/** v1 `ChartFilter.WIDTH_OF_PARENT_WIDGET_USING_ICON`: a card narrower than this shows its inner filter as an icon. */
export const NARROW_CARD_WIDTH = 550;

export function isNarrowCard(width: number): boolean {
  return width < NARROW_CARD_WIDTH;
}

/** Whether the widget card around `ref` is narrow, kept up to date as the card resizes. */
export function useNarrowCard<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const card = ref.current?.closest('.widget-container');
    if (!card) return;
    const observer = new ResizeObserver(([entry]) => entry && setNarrow(isNarrowCard(entry.contentRect.width)));
    observer.observe(card);
    return () => observer.disconnect();
  }, []);
  return { ref, narrow };
}
