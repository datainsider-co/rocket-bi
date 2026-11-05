import { Alert, Form, Input, Modal, Spin, Switch } from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import { DomainWhitelistField } from './DomainWhitelistField';
import { loginMethodSchema, type LoginMethodForm } from './loginMethod.utils';

const FORM_ID = 'login-method-form';

interface LoginMethodViewProps {
  /** `undefined` while the stored method loads. */
  initialValues: LoginMethodForm | undefined;
  loadError?: string | undefined;
  save: { run: (values: LoginMethodForm) => void; isPending: boolean; errorMessage?: string | undefined };
  onCancel: () => void;
}

/** v1 `LoginSettingsModal`: Google login on or off, its client id and the domains allowed to sign in. */
export function LoginMethodView({ initialValues, loadError, save, onCancel }: LoginMethodViewProps) {
  return (
    <Modal
      open
      centered
      title="Login Methods"
      okText="Save"
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: save.isPending, disabled: !initialValues }}
      cancelButtonProps={{ disabled: save.isPending }}
      onCancel={onCancel}
      destroyOnHidden
    >
      {loadError && <Alert type="error" showIcon title={loadError} />}
      {!loadError && !initialValues && <Spin className="block py-8" />}
      {initialValues && <LoginMethodFormBody initialValues={initialValues} save={save} />}
    </Modal>
  );
}

function LoginMethodFormBody({ initialValues, save }: Pick<LoginMethodViewProps, 'save'> & { initialValues: LoginMethodForm }) {
  const { control, handleSubmit } = useForm<LoginMethodForm>({
    resolver: zodResolver(loginMethodSchema),
    defaultValues: initialValues
  });
  const isActive = useWatch({ control, name: 'isActive' });

  return (
    <form id={FORM_ID} noValidate onSubmit={handleSubmit(save.run)}>
      <Form layout="vertical" component={false} disabled={save.isPending}>
        <FormField
          control={control}
          name="isActive"
          label="Google Login"
          render={({ value, onChange, id }) => <Switch id={id} checked={value} onChange={onChange} />}
        />
        {isActive && (
          <>
            <FormField
              control={control}
              name="clientId"
              label="Client Id"
              required
              render={field => <Input {...field} placeholder="Input client id" autoComplete="off" />}
            />
            <FormField
              control={control}
              name="whitelistEmail"
              label="Domain whitelist"
              render={({ value, onChange }) => <DomainWhitelistField value={value} onChange={onChange} />}
            />
          </>
        )}
      </Form>
      {save.errorMessage && <Alert type="error" showIcon title={save.errorMessage} />}
    </form>
  );
}
