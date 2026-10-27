import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { AppProviders } from '@/app/AppProviders';
import { AuthenticationService } from '@/core/auth/AuthenticationService';
import { LoginResponse } from '@/core/auth/LoginResponse';
import { createContainer } from '@/core/di/Container';
import { Directory } from '@/core/directory/Directory';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { PermissionToken, ResourceSharing } from '@/core/share/ResourceSharing';
import { ShareService } from '@/core/share/ShareService';
import { UserProfile } from '@/core/user/UserProfile';
import { UserService } from '@/core/user/UserService';
import { fakeAuthenticationService } from '@/features/auth/testing';
import { fakeUserService } from '@/features/dashboard/testing';
import { fakeDirectoryService } from '@/features/directory/testing';
import { hashPassword } from '@/shared/security/hashPassword';
import { ShareModal } from './ShareModal';
import type { ShareOptions } from './share.utils';
import { fakeShareService } from './testing';

const TARGET = { type: 'directory', id: 8, name: 'v2 Sample', owner: 'root' } as const;
const DASHBOARD: ShareOptions = { link: 'dashboard', dashboardId: 1, password: true, embed: true };
const ANN = { username: 'ann', full_name: 'Ann Lee', email: 'ann@example.com' };

function setup({ share = fakeShareService(), username = 'root', options = DASHBOARD } = {}) {
  const directories = fakeDirectoryService({
    get: vi.fn<DirectoryService['get']>(async id => new Directory({ id, directory_type: 'dashboard', dashboard_id: 1 }))
  });
  const users = fakeUserService({
    suggest: vi.fn<UserService['suggest']>(async () => ({ total: 1, users: [{ profile: new UserProfile(ANN), json: ANN }] }))
  });
  const container = createContainer([
    di => {
      di.bindValue(AuthenticationService, fakeAuthenticationService({}, new LoginResponse({ user_info: { username } })));
      di.bindValue(ShareService, share);
      di.bindValue(DirectoryService, directories);
      di.bindValue(UserService, users);
    }
  ]);
  const onShared = vi.fn<() => void>();
  const onClose = vi.fn<() => void>();
  render(
    <AppProviders queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })} container={container}>
      <ShareModal open target={TARGET} options={options} onClose={onClose} onShared={onShared} />
    </AppProviders>
  );
  return { share, directories, onShared, onClose };
}

const apply = () => userEvent.click(screen.getAllByRole('button', { name: 'Apply' })[0] as HTMLElement);

describe('ShareModal', () => {
  it('lists the owner and the users it is shared with', async () => {
    const share = fakeShareService({
      getSharing: vi.fn<ShareService['getSharing']>(
        async () =>
          new ResourceSharing({
            owner: { username: 'root', full_name: 'root', email: 'hello@gmail.com' },
            users_sharing: [{ id: 's_1', user: { username: 'bob', full_name: 'Bob' }, permissions: ['0:directory:view:8', '0:directory:download:8'] }]
          })
      )
    });
    setup({ share });

    expect(await screen.findByText('Owner')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'People with access' });
    expect(within(list).getByText('Bob')).toBeInTheDocument();
    expect(within(list).getByText('View & Download')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get link' })).toHaveTextContent('Anyone on the internet with this link can view');
  });

  it('shares with a user picked in the search on Apply', async () => {
    const { share, onShared, onClose } = setup();
    await screen.findByText('Owner');

    await userEvent.type(screen.getByRole('combobox', { name: 'Add people and groups' }), 'an');
    await userEvent.click(await screen.findByText('Ann Lee', {}, { timeout: 2000 }));
    expect(within(screen.getByRole('list', { name: 'People with access' })).getByText('Ann Lee')).toBeInTheDocument();
    await apply();

    await waitFor(() => expect(share.shareWithUsers).toHaveBeenCalledWith({ type: 'directory', id: 8 }, { ann: ['view'] }));
    expect(share.editShares).not.toHaveBeenCalled();
    expect(onShared).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('creates a link when Get link opens, then applies its level and a password', async () => {
    const { share, directories, onShared } = setup();
    await screen.findByText('Owner');

    await userEvent.click(screen.getByRole('button', { name: 'Get link' }));

    const link = await screen.findByRole('textbox', { name: 'Link' });
    expect(share.createLink).toHaveBeenCalledWith({ type: 'directory', id: 8 }, ['view']);
    expect(link).toHaveValue(`${window.location.origin}/dashboard/v2-sample-1?token=tok-1`);
    expect(screen.getByRole('button', { name: /Copy embed code/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: 'Access of anyone with the link' }));
    await userEvent.click(await screen.findByTitle('Edit'));
    await userEvent.click(await screen.findByRole('switch', { name: 'Password protection' }));
    await userEvent.type(screen.getByLabelText('Your password'), 'abc');
    await apply();

    await waitFor(() => expect(onShared).toHaveBeenCalled());
    expect(share.updateLink).toHaveBeenCalledWith({ type: 'directory', id: 8 }, ['view', 'download', 'edit', 'copy', 'delete', 'create']);
    expect(directories.setPassword).toHaveBeenCalledWith(8, hashPassword('abc'));
    expect(share.shareWithUsers).not.toHaveBeenCalled();
  });

  it('shows the stored link and offers no password to others than the owner', async () => {
    const share = fakeShareService({
      getLink: vi.fn<ShareService['getLink']>(async () => new PermissionToken({ token_id: 'tok-9', permissions: ['0:directory:view:8'] }))
    });
    setup({ share, username: 'bob' });
    await screen.findByText('Owner');

    expect(await screen.findByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Get link' }));

    expect(await screen.findByRole('textbox', { name: 'Link' })).toHaveValue(`${window.location.origin}/dashboard/v2-sample-1?token=tok-9`);
    expect(share.createLink).not.toHaveBeenCalled();
    expect(screen.queryByRole('switch', { name: 'Password protection' })).not.toBeInTheDocument();
  });

  it('keeps the dialog open and the edits when Apply fails', async () => {
    const share = fakeShareService({ shareWithUsers: vi.fn<ShareService['shareWithUsers']>().mockRejectedValue(new Error('Target user is not an editor')) });
    const { onClose } = setup({ share });
    await screen.findByText('Owner');

    await userEvent.type(screen.getByRole('combobox', { name: 'Add people and groups' }), 'an');
    await userEvent.click(await screen.findByText('Ann Lee', {}, { timeout: 2000 }));
    await apply();

    expect(await screen.findByText('Target user is not an editor')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(within(screen.getByRole('list', { name: 'People with access' })).getByText('Ann Lee')).toBeInTheDocument();
  });
});
