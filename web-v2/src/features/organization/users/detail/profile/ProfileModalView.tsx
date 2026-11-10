import { Alert, DatePicker, Form, Input, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import { GENDER_OPTIONS, profileSchema, type ProfileForm } from './profile.utils';

const FORM_ID = 'user-profile-form';

interface ProfileModalViewProps {
  initialValues: ProfileForm;
  save: { run: (values: ProfileForm) => void; isPending: boolean; errorMessage?: string | undefined };
  onCancel: () => void;
}

/** v1 `ContactDetailsForm`'s fields in one form. The email can't be changed; the avatar is a URL (no upload). */
export function ProfileModalView({ initialValues, save, onCancel }: ProfileModalViewProps) {
  const { control, handleSubmit } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: initialValues });

  return (
    <Modal
      open
      centered
      title="Edit Profile"
      okText="Save"
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: save.isPending }}
      cancelButtonProps={{ disabled: save.isPending }}
      onCancel={onCancel}
      destroyOnHidden
    >
      <form id={FORM_ID} noValidate onSubmit={handleSubmit(save.run)}>
        <Form layout="vertical" component={false} disabled={save.isPending}>
          <FormField control={control} name="fullName" label="Name" required render={field => <Input {...field} />} />
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField control={control} name="firstName" label="First Name" render={field => <Input {...field} />} />
            <FormField control={control} name="lastName" label="Last Name" render={field => <Input {...field} />} />
            <FormField control={control} name="mobilePhone" label="Mobile Phone" render={field => <Input {...field} />} />
            <FormField
              control={control}
              name="gender"
              label="Gender"
              render={({ value, onChange, id }) => <Select id={id} value={value} onChange={onChange} options={GENDER_OPTIONS} />}
            />
          </div>
          <FormField
            control={control}
            name="dob"
            label="Date of Birth"
            render={({ value, onChange, id }) => (
              <DatePicker
                id={id}
                className="w-full"
                format="MMM DD, YYYY"
                value={value ? dayjs(value) : null}
                onChange={date => onChange(date ? date.startOf('day').valueOf() : 0)}
              />
            )}
          />
          <FormField
            control={control}
            name="avatar"
            label="Avatar URL"
            render={field => <Input {...field} placeholder="https://..." />}
          />
        </Form>
      </form>
      {save.errorMessage && <Alert type="error" showIcon title={save.errorMessage} />}
    </Modal>
  );
}
