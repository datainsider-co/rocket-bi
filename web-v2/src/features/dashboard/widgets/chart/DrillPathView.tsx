import { Breadcrumb, Button } from 'antd';
import type { DrilldownStep } from '@/core/query/drilldown';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';

interface DrillPathViewProps {
  steps: readonly DrilldownStep[];
  /** Back to the chart as it was before step `index`. */
  onBack: (index: number) => void;
}

/** Where a drill down went (v1 `BaseChart.buildDrilldownPath`): each clicked value, then the current dimension. */
export function DrillPathView({ steps, onBack }: DrillPathViewProps) {
  if (steps.length === 0) return null;
  return (
    <Breadcrumb
      className={`px-1 pb-1 text-xs ${GRID_NO_DRAG_CLASS}`}
      items={[
        ...steps.map((step, index) => ({
          key: index,
          title: (
            <Button type="link" size="small" className="h-auto! p-0! text-xs!" onClick={() => onBack(index)}>
              {step.value}
            </Button>
          )
        })),
        { key: 'current', title: steps.at(-1)?.name }
      ]}
    />
  );
}
