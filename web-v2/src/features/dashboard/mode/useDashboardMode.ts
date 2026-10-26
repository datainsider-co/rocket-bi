import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { DashboardMode } from './dashboardMode.utils';

/**
 * The dashboard's display mode (v1 `DashboardControlBar.toFullScreenMode` / `toTvMode`). TV mode asks the browser for
 * full screen on the whole document, so menus and popups (rendered in `<body>`) still show; leaving the browser's full
 * screen (Esc) goes back to view, as in v1.
 */
export function useDashboardMode(doc: Document = document) {
  const [mode, setMode] = useState<DashboardMode>(DashboardMode.View);

  useEffect(() => {
    const onChange = () => {
      if (!doc.fullscreenElement) setMode(current => (current === DashboardMode.Tv ? DashboardMode.View : current));
    };
    doc.addEventListener('fullscreenchange', onChange);
    return () => doc.removeEventListener('fullscreenchange', onChange);
  }, [doc]);

  const changeMode = useCallback(
    async (next: DashboardMode) => {
      if (next !== DashboardMode.Tv && doc.fullscreenElement) await doc.exitFullscreen();
      if (next === DashboardMode.Tv && !doc.fullscreenElement) {
        try {
          await doc.documentElement.requestFullscreen();
        } catch {
          void message.error('Error attempting to enable full-screen mode');
          setMode(DashboardMode.FullScreen);
          return;
        }
      }
      setMode(next);
    },
    [doc]
  );

  return { mode, changeMode };
}
