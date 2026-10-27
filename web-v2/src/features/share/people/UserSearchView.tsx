import { AutoComplete, Input } from 'antd';
import type { UserProfile } from '@/core/user/UserProfile';
import { UserItem } from './UserItem';

export interface UserSearchProps {
  keyword: string;
  users: readonly UserProfile[];
  isLoading: boolean;
  error?: string;
  onKeywordChange: (keyword: string) => void;
  /** First focus: the suggestions start loading. */
  onActivate: () => void;
  onPick: (user: UserProfile) => void;
}

/** v1 `SearchUserInput`: a filled input whose matches open below it; picking one adds the user. */
export function UserSearchView({ keyword, users, isLoading, error, onKeywordChange, onActivate, onPick }: UserSearchProps) {
  const notFound = error ?? (isLoading ? 'Loading...' : 'No user found');
  return (
    <AutoComplete
      className="w-full"
      value={keyword}
      options={users.map(user => ({ value: user.username, label: <UserItem user={user} /> }))}
      notFoundContent={notFound}
      onSearch={onKeywordChange}
      onFocus={onActivate}
      onSelect={(username: string) => {
        const user = users.find(item => item.username === username);
        if (user) onPick(user);
        onKeywordChange('');
      }}
    >
      <Input variant="filled" size="large" aria-label="Add people and groups" placeholder="Add people and groups" />
    </AutoComplete>
  );
}
