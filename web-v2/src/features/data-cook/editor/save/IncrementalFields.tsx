import { Input, Radio, Select, Typography } from 'antd';
import { useWatch, type Control } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import { IncrementalMode, type IncrementalSource, type SaveEtlValues } from './saveEtl.utils';

interface IncrementalFieldsProps {
  control: Control<SaveEtlValues>;
  sources: readonly IncrementalSource[];
}

const MODES = [
  { value: IncrementalMode.Full, label: 'Full' },
  { value: IncrementalMode.Incremental, label: 'Incremental' }
];

/**
 * v1 "Incremental Setting": per source table, Full or Incremental from a column's value. v1 showed one source at a
 * time, picked in a dropdown; v2 lists them all.
 */
export function IncrementalFields({ control, sources }: IncrementalFieldsProps) {
  const rows = useWatch({ control, name: 'incremental' });
  if (sources.length === 0) return <Typography.Text type="secondary">No source table yet.</Typography.Text>;
  return (
    <div className="flex flex-col gap-3">
      {sources.map((source, index) => {
        const incremental = rows[index]?.mode === IncrementalMode.Incremental;
        return (
          <fieldset key={source.tblName} className="m-0 rounded border border-solid border-black/10 px-3 pt-2" aria-label={`Run mode of ${source.label}`}>
            <legend className="px-1 text-sm font-medium">{source.label}</legend>
            <FormField control={control} name={`incremental.${index}.mode`} label="Run mode" render={field => <Radio.Group {...field} options={MODES} optionType="button" />} />
            {incremental && (
              <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                <FormField
                  control={control}
                  name={`incremental.${index}.column`}
                  label="Column name"
                  required
                  render={field => <Select {...field} showSearch={{ optionFilterProp: 'label' }} placeholder="Select column..." options={[...source.columns]} />}
                />
                <FormField
                  control={control}
                  name={`incremental.${index}.value`}
                  label="Incremental value"
                  render={field => <Input {...field} placeholder="Incremental value" />}
                />
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
