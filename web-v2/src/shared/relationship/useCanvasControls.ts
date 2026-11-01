import { useCallback } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';
import { steppedZoom, zoomLabel } from './canvasZoom.utils';

const ANIMATION = { duration: 200 };
/** v1 left 20px around the content when fitting it. */
export const FIT_VIEW_OPTIONS = { padding: '20px', duration: 200 } as const;

/** Zoom buttons of the control bar. Must be used inside `ReactFlowProvider`. */
export function useCanvasControls() {
  const { zoomTo, fitView } = useReactFlow();
  const zoom = useStore(state => state.transform[2]);

  const zoomBy = useCallback(
    (direction: 1 | -1) => {
      const next = steppedZoom(zoom, direction);
      if (next !== undefined) void zoomTo(next, ANIMATION);
    },
    [zoom, zoomTo]
  );

  return {
    zoomLabel: zoomLabel(zoom),
    onZoomIn: useCallback(() => zoomBy(1), [zoomBy]),
    onZoomOut: useCallback(() => zoomBy(-1), [zoomBy]),
    onResetZoom: useCallback(() => void zoomTo(1, ANIMATION), [zoomTo]),
    onFitContent: useCallback(() => void fitView(FIT_VIEW_OPTIONS), [fitView])
  };
}
