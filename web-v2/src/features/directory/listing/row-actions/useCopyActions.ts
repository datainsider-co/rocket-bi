import { useState } from 'react';
import { App } from 'antd';
import { useNavigate } from 'react-router';
import type { Directory } from '@/core/directory/Directory';
import { useCurrentUser } from '@/features/auth/current-user/useCurrentUser';
import { needsPassword, passwordError } from '@/features/dashboard/access/access.utils';
import { copyDestinationPath, typeLabel } from '../../directory.utils';
import { useDirectoryMutations } from '../../useDirectoryMutations';

/** A copy that waits for the source's password. */
interface LockedCopy {
  directory: Directory;
  parentId: number;
  /** Where to go once the copy is made (Copy); Duplicate stays in the listing. */
  destination?: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

/**
 * v1 "Duplicate" and "Copy" of a dashboard or saved query: Duplicate copies it into `parentId`, the folder the
 * listing creates in; Copy asks for a folder first and opens it afterwards. A source with a password asks for it
 * before anything is copied, of everyone but its owner (v1 `PasswordModal.requirePassword`).
 */
export function useCopyActions(parentId: number) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { copy } = useDirectoryMutations();
  const username = useCurrentUser().data?.userInfo.username ?? '';
  const [picking, setPicking] = useState<Directory | null>(null);
  const [locked, setLocked] = useState<LockedCopy | null>(null);

  const run = async ({ directory, parentId: toParentId, destination }: LockedCopy) => {
    const done = message.loading(`Copying ${typeLabel(directory.directoryType)} '${directory.name}'...`, 0);
    try {
      await copy.mutateAsync({ directory, parentId: toParentId });
      if (destination) void navigate(destination);
    } catch (error) {
      void message.error(errorMessage(error));
    } finally {
      done();
    }
  };

  const start = (request: LockedCopy) => {
    const { directory } = request;
    const source = { passwordEnabled: directory.passwordEnabled, ownerId: directory.owner.username || directory.ownerId };
    if (needsPassword(source, username)) setLocked(request);
    else void run(request);
  };

  return {
    duplicate: (directory: Directory) => start({ directory, parentId }),
    picker: {
      target: picking,
      open: (directory: Directory) => setPicking(directory),
      submit: (toParentId: number, folderName: string) => {
        const directory = picking;
        setPicking(null);
        if (directory) start({ directory, parentId: toParentId, destination: copyDestinationPath(toParentId, folderName) });
      },
      cancel: () => setPicking(null)
    },
    password: {
      target: locked?.directory ?? null,
      /** Copies when the password is right; else says why not. */
      unlock: (password: string): string | undefined => {
        if (!locked) return undefined;
        const error = passwordError(password, locked.directory.hashedPassword);
        if (!error) {
          setLocked(null);
          void run(locked);
        }
        return error;
      },
      cancel: () => setLocked(null)
    }
  };
}
