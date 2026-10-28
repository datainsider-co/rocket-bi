import { asArray, asRecord, asString, type JsonObject } from '@/core/json/json';
import { SelectSetting } from '../fields/SelectSetting';
import { APPLY_TO, ICON_ALIGNS, ICON_LAYOUTS } from './formattingOptions';
import { ICON_STYLES, iconStyleRules, invalidRules, withValue } from './formattingTabs.utils';
import { RulesForm } from './RulesForm';

/** v1 `IconFormatSetting`: icons by rules on the column's values, where they sit, and a style that sets the rules. */
export function IconFormatForm({ config, onChange }: { config: JsonObject; onChange: (config: JsonObject) => void }) {
  const rules = asArray(asRecord(config['rules'])['iconRules']);
  const set = (key: string) => (value: string) => onChange(withValue(config, key, value));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <SelectSetting className="flex-1" label="Apply to" options={APPLY_TO} value={asString(config['applyTo'], 'values_only')} onChange={set('applyTo')} />
        <SelectSetting className="flex-1" label="Icon layout" options={ICON_LAYOUTS} value={asString(config['layout'], 'left')} onChange={set('layout')} />
        <SelectSetting className="flex-1" label="Icon alignment" options={ICON_ALIGNS} value={asString(config['align'], 'center')} onChange={set('align')} />
      </div>
      <SelectSetting
        label="Style"
        options={ICON_STYLES}
        value={asString(config['style'], 'default')}
        onChange={style => onChange({ ...config, style, rules: { ...asRecord(config['rules']), iconRules: iconStyleRules(style) } })}
      />
      <RulesForm rules={rules} kind="icon" invalid={invalidRules(rules)} onChange={next => onChange(withValue(config, 'rules.iconRules', next))} />
    </div>
  );
}
