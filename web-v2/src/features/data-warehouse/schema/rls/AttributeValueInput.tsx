import { Input, Select } from 'antd';
import type { UserAttributeOperator } from '@/core/rls/RlsPolicy';
import { operatorInputOf } from './rls.utils';

interface AttributeValueInputProps {
  operator: UserAttributeOperator;
  values: readonly string[];
  onChange: (values: string[]) => void;
  ariaLabel: string;
}

/** The value a property is compared with: one for equal, tags for in (v1 `TagsInput`, added with Enter , ;), none for a null check. */
export function AttributeValueInput({ operator, values, onChange, ariaLabel }: AttributeValueInputProps) {
  switch (operatorInputOf(operator)) {
    case 'one':
      return <Input aria-label={ariaLabel} placeholder="Attribute value" value={values[0] ?? ''} onChange={event => onChange([event.target.value])} />;
    case 'many':
      return (
        <Select
          mode="tags"
          className="w-full"
          aria-label={ariaLabel}
          placeholder="Attribute values"
          open={false}
          suffixIcon={null}
          tokenSeparators={[',', ';']}
          value={[...values]}
          onChange={(next: string[]) => onChange(next)}
        />
      );
    case 'none':
      return null;
  }
}
