import { UserMenuView } from './UserMenuView';
import { useCurrentUser } from './useCurrentUser';
import { useLogout } from './useLogout';

export function UserMenu() {
  const { data } = useCurrentUser();
  const { logout, isPending } = useLogout();

  return (
    <UserMenuView
      displayName={data?.userProfile.displayName ?? ''}
      avatarUrl={data?.userProfile.avatar}
      isLoggingOut={isPending}
      onLogout={logout}
    />
  );
}
