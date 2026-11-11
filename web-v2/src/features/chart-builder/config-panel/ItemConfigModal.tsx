import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Modal, Select, Switch } from 'antd';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { familyOptionsOf, typeOptionsOf } from '@/core/chart-builder/functionOptions';
import { FunctionFamily, SortType, type FunctionData } from '@/core/chart-builder/FunctionData';
import { FormField } from '@/shared/form/FormField';
import { canSort, configWithFamily, itemConfigOf, itemConfigSchema, SORT_OPTIONS, withItemConfig, type ItemConfig } from './zoneItem.utils';

/** The item being configured and its zone. */
export interface EditedItem {
  zone: string;
  item: FunctionData;
}

interface ItemConfigModalProps {
  edited: EditedItem;
  onSave: (zone: string, item: FunctionData) => void;
  onCancel: () => void;
}

const asOptions = (values: readonly string[]) => values.map(value => ({ value, label: value }));

/**
 * An item's Config dialog (v1 `ConfigModal`): "Config Data" over the item's source, then display name, function, and
 * sorting with its top N, one under another, and Cancel / Save sharing the footer. Mount it per opening so the form
 * starts from the item.
 */
export function ItemConfigModal({ edited, onSave, onCancel }: ItemConfigModalProps) {
  const { zone, item } = edited;
  const { control, handleSubmit, setValue, getValues } = useForm<ItemConfig>({ resolver: zodResolver(itemConfigSchema), defaultValues: itemConfigOf(item) });
  const [family, sorting, showTopN] = useWatch({ control, name: ['family', 'sorting', 'showTopN'] });
  const isControl = item.functionFamily === FunctionFamily.Dynamic;
  const groups = typeOptionsOf(item.field, family);
  const typeOptions = groups.length === 1 && !groups[0]?.label ? asOptions(groups[0]?.types ?? []) : groups.map(group => ({ label: group.label, options: asOptions(group.types) }));
  const submit = handleSubmit(values => onSave(zone, withItemConfig(item, values)));
  const pickFamily = (next: string) => {
    const config = configWithFamily(getValues(), item, next);
    setValue('family', config.family);
    setValue('type', config.type);
  };

  const source = isControl ? 'from tab control ' : `${item.tableName ?? ''}.`;
  const title = (
    <>
      <div className="builder-dialog__title">
        Config <b>Data</b>
      </div>
      <div className="builder-dialog__subtitle" title={`${source}${item.columnName ?? item.name}`}>
        Source {source}
        <b>{item.columnName ?? item.name}</b>
      </div>
    </>
  );

  return (
    <Modal open centered className="builder-dialog" width={500} closable={false} title={title} okText="Save" onOk={() => void submit()} onCancel={onCancel} destroyOnHidden>
      <Form layout="vertical" component={false}>
        <FormField control={control} name="name" label="Display name" required render={field => <Input {...field} placeholder="Column name..." onPressEnter={() => void submit()} />} />
        {!isControl && (
          <Form.Item label="Functions">
            <div className="builder-dialog__stack">
              <Select aria-label="Function" value={family} options={asOptions(familyOptionsOf(item.field))} onChange={pickFamily} />
              {typeOptions.length > 0 && <Controller control={control} name="type" render={({ field }) => <Select {...field} aria-label="Function type" options={typeOptions} />} />}
            </div>
          </Form.Item>
        )}
        {canSort(zone, family) && (
          <>
            <FormField control={control} name="sorting" label="Sorting" render={field => <Select {...field} options={asOptions(SORT_OPTIONS)} />} />
            {sorting !== SortType.Unsorted && (
              <>
                <div className="builder-dialog__toggle">
                  <label htmlFor="showTopN">Display top N elements</label>
                  <Switch id="showTopN" size="small" checked={showTopN} onChange={checked => setValue('showTopN', checked, { shouldValidate: true })} />
                </div>
                <FormField control={control} name="topN" render={field => <Input {...field} aria-label="Top N" disabled={!showTopN} placeholder="N element shown" autoComplete="off" />} />
              </>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
}
