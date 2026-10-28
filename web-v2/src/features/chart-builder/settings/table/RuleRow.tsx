import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { asRecord, asString, type JsonObject } from '@/core/json/json';
import { ColorSetting } from '../fields/ColorSetting';
import { SelectSetting } from '../fields/SelectSetting';
import { TextSetting } from '../fields/TextSetting';
import { FIRST_CONDITIONS, SECOND_CONDITIONS, VALUE_TYPES } from './formattingOptions';
import { ICON_CHOICES } from './formattingTabs.utils';

interface RuleRowProps {
  rule: unknown;
  /** Colors or icons. */
  kind: 'color' | 'icon';
  invalid: boolean;
  onChange: (rule: JsonObject) => void;
  onRemove: () => void;
}

/** v1 `RuleItem`: if the value is `>` / `>=` a bound and `<` / `<=` another, `=` one, or blank, then a color or icon. */
export function RuleRow({ rule, kind, invalid, onChange, onRemove }: RuleRowProps) {
  const value = asRecord(rule);
  const first = asRecord(value['firstCondition']);
  const second = asRecord(value['secondCondition']);
  const type = asString(first['conditionType'], 'greater_than_or_equal');
  const ranged = type === 'greater_than' || type === 'greater_than_or_equal';
  const setFirst = (key: string) => (next: unknown) => onChange({ ...value, firstCondition: { ...first, [key]: next } });
  const setSecond = (key: string) => (next: unknown) => onChange({ ...value, secondCondition: { ...second, valueType: first['valueType'], [key]: next } });
  const text = (condition: JsonObject) => asString(condition['value'], String(condition['value'] ?? ''));
  return (
    <div className={`flex flex-wrap items-end gap-2 rounded border border-solid p-2 ${invalid ? 'border-[var(--ant-color-error,#ff4d4f)]' : 'border-black/10'}`}>
      <SelectSetting className="w-20" label="If value" options={FIRST_CONDITIONS} value={type} onChange={setFirst('conditionType')} />
      {type !== 'blank' && <TextSetting className="w-20" label="Value" value={text(first)} onChange={setFirst('value')} />}
      {ranged && (
        <>
          <SelectSetting className="w-16" label="and" options={SECOND_CONDITIONS} value={asString(second['conditionType'], 'less_than')} onChange={setSecond('conditionType')} />
          <TextSetting className="w-20" label="Value" value={text(second)} onChange={setSecond('value')} />
        </>
      )}
      {type !== 'blank' && <SelectSetting className="w-24" label="Type" options={VALUE_TYPES} value={asString(first['valueType'], 'number')} onChange={setFirst('valueType')} />}
      {kind === 'color' ? (
        <ColorSetting className="w-28" label="Then" value={asString(value['value'], '#d2f4ff')} onChange={color => onChange({ ...value, value: color })} />
      ) : (
        <SelectSetting className="w-20" label="Then" options={ICON_CHOICES} value={asString(value['value'], '🔴')} onChange={icon => onChange({ ...value, value: icon })} />
      )}
      <Button type="text" size="small" icon={<CloseOutlined />} aria-label="Remove rule" onClick={onRemove} />
    </div>
  );
}
