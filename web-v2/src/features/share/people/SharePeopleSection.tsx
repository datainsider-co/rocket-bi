import { Alert, Button, Skeleton, Typography } from 'antd';
import type { ShareLevel } from '@/core/share/shareLevel';
import type { UserProfile } from '@/core/user/UserProfile';
import type { LevelOption } from '../share.utils';
import { SectionHeader } from '../SectionHeader';
import { ShareCard } from '../ShareCard';
import type { SectionActions } from '../SectionFooter';
import { SectionFooter } from '../SectionFooter';
import type { PersonRow } from './sharePeople.utils';
import { PeopleListView } from './PeopleListView';
import type { UserSearchProps } from './UserSearchView';
import { UserSearchView } from './UserSearchView';

export interface PeopleState {
  owner: UserProfile | undefined;
  rows: readonly PersonRow[];
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
  onLevelChange: (username: string, level: ShareLevel) => void;
}

export interface SharePeopleSectionProps {
  expanded: boolean;
  /** "No one has been added yet" / "Shared with ...", shown while collapsed. */
  summary: string;
  onExpand: () => void;
  people: PeopleState;
  search: UserSearchProps;
  levels: readonly LevelOption[];
  actions: SectionActions;
}

/** "Share with people and group" (v1 `DiShareModal` header and body). */
export function SharePeopleSection({ expanded, summary, onExpand, people, search, levels, actions }: SharePeopleSectionProps) {
  if (!expanded) {
    return (
      <ShareCard label="Share with people and group" onExpand={onExpand}>
        <SectionHeader icon="people" title="Share with people and group" active={false} />
        <Typography.Text type="secondary" ellipsis className="text-base tracking-[0.27px]">
          {summary}
        </Typography.Text>
      </ShareCard>
    );
  }
  return (
    <ShareCard label="Share with people and group">
      <SectionHeader icon="people" title="Share with people and group" active />
      <UserSearchView {...search} />
      {people.error ? (
        <Alert type="error" showIcon title={people.error} action={<Button onClick={people.onRetry}>Retry</Button>} />
      ) : people.isLoading ? (
        <Skeleton avatar active paragraph={{ rows: 1 }} />
      ) : (
        <PeopleListView owner={people.owner} rows={people.rows} levels={levels} onLevelChange={people.onLevelChange} />
      )}
      <SectionFooter {...actions} />
    </ShareCard>
  );
}
