import { useState } from 'react';
import { AutoComplete, Input } from 'antd';
import type { UserProfile } from '@/core/user/UserProfile';
import { UserItem } from '@/features/share/people/UserItem';
import { CustomDialog } from '../dialogs/CustomDialog';
import { attributeChips } from './viewAs.utils';
import './ViewAsModal.css';

interface ViewAsModalViewProps {
  /** The users matching what is typed. */
  users: readonly UserProfile[];
  loading: boolean;
  onSearch: (keyword: string) => void;
  /** The username picked. */
  onPick: (username: string) => void;
  onCancel: () => void;
}

/**
 * v1 `RLSViewAsModal`: type a name or an email, pick one of the matches below the field, and the user shows under it
 * with their attributes (what row level security filters on). Apply then shows the dashboard as they would see it.
 */
export function ViewAsModalView({ users, loading, onSearch, onPick, onCancel }: ViewAsModalViewProps) {
  const [keyword, setKeyword] = useState('');
  const [picked, setPicked] = useState<UserProfile>();
  const search = (text: string) => {
    setKeyword(text);
    onSearch(text);
  };
  return (
    <CustomDialog title="View As" okText="Apply" width={560} className="view-as-dialog" okDisabled={!picked} onOk={() => picked && onPick(picked.username)} onCancel={onCancel}>
      <label htmlFor="view-as-user" className="custom-dialog__label view-as-dialog__label">
        Select user
      </label>
      <AutoComplete
        className="w-full"
        value={keyword}
        // v1 opens the matches once something is typed.
        open={keyword.trim() === '' ? false : undefined}
        options={users.map(user => ({ value: user.username, label: <UserItem user={user} /> }))}
        notFoundContent={loading ? 'Loading...' : 'Sorry, no matching options.'}
        onSearch={search}
        onSelect={(username: string) => {
          setPicked(users.find(user => user.username === username));
          search('');
        }}
      >
        <Input id="view-as-user" autoComplete="off" placeholder="Select user..." />
      </AutoComplete>
      {picked && (
        <>
          <div className="view-as-dialog__user">
            <UserItem user={picked} />
          </div>
          <div className="view-as-dialog__attributes">
            {attributeChips(picked).map(chip => (
              <span key={chip} className="view-as-dialog__chip" title={chip}>
                {chip}
              </span>
            ))}
          </div>
        </>
      )}
    </CustomDialog>
  );
}
