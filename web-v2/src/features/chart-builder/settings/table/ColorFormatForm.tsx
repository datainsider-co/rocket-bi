import { asArray, asRecord, asString, type JsonObject } from '@/core/json/json';
import { SelectSetting } from '../fields/SelectSetting';
import { APPLY_TO, FORMAT_BY } from './formattingOptions';
import { invalidBounds, invalidRules, withValue } from './formattingTabs.utils';
import { RulesForm } from './RulesForm';
import { ScaleForm } from './ScaleForm';

/**
 * v1 `ColorFormatSetting`: a color scale or rules, on the column's own values. v1's "Format by field value" and other
 * fields can't be drawn on a flatten table, so they are left out.
 */
export function ColorFormatForm({ config, onChange }: { config: JsonObject; onChange: (config: JsonObject) => void }) {
  const rules = asArray(asRecord(config['rules'])['colorRules']);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <SelectSetting className="flex-1" label="Format by" options={FORMAT_BY} value={asString(config['formatType'], 'scale')} onChange={type => onChange(withValue(config, 'formatType', type))} />
        <SelectSetting className="flex-1" label="Apply to" options={APPLY_TO} value={asString(config['applyTo'], 'values_only')} onChange={applyTo => onChange(withValue(config, 'applyTo', applyTo))} />
      </div>
      {config['formatType'] === 'rules' ? (
        <RulesForm rules={rules} kind="color" invalid={invalidRules(rules)} onChange={next => onChange(withValue(config, 'rules.colorRules', next))} />
      ) : (
        <ScaleForm scale={config['scale']} invalid={invalidBounds(asRecord(config['scale']), ['min', 'center', 'max'])} onChange={scale => onChange(withValue(config, 'scale', scale))} />
      )}
    </div>
  );
}
