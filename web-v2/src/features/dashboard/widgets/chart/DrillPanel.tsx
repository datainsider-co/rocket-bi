import { useState } from 'react';
import { asString } from '@/core/json/json';
import { DrillPanelView } from './DrillPanelView';
import { dimensionValues } from './drillPanel.utils';
import type { ChartWidgetState } from './useChartWidget';
import { useDrillFields } from './useDrillFields';

interface DrillPanelProps {
  drill: ChartWidgetState['drill'];
  /** The clicked point's value: the panel opens on its fields. */
  initialValue?: string;
  /** After a drill down or a reset. */
  onClose: () => void;
}

/**
 * The drill down panel of one chart (v1 `DrilldownSetting`). The values to start from are the ones the chart shows
 * (v1 queried them again); the fields load with the panel. Going back along the path changes the chart at once and
 * asks for a value again.
 */
export function DrillPanel({ drill, initialValue, onClose }: DrillPanelProps) {
  const [value, setValue] = useState(initialValue);
  const fields = useDrillFields(drill.setting, drill.column, true);
  return (
    <DrillPanelView
      header={asString(drill.column?.['name'])}
      path={drill.steps}
      value={value}
      values={dimensionValues(drill.response)}
      fields={fields}
      onReset={() => {
        drill.reset();
        onClose();
      }}
      onBack={index => {
        drill.back(index);
        setValue(undefined);
      }}
      onPickValue={setValue}
      onDrill={(field, dateLevel) => {
        if (value !== undefined) drill.drillDown(value, field, dateLevel);
        onClose();
      }}
    />
  );
}
