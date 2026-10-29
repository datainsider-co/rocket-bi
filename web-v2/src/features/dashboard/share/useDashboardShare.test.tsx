import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { AppProviders } from '@/app/AppProviders';
import { AuthenticationService } from '@/core/auth/AuthenticationService';
import { LoginResponse } from '@/core/auth/LoginResponse';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { createContainer } from '@/core/di/Container';
import { DatabaseShareService } from '@/core/schema/DatabaseShareService';
import { Directory } from '@/core/directory/Directory';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { ShareService } from '@/core/share/ShareService';
import { UserService } from '@/core/user/UserService';
import { fakeAuthenticationService } from '@/features/auth/testing';
import { fakeUserService } from '@/features/dashboard/testing';
import { fakeDashboardService, fakeDirectoryService } from '@/features/directory/testing';
import { fakeDatabaseShareService, fakeShareService } from '@/features/share/testing';
import { useDashboardShare } from './useDashboardShare';

function Harness() {
  const share = useDashboardShare({ id: 1 });
  return (
    <>
      <button type="button" onClick={share.open}>
        Share
      </button>
      {share.modal}
    </>
  );
}

describe('useDashboardShare', () => {
  it("shares the dashboard's directory with its link, password and embed code", async () => {
    const share = fakeShareService();
    const directories = fakeDirectoryService({
      get: vi.fn<DirectoryService['get']>(
        async id => new Directory({ id, name: 'v2 Sample', owner: { username: 'root' }, directory_type: 'dashboard', dashboard_id: 1 })
      )
    });
    const container = createContainer([
      di => {
        di.bindValue(AuthenticationService, fakeAuthenticationService({}, new LoginResponse({ user_info: { username: 'root' } })));
        di.bindValue(DashboardService, fakeDashboardService());
        di.bindValue(DirectoryService, directories);
        di.bindValue(ShareService, share);
        di.bindValue(DatabaseShareService, fakeDatabaseShareService());
        di.bindValue(UserService, fakeUserService());
      }
    ]);
    render(
      <AppProviders queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })} container={container}>
        <Harness />
      </AppProviders>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Get link' }));

    // `fakeDashboardService` puts dashboard 1 in directory 101.
    expect(share.getSharing).toHaveBeenCalledWith({ type: 'directory', id: 101 }, 0, 100);
    expect(await screen.findByRole('textbox', { name: 'Link' })).toHaveValue(`${window.location.origin}/dashboard/v2-sample-1?token=tok-1`);
    expect(screen.getByRole('switch', { name: 'Password protection' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy embed code/ })).toBeInTheDocument();
  });
});
