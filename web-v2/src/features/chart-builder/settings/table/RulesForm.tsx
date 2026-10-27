import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { JsonObject } from '@/core/json/json';
import { newRule } from './formattingTabs.utils';
import { RuleRow } from './RuleRow';

interface RulesFormProps {
  rules: readonly unknown[];
  kind: 'color' | 'icon';
  invalid: readonly number[];
  onChange: (rules: unknown[]) => void;
}

/** v1 `RulePanel`: rules in order, the first one a value matches applies. */
export function RulesForm({ rules, kind, invalid, onChange }: RulesFormProps) {
  const replace = (index: number, rule: JsonObject) => onChange(rules.map((item, at) => (at === index ? rule : item)));
  return (
    <div className="flex flex-col gap-2">
      {rules.map((rule, index) => (
        <RuleRow
          // Rules have no stable id of their own in v1's data; their position is their identity here.
          key={index}
          rule={rule}
          kind={kind}
          invalid={invalid.includes(index)}
          onChange={next => replace(index, next)}
          onRemove={() => onChange(rules.filter((_item, at) => at !== index))}
        />
      ))}
      <Button size="small" icon={<PlusOutlined />} className="self-start" onClick={() => onChange([...rules, newRule(`rule_${rules.length}`, kind === 'icon' ? '🔴' : '#d2f4ff')])}>
        New rule
      </Button>
    </div>
  );
}
