import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Modal } from 'antd';
import { useForm } from 'react-hook-form';
import { PropertiesFields } from '@/shared/properties/PropertiesFields';
import { JDBC_SOURCE_KINDS } from '../sourceKinds';
import { JdbcSourceFields } from './JdbcSourceFields';
import { showsProperties, sourceFormSchema, type SourceFormValues } from './sourceForm.utils';
import type { TestResult } from './useSourceForm';

const FORM_ID = 'ingestion-source-form';

interface SourceFormViewProps {
  /** Read once, when the modal opens. */
  initialValues: SourceFormValues;
  isEdit: boolean;
  test: { run: (values: SourceFormValues) => void; isPending: boolean; result?: TestResult | undefined };
  save: { run: (values: SourceFormValues) => void; isPending: boolean; errorMessage?: string | undefined };
  onCancel: () => void;
}

/** v1 `DataSourceConfigModal`: the type's fields, Properties where the type takes them, Test connection and Add / Update. */
export function SourceFormView({ initialValues, isEdit, test, save, onCancel }: SourceFormViewProps) {
  const [defaultValues] = useState(initialValues);
  const { control, handleSubmit } = useForm<SourceFormValues>({ resolver: zodResolver(sourceFormSchema), defaultValues });
  const kind = JDBC_SOURCE_KINDS[defaultValues.databaseType];

  return (
    <Modal
      open
      centered
      width={640}
      title={`${isEdit ? 'Edit' : 'Add'} ${kind.label} Data Source`}
      mask={{ closable: false }}
      onCancel={onCancel}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<ApiOutlined />} loading={test.isPending} onClick={handleSubmit(test.run)} className="mr-auto">
            Test connection
          </Button>
          <Button onClick={onCancel} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" form={FORM_ID} loading={save.isPending}>
            {isEdit ? 'Update' : 'Add'}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={handleSubmit(save.run)} className="max-h-[60vh] overflow-y-auto pt-2">
        <Form layout="vertical" component={false} disabled={save.isPending}>
          <JdbcSourceFields control={control} kind={kind} rawUrl={defaultValues.rawUrl} />
          {showsProperties(kind, defaultValues.rawUrl) && <PropertiesFields control={control} />}
        </Form>
      </form>
      {!test.isPending && test.result?.ok === true && <Alert className="mt-3" type="success" showIcon title="Connection successful" />}
      {!test.isPending && test.result?.ok === false && (
        <Alert className="mt-3" type="error" showIcon title="Connection failed" description={test.result.message} />
      )}
      {save.errorMessage && <Alert className="mt-3" type="error" showIcon title={save.errorMessage} />}
    </Modal>
  );
}
