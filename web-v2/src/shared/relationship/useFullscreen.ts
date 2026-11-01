import { useCallback, useEffect, useState } from 'react';

const RESIZE_DELAY_MS = 100;

/**
 * Full screen like v1's diagram panel: the whole page goes full screen and the editor covers it, so menus and
 * dialogs that antd renders into `document.body` stay visible. `onChange` runs after entering or leaving.
 */
export function useFullscreen(onChange: () => void, doc: Document = document) {
  const [isFullscreen, setFullscreen] = useState(() => doc.fullscreenElement !== null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      setFullscreen(doc.fullscreenElement !== null);
      // Let the editor take its new size first.
      timer = setTimeout(onChange, RESIZE_DELAY_MS);
    };
    doc.addEventListener('fullscreenchange', sync);
    return () => {
      doc.removeEventListener('fullscreenchange', sync);
      clearTimeout(timer);
    };
  }, [doc, onChange]);

  // Leave full screen with the editor, as the page underneath is not meant to stay full screen.
  useEffect(
    () => () => {
      if (doc.fullscreenElement) void doc.exitFullscreen();
    },
    [doc]
  );

  const toggle = useCallback(() => {
    if (doc.fullscreenElement) void doc.exitFullscreen();
    else void doc.documentElement.requestFullscreen?.();
  }, [doc]);

  return { isFullscreen, onToggleFullscreen: toggle };
}
