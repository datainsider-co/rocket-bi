import { useState } from 'react';
import type { UserProfile } from '@/core/user/UserProfile';
import { toProfileForm } from './profile.utils';
import { ProfileModalView } from './ProfileModalView';
import { useUpdateProfile } from './useUpdateProfile';

export function ProfileModal({ profile, onClose }: { profile: UserProfile; onClose: () => void }) {
  const [initial] = useState(() => toProfileForm(profile));
  const save = useUpdateProfile(profile.username, initial, onClose);

  return <ProfileModalView initialValues={initial} save={save} onCancel={onClose} />;
}
