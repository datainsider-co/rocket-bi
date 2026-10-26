import { useLocation } from 'react-router';
import { useTheme } from '@/app/theme/ThemeContext';
import { useCurrentUser } from '@/features/auth/current-user/useCurrentUser';
import { useLogout } from '@/features/auth/current-user/useLogout';
import { HeaderBarView } from './HeaderBarView';
import { brandName } from './header.utils';

export function HeaderBar() {
  const { data } = useCurrentUser();
  const { logout, isPending } = useLogout();
  const { mode, toggleMode } = useTheme();
  const { pathname } = useLocation();
  const organization = data?.userInfo.organization;

  return (
    <HeaderBarView
      brand={{ name: brandName(organization?.name ?? ''), logoUrl: organization?.thumbnailUrl ?? '' }}
      pathname={pathname}
      account={{
        displayName: data?.userProfile.displayName ?? '',
        avatarUrl: data?.userProfile.avatar ?? '',
        isLoggingOut: isPending,
        onLogout: logout
      }}
      theme={{ isDark: mode === 'dark', onToggle: toggleMode }}
    />
  );
}
