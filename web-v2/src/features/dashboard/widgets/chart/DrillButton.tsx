import { useState } from 'react';
import { Popover } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { DrillPanel } from './DrillPanel';
import type { ChartWidgetState } from './useChartWidget';
import '../menu/WidgetMenu.css';

/** v1 `ActionWidgetMore`'s drilldown button: a 40px ghost button that opens the drill down panel under it. */
export function DrillButton({ drill }: { drill: ChartWidgetState['drill'] }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      trigger="click"
      placement="bottomLeft"
      open={open}
      onOpenChange={setOpen}
      destroyOnHidden
      classNames={{ root: 'drill-panel-popover' }}
      content={<DrillPanel drill={drill} onClose={() => setOpen(false)} />}
    >
      <button type="button" className={`widget-menu-button widget-menu-button--default ${GRID_NO_DRAG_CLASS}`} aria-label="Drilldown" title="Drilldown">
        <i className="di-icon-drilldown" aria-hidden />
      </button>
    </Popover>
  );
}
