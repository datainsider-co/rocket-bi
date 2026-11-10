import { Card, Divider } from 'antd';
import type { ManagedUserDetail } from '@/core/admin/ManagedUser';
import type { AttributesControls } from '../attributes/useAttributes';
import { AttributesSection } from '../attributes/AttributesSection';
import type { ContactAbilities } from './contact.utils';
import { ContactHeader } from './ContactHeader';
import { ProfileDetails } from './ProfileDetails';
import type { ContactActions } from './useContactActions';

interface ContactCardProps {
  detail: ManagedUserDetail;
  abilities: ContactAbilities;
  actions: ContactActions;
  attributes: AttributesControls;
  onEditProfile: () => void;
  onDelete: () => void;
}

/** v1 `Contact.vue` and `ContactDetailsForm`: the account, the profile and the attributes. */
export function ContactCard({ detail, abilities, actions, attributes, onEditProfile, onDelete }: ContactCardProps) {
  return (
    <Card>
      <ContactHeader
        detail={detail}
        abilities={abilities}
        isPending={actions.isPending}
        handlers={{ onResetPassword: actions.resetPassword, onToggleActive: actions.toggleActive, onDelete }}
      />
      <Divider />
      <ProfileDetails
        detail={detail}
        canEdit={abilities.editProfile}
        canChangeRole={abilities.changeRole}
        isPending={actions.isPending}
        onEdit={onEditProfile}
        onChangeRole={actions.changeRole}
      />
      <Divider />
      <AttributesSection
        properties={detail.profile.properties}
        canEdit={abilities.editProfile}
        onAdd={attributes.add}
        onEdit={attributes.edit}
        onDelete={attributes.remove}
      />
    </Card>
  );
}
