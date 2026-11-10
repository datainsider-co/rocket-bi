import { Alert, Form, Input, Modal, Typography } from 'antd';
import { FormField } from '@/shared/form/FormField';
import { ScheduleFields } from '@/shared/schedule/ScheduleFields';
import { IncrementalFields } from './IncrementalFields';
import type { SaveEtlFormModel } from './useSaveEtlForm';

interface SaveEtlModalViewProps {
  form: SaveEtlFormModel;
  saving: boolean;
  /** The server's message when saving failed. */
  error: string | undefined;
  onCancel: () => void;
}

/** v1 `SaveEtl`: the name, the schedule and the incremental settings, then Save. */
export function SaveEtlModalView({ form, saving, error, onCancel }: SaveEtlModalViewProps) {
  return (
    <Modal
      open
      centered
      title="Save ETL"
      okText="Save"
      width={560}
      confirmLoading={saving}
      onOk={() => void form.submit()}
      onCancel={onCancel}
      mask={{ closable: false }}
      destroyOnHidden
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', overflowX: 'hidden' } }}
    >
      {error && <Alert className="mb-3" type="error" showIcon title={error} />}
      <Form layout="vertical" component={false}>
        <FormField control={form.control} name="name" label="Name" required render={field => <Input {...field} placeholder="ETL name" />} />
        <ScheduleFields control={form.control} allowMinutely={false} />
        <Typography.Title level={5} className="mt-4!">
          Incremental Setting
        </Typography.Title>
        <IncrementalFields control={form.control} sources={form.sources} />
      </Form>
    </Modal>
  );
}
