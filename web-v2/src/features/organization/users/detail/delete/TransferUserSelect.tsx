import { Select } from 'antd';
import { useUserSearch } from '@/shared/user/useUserSearch';

interface TransferUserSelectProps {
  /** The user being deleted, left out of the matches. */
  excludedUsername: string;
  value: string | undefined;
  onChange: (email: string | undefined) => void;
  disabled?: boolean;
}

/** Who gets the data: a user picked from the matches, not free text (v1 sent whatever was typed). */
export function TransferUserSelect({ excludedUsername, value, onChange, disabled }: TransferUserSelectProps) {
  const search = useUserSearch(username => username === excludedUsername);

  return (
    <Select
      showSearch={{ filterOption: false, onSearch: search.setKeyword }}
      allowClear
      aria-label="Transfer to"
      className="w-full"
      placeholder="Search a user by name or email"
      value={value}
      disabled={disabled}
      loading={search.isLoading}
      notFoundContent={search.error ?? (search.isLoading ? 'Searching...' : 'No users found')}
      onFocus={search.activate}
      onChange={email => onChange(email ?? undefined)}
      options={search.users
        .filter(profile => profile.email)
        .map(profile => ({ value: profile.email, label: `${profile.displayName} (${profile.email})` }))}
    />
  );
}
