import { useState } from 'react';
import { textAt } from '../vizValue.utils';
import type { SettingOption } from '../settingOptions';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { seriesNameRevert, seriesPath } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

interface SeriesNameTabProps extends TabProps {
  /** The response's series (`seriesChoicesOf`). */
  series: readonly SettingOption[];
}

/** v1 `LegendNameTab` (Display of the stacked charts): one series at a time, its name. */
export function SeriesNameTab({ viz, onChange, series }: SeriesNameTabProps) {
  const [picked, setPicked] = useState<string>();
  const current = series.find(choice => choice.value === picked) ?? series[0];
  if (!current) return <p className="m-0 text-sm text-black/45">The series show once the chart has data.</p>;
  const path = seriesPath(current.value, 'name');
  return (
    <div className="flex flex-col gap-3">
      <SelectSetting label="Series" options={series} value={current.value} onChange={setPicked} />
      <TextSetting label="Display name" value={textAt(viz, path, current.label)} onChange={name => onChange({ [path]: name })} />
      <RevertButton onRevert={() => onChange(seriesNameRevert(current.value, current.label))} />
    </div>
  );
}
