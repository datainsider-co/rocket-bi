import { Alert, Button, Form, Typography } from 'antd';
import { FormField } from '@/shared/form/FormField';
import { NameInput } from '../job-form/NameInput';
import type { CsvDestinationValues } from './csvDestination.utils';
import type { CsvDestinationForm } from './useCsvDestination';

interface CsvDestinationStepProps {
  destination: CsvDestinationForm;
  onBack: () => void;
}

const FIELDS: { name: keyof CsvDestinationValues; label: string; placeholder: string }[] = [
  { name: 'databaseName', label: 'Database', placeholder: 'Select a database or type a new name' },
  { name: 'tableName', label: 'Table', placeholder: 'Select a table or type a new name' }
];

/** v1 `DescribeDatabase`: the database and table the rows go into, picked or typed. */
export function CsvDestinationStep({ destination, onBack }: CsvDestinationStepProps) {
  const { form, suggestions, hints, submit, isPending, errorMessage } = destination;
  const suggestionsOf = { databaseName: suggestions.databases, tableName: suggestions.tables };

  return (
    <form
      noValidate
      onSubmit={event => {
        event.preventDefault();
        void submit();
      }}
    >
      <Form layout="vertical" component={false} disabled={isPending}>
        {FIELDS.map(field => (
          <div key={field.name}>
            <FormField
              control={form.control}
              name={field.name}
              label={field.label}
              required
              render={({ value, onChange, onBlur, id }) => (
                <NameInput
                  id={id}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  suggestions={suggestionsOf[field.name]}
                  placeholder={field.placeholder}
                />
              )}
            />
            {hints[field.name] && (
              <Typography.Paragraph type="secondary" className="-mt-4 text-xs">
                {hints[field.name]}
              </Typography.Paragraph>
            )}
          </div>
        ))}
      </Form>
      {errorMessage && <Alert className="mb-3" type="error" showIcon title={errorMessage} />}
      <div className="flex justify-end gap-2">
        <Button disabled={isPending} onClick={onBack}>
          Back
        </Button>
        <Button type="primary" htmlType="submit" loading={isPending}>
          Import
        </Button>
      </div>
    </form>
  );
}
