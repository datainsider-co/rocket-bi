import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/current-user/useCurrentUser';
import type { ShareLinkSectionProps } from './link/ShareLinkSection';
import { useShareLink } from './link/useShareLink';
import { useSharePassword } from './link/useSharePassword';
import type { SharePeopleSectionProps } from './people/SharePeopleSection';
import { useSharePeople } from './people/useSharePeople';
import { useUserSearch } from './people/useUserSearch';
import type { ShareOptions, ShareTarget } from './share.utils';
import { embedCode, levelOptions, peopleResourceOf, shareLink, sharedSummary } from './share.utils';
import { useApplyShare } from './useApplyShare';
import { useCopyText } from './useCopyText';

/** The two sections are never open together (v1). */
type Section = 'people' | 'link';

export interface ShareDialogParams {
  target: ShareTarget;
  options: ShareOptions;
  /** After Apply succeeded: the caller refreshes what it shows. */
  onShared: () => void;
  onClose: () => void;
  /** Where links point; the page's own origin. */
  origin: string;
}

/** v1 `DiShareModal`: people and link, edited apart and applied together. */
export function useShareDialog({ target, options, onShared, onClose, origin }: ShareDialogParams) {
  const resource = peopleResourceOf(target);
  const directoryId = target.type === 'directory' ? target.id : undefined;
  const [section, setSection] = useState<Section>('people');
  const username = useCurrentUser().data?.userInfo.username;
  const people = useSharePeople(resource);
  const search = useUserSearch(people.isListed);
  // A database has neither link nor password: both hooks run switched off, on a directory id they never read.
  const link = useShareLink({ type: 'directory', id: directoryId ?? 0 }, options.link !== undefined && directoryId !== undefined);
  const hasPassword = options.password === true && directoryId !== undefined && username !== undefined && username === target.owner;
  const password = useSharePassword(directoryId ?? 0, hasPassword);
  const copy = useCopyText();
  const apply = useApplyShare(() => {
    onShared();
    onClose();
  });

  // v1 offered View & Download on directories only.
  const levels = levelOptions(target.type === 'directory');
  const actions = {
    isApplying: apply.isPending,
    onCancel: onClose,
    onApply: () => apply.mutate({ resource, people: people.changes(), link: link.change(), password: password.change() })
  };
  const tokenId = link.tokenId;
  const linkParams = { origin, target: { id: directoryId ?? 0, name: target.name }, dashboardId: options.dashboardId, tokenId: tokenId ?? '' };

  const peopleSection: SharePeopleSectionProps = {
    expanded: section === 'people',
    summary: sharedSummary(people.sharedNames),
    onExpand: () => setSection('people'),
    people: {
      owner: people.owner,
      rows: people.rows,
      isLoading: people.isLoading,
      error: people.error,
      onRetry: people.retry,
      onLevelChange: people.setLevel
    },
    search: {
      keyword: search.keyword,
      users: search.users,
      isLoading: search.isLoading,
      error: search.error,
      onKeywordChange: search.setKeyword,
      onActivate: search.activate,
      onPick: people.add
    },
    levels,
    actions
  };

  const linkSection: ShareLinkSectionProps | undefined = options.link && {
    expanded: section === 'link',
    onExpand: () => {
      setSection('link');
      void link.ensure();
    },
    link: {
      url: tokenId ? shareLink(options.link, linkParams) : undefined,
      level: link.level,
      isLoading: link.isLoading,
      error: link.error,
      onLevelChange: link.setLevel,
      onCopy: text => void copy(text)
    },
    levels,
    password: hasPassword
      ? { draft: password.draft, isReady: password.isReady, onToggle: password.toggle, onType: password.type, onReset: password.reset }
      : undefined,
    embedCode: options.embed && tokenId && options.dashboardId !== undefined ? embedCode(origin, options.dashboardId, tokenId) : undefined,
    actions
  };

  return { peopleSection, linkSection };
}
