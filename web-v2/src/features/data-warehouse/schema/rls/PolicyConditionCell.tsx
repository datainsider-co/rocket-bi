import { Form, Select } from 'antd';
import { useController, type Control } from 'react-hook-form';
import { AttributeValueInput } from './AttributeValueInput';
import { OPERATOR_OPTIONS, type RlsFormValues } from './rls.utils';

export interface PolicyCellProps {
  control: Control<RlsFormValues>;
  index: number;
}

/** The operator of row `index` and the value(s) it compares with. */
export function PolicyConditionCell({ control, index }: PolicyCellProps) {
  const operator = useController({ control, name: `policies.${index}.operator` });
  const values = useController({ control, name: `policies.${index}.values` });
  const error = values.fieldState.error?.message;
  return (
    <Form.Item className="mb-0" validateStatus={error ? 'error' : undefined} help={error}>
      <div className="flex items-center gap-2">
        <Select className="w-32 shrink-0" aria-label={`Operator of policy ${index + 1}`} options={[...OPERATOR_OPTIONS]} value={operator.field.value} onChange={operator.field.onChange} />
        <div className="min-w-0 flex-1">
          <AttributeValueInput operator={operator.field.value} values={values.field.value} onChange={values.field.onChange} ariaLabel={`Value of policy ${index + 1}`} />
        </div>
      </div>
    </Form.Item>
  );
}
