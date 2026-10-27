import { useState } from 'react';
import { boolAt, numberAt, textAt } from '../vizValue.utils';
import { DASH_STYLES, type SettingOption } from '../settingOptions';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import { displayRevert, hasDash, hasMarker, seriesPath, seriesTypeOf } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

interface DisplayTabProps extends TabProps {
  /** The response's series (`seriesChoicesOf`). */
  series: readonly SettingOption[];
}

/**
 * v1 `DisplayTab`: one series at a time, its name, marker, dash and axis. v1's type and line width fields were always
 * disabled, so they are left out.
 */
export function DisplayTab({ viz, onChange, series }: DisplayTabProps) {
  const [picked, setPicked] = useState<string>();
  const current = series.find(choice => choice.value === picked) ?? series[0];
  if (!current) return <p className="m-0 text-sm text-black/45">The series show once the chart has data.</p>;

  const key = current.value;
  const type = seriesTypeOf(viz, key);
  const set = (path: string) => (value: unknown) => onChange({ [seriesPath(key, path)]: value });
  const dualAxis = boolAt(viz, 'yAxis[1].visible', false) && series.length > 1;
  return (
    <div className="flex flex-col gap-3">
      <SelectSetting label="Series" options={series} value={key} onChange={setPicked} />
      <TextSetting label="Display name" value={textAt(viz, seriesPath(key, 'name'), current.label)} onChange={set('name')} />
      {hasMarker(type) && <ToggleSetting label="Show marker" value={boolAt(viz, seriesPath(key, 'marker.enabled'), false)} onChange={set('marker.enabled')} />}
      {hasDash(type) && <SelectSetting label="Dash style" options={DASH_STYLES} value={textAt(viz, seriesPath(key, 'dashStyle'), 'Solid')} onChange={set('dashStyle')} />}
      {dualAxis && (
        <ToggleSetting label="Use second axis" value={numberAt(viz, seriesPath(key, 'yAxis'), 0) !== 0} onChange={enabled => onChange({ [seriesPath(key, 'yAxis')]: enabled ? 1 : 0 })} />
      )}
      <RevertButton onRevert={() => onChange(displayRevert(key, current.label))} />
    </div>
  );
}
