import { useState } from 'react';
import type { SuggestedUser } from '@/core/user/UserService';
import { useUserSuggestions } from './useUserSuggestions';
import { findUser, userOptions } from './viewAs.utils';
import { ViewAsModalView } from './ViewAsModalView';

interface ViewAsModalProps {
  onPick: (user: SuggestedUser) => void;
  onCancel: () => void;
}

/** The user search of View As. Mount it while picking, so it starts empty each time. */
export function ViewAsModal({ onPick, onCancel }: ViewAsModalProps) {
  const [keyword, setKeyword] = useState('');
  const suggestions = useUserSuggestions(keyword, true);
  const users = suggestions.data?.users ?? [];
  return (
    <ViewAsModalView
      options={userOptions(users)}
      loading={suggestions.isFetching}
      onSearch={setKeyword}
      onPick={username => {
        const user = findUser(users, username);
        if (user) onPick(user);
      }}
      onCancel={onCancel}
    />
  );
}
