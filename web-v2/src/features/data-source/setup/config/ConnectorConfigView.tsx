import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Modal, Typography } from 'antd';
import { useForm } from 'react-hook-form';
import { connectionFormSchema, hasSshTunnel } from './connectionForm.utils';
import type { ConnectionFormValues } from './connectionForm.utils';
import type { ConnectionFieldsFactory } from './fields/ConnectionFieldsFactory';
import { defaultConnectionFieldsFactory } from './fields/defaultConnectionFieldsFactory';
import { PropertiesFields } from '@/shared/properties/PropertiesFields';
import { SshTunnelFields } from './SshTunnelFields';
import type { TestResult } from './useConnectorConfig';
import { usePublicKeyLoader } from './usePublicKeyLoader';

const FORM_ID = 'connector-config-form';

interface ConnectorConfigViewProps {
  /** Connection type name, e.g. "MySQL". */
  title: string;
  initialValues: ConnectionFormValues;
  test: { run: (values: ConnectionFormValues) => void; isPending: boolean; result?: TestResult | undefined };
  save: { run: (values: ConnectionFormValues) => void; isPending: boolean; errorMessage?: string | undefined };
  onBack: () => void;
  onLoadPublicKey: () => Promise<string>;
  /** Picks the type-specific fields; tests can inject their own. */
  fieldsFactory?: ConnectionFieldsFactory;
}

export function ConnectorConfigView({
  title,
  initialValues,
  test,
  save,
  onBack,
  onLoadPublicKey,
  fieldsFactory = defaultConnectionFieldsFactory
}: ConnectorConfigViewProps) {
  const [defaultValues] = useState(initialValues);
  const form = useForm<ConnectionFormValues>({ resolver: zodResolver(connectionFormSchema), defaultValues });
  const publicKey = usePublicKeyLoader(form, onLoadPublicKey);
  const { control, handleSubmit } = form;

  return (
    <Modal
      open
      centered
      width={720}
      closable={false}
      mask={{ closable: false }}
      keyboard={false}
      title={
        <div>
          <div>{title} Config</div>
          <Typography.Text type="secondary" className="text-sm font-normal">
            To get started, you need to give us access to your {title}. Follow these simple steps to complete your setup.
          </Typography.Text>
        </div>
      }
      footer={[
        <Button key="back" onClick={onBack} disabled={save.isPending}>
          Back
        </Button>,
        <Button key="apply" type="primary" htmlType="submit" form={FORM_ID} loading={save.isPending}>
          Apply
        </Button>
      ]}
    >
      <form id={FORM_ID} noValidate onSubmit={handleSubmit(save.run)} className="pt-2">
        <Form layout="vertical" component={false} disabled={save.isPending}>
          {fieldsFactory.render(defaultValues.type, { control })}
          <SshTunnelFields
            control={control}
            defaultOpen={hasSshTunnel(defaultValues.ssh)}
            isPublicKeyLoading={publicKey.isLoading}
            onOpen={publicKey.load}
          />
          <PropertiesFields control={control} />
        </Form>
      </form>
      <Button icon={<ApiOutlined />} loading={test.isPending} onClick={handleSubmit(test.run)} className="mt-4">
        Test connection
      </Button>
      {!test.isPending && test.result?.ok === true && (
        <Alert className="mt-3" type="success" showIcon title="Connection successful" />
      )}
      {!test.isPending && test.result?.ok === false && (
        <Alert className="mt-3" type="error" showIcon title="Connection failed" description={test.result.message} />
      )}
      {save.errorMessage && <Alert className="mt-3" type="error" showIcon title={save.errorMessage} />}
    </Modal>
  );
}
