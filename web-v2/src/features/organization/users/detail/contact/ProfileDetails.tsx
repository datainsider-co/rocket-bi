import { Button, Descriptions, Select } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ManagedUserDetail } from '@/core/admin/ManagedUser';
import { UserGroup } from '@/core/admin/UserGroup';
import { formatBirthDate, genderLabel } from '../profile/profile.utils';

const ROLE_OPTIONS = [UserGroup.Editor, UserGroup.Viewer].map(group => ({ value: group, label: group }));

interface ProfileDetailsProps {
  detail: ManagedUserDetail;
  canEdit: boolean;
  canChangeRole: boolean;
  isPending: boolean;
  onEdit: () => void;
  onChangeRole: (group: UserGroup) => void;
}

/** v1 `ContactDetailsForm` fields, read only; Edit Profile opens one form for all of them. */
export function ProfileDetails({ detail, canEdit, canChangeRole, isPending, onEdit, onChangeRole }: ProfileDetailsProps) {
  const { profile, userGroup } = detail;
  const role =
    canChangeRole ? (
      <Select
        aria-label="Role"
        size="small"
        className="w-28"
        value={userGroup}
        disabled={isPending}
        options={ROLE_OPTIONS}
        onChange={group => group !== userGroup && onChangeRole(group)}
      />
    ) : (
      userGroup
    );

  return (
    <Descriptions
      size="small"
      column={1}
      title="Profile"
      extra={
        canEdit && (
          <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
            Edit Profile
          </Button>
        )
      }
      items={[
        { key: 'role', label: 'Role', children: role },
        { key: 'first', label: 'First Name', children: profile.firstName || '--' },
        { key: 'last', label: 'Last Name', children: profile.lastName || '--' },
        { key: 'phone', label: 'Mobile Phone', children: profile.mobilePhone || '--' },
        { key: 'gender', label: 'Gender', children: genderLabel(profile.gender) },
        { key: 'dob', label: 'Date of Birth', children: formatBirthDate(profile.dob) }
      ]}
    />
  );
}
