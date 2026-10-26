import { useEffect, useRef, useState, type MouseEvent } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactModule, { type HighchartsReactRefObject } from 'highcharts-react-official';

/**
 * The package ships CommonJS only (`module.exports = { HighchartsReact, default }`). Vite's pre-bundle hands that whole
 * object to a default import, while Vitest unwraps it to the component, so pick the component from either shape.
 */
const HighchartsReact =
  (HighchartsReactModule as unknown as { HighchartsReact?: typeof HighchartsReactModule }).HighchartsReact ??
  HighchartsReactModule;

export interface HighchartsChartProps {
  options: Highcharts.Options;
  /** Fixed height. Ignored with `fill`. */
  height?: number | string;
  /** Take the parent's size and follow it when it changes (dashboard widgets resize without a window resize). */
  fill?: boolean;
  /**
   * A right click on a point (the one under the mouse), with where it happened in viewport pixels. Highcharts has no
   * point context menu event without a module, so the container's event asks the chart for its hovered point.
   */
  onPointContextMenu?: (point: Highcharts.Point, position: { x: number; y: number }) => void;
}

/**
 * Size of the element, kept up to date. Highcharts reads its container's height once, when the chart is created, and
 * falls back to 400px if the layout isn't done yet, so a filling chart gets its height passed explicitly.
 */
function useElementSize(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>();
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize(previous =>
        previous?.width === Math.floor(width) && previous.height === Math.floor(height) ? previous : { width: Math.floor(width), height: Math.floor(height) }
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);
  return { ref, size };
}

export function HighchartsChart({ options, height = 400, fill = false, onPointContextMenu }: HighchartsChartProps) {
  const { ref, size } = useElementSize(fill);
  const chartRef = useRef<HighchartsReactRefObject>(null);
  const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    const point = chartRef.current?.chart?.hoverPoint;
    if (!point || !onPointContextMenu) return;
    event.preventDefault();
    onPointContextMenu(point, { x: event.clientX, y: event.clientY });
  };

  const chart = fill ? { ...options.chart, width: size?.width, height: size?.height } : { height, ...options.chart };
  const content = (
    <HighchartsReact
      ref={chartRef}
      highcharts={Highcharts}
      options={{ credits: { enabled: false }, ...options, chart }}
      containerProps={{ 'data-testid': 'highcharts-chart' }}
    />
  );
  if (!fill) return onPointContextMenu ? <div onContextMenu={onContextMenu}>{content}</div> : content;
  return (
    <div ref={ref} className="size-full min-h-0 overflow-hidden" onContextMenu={onContextMenu}>
      {size && size.height > 0 && content}
    </div>
  );
}
