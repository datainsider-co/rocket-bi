import { Alert, Divider, Form, Input, Modal } from 'antd';
import { FormProvider, useWatch, type UseFormReturn } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import { ScheduleFields } from '@/shared/schedule/ScheduleFields';
import { JobDestinationSection } from './JobDestinationSection';
import { allowsMinutely, cleanTableNames, saveButtonText, type JobFormValues } from './jobForm.utils';
import { JobSourceSection } from './JobSourceSection';
import { JobSyncSection } from './JobSyncSection';
import type { JobFormOptions } from './useJobFormOptions';

const FORM_ID = 'ingestion-job-form';

export interface JobFormLayout {
  readonly isEdit: boolean;
  readonly lockSource: boolean;
  readonly allowMultiTable: boolean;
}

interface JobFormViewProps {
  form: UseFormReturn<JobFormValues>;
  options: JobFormOptions;
  layout: JobFormLayout;
  save: { isPending: boolean; errorMessage: string | undefined };
  onSubmit: () => void;
  onCancel: () => void;
}

/** v1 `JobCreationModal` / `MultiJobCreationModal` in one: name, source, destination, sync mode, schedule. */
export function JobFormView({ form, options, layout, save, onSubmit, onCancel }: JobFormViewProps) {
  const tableCount = cleanTableNames(useWatch({ control: form.control, name: 'tableNames' })).length;

  return (
    <Modal
      open
      centered
      width={560}
      title={layout.isEdit ? 'Edit Job' : 'Add Job'}
      okText={saveButtonText(layout.isEdit, tableCount)}
      confirmLoading={save.isPending}
      cancelButtonProps={{ disabled: save.isPending }}
      mask={{ closable: false }}
      onOk={onSubmit}
      onCancel={onCancel}
    >
      <FormProvider {...form}>
        <form
          id={FORM_ID}
          noValidate
          className="max-h-[65vh] overflow-y-auto pt-2 pr-1"
          onSubmit={event => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Form layout="vertical" component={false} disabled={save.isPending}>
            <FormField
              control={form.control}
              name="displayName"
              label="Job name"
              required
              render={field => <Input {...field} autoComplete="off" placeholder="Input job name" />}
            />
            <JobSourceSection options={options} lockSource={layout.lockSource} allowMultiTable={layout.allowMultiTable} />
            <Divider className="!my-2" />
            <JobDestinationSection options={options} tableCount={tableCount} />
            <Divider className="!my-2" />
            <JobSyncSection columns={options.columns} />
            <ScheduleFields control={form.control} allowMinutely={allowsMinutely(tableCount)} />
          </Form>
        </form>
      </FormProvider>
      {save.errorMessage && <Alert className="mt-3" type="error" showIcon title={save.errorMessage} />}
    </Modal>
  );
}
