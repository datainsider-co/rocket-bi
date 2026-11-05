import { Alert, Form, Input, Modal, Select } from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { UserGroup } from '@/core/admin/UserGroup';
import { FormField } from '@/shared/form/FormField';
import { DEFAULT_NEW_USER, EMAIL_EXISTED_MESSAGE, newUserSchema, type NewUserForm } from './newUser.utils';

const FORM_ID = 'new-user-form';
const ROLE_OPTIONS = [UserGroup.Editor, UserGroup.Viewer].map(group => ({ value: group, label: group }));

interface NewUserModalProps {
  isPending: boolean;
  /** Shown under the email, like v1. */
  emailExisted: boolean;
  /** Any other failure. */
  errorMessage?: string | undefined;
  onSubmit: (values: NewUserForm) => void;
  /** Called when the email changes after a failed create, to clear the error. */
  onEdit: () => void;
  onCancel: () => void;
}

/** v1 `UserManagementModal`: email, names, role, password and its confirmation. */
export function NewUserModal({ isPending, emailExisted, errorMessage, onSubmit, onEdit, onCancel }: NewUserModalProps) {
  const { control, handleSubmit, setFocus } = useForm<NewUserForm>({
    resolver: zodResolver(newUserSchema),
    defaultValues: DEFAULT_NEW_USER
  });

  return (
    <Modal
      open
      centered
      title="Add New User"
      okText="Create"
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: isPending }}
      cancelButtonProps={{ disabled: isPending }}
      onCancel={onCancel}
      destroyOnHidden
      afterOpenChange={visible => visible && setFocus('email')}
    >
      <form id={FORM_ID} noValidate onSubmit={handleSubmit(onSubmit)} onChange={() => (errorMessage ? onEdit() : undefined)}>
        <Form layout="vertical" component={false} disabled={isPending}>
          <FormField
            control={control}
            name="email"
            label="Email"
            required
            render={field => (
              <Input
                {...field}
                autoComplete="off"
                placeholder="user@example.com"
                status={emailExisted ? 'error' : undefined}
              />
            )}
          />
          {emailExisted && <div className="-mt-5 mb-4 text-sm text-red-500">{EMAIL_EXISTED_MESSAGE}</div>}
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField control={control} name="firstName" label="First Name" required render={field => <Input {...field} />} />
            <FormField control={control} name="lastName" label="Last Name" required render={field => <Input {...field} />} />
          </div>
          <FormField
            control={control}
            name="userGroup"
            label="Role"
            render={({ value, onChange, id }) => <Select id={id} value={value} onChange={onChange} options={ROLE_OPTIONS} />}
          />
          <FormField
            control={control}
            name="password"
            label="Password"
            required
            render={field => <Input.Password {...field} autoComplete="new-password" />}
          />
          <FormField
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            required
            render={field => <Input.Password {...field} autoComplete="new-password" />}
          />
        </Form>
      </form>
      {errorMessage && !emailExisted && <Alert type="error" showIcon title={errorMessage} />}
    </Modal>
  );
}
