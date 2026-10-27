import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShareLevel } from '@/core/share/shareLevel';
import { UserProfile } from '@/core/user/UserProfile';
import type { PasswordDraft } from './link/sharePassword.utils';
import type { PersonRow } from './people/sharePeople.utils';
import { ShareDialogView } from './ShareDialogView';
import { embedCode, levelOptions, sharedSummary } from './share.utils';

const owner = new UserProfile({ username: 'root', full_name: 'root', email: 'hello@gmail.com' });
const people = [
  new UserProfile({ username: 'ann', full_name: 'Ann Lee', email: 'ann@example.com' }),
  new UserProfile({ username: 'bob', full_name: 'Bob Tran', email: 'bob@example.com' })
];
const suggestions = [new UserProfile({ username: 'cid', full_name: 'Cid Pham', email: 'cid@example.com' })];
const LINK = 'http://localhost:3000/dashboard/v2-sample-1?token=ba22832d-8cd6-482b-b858-f22aeee46634';
const noop = () => {};

interface PlaygroundProps {
  section: 'people' | 'link';
  /** A password is stored: shown as `********`. */
  storedPassword: boolean;
}

/** The dialog's two cards with local state in place of the server. */
function Playground({ section: initialSection, storedPassword }: PlaygroundProps) {
  const [section, setSection] = useState(initialSection);
  const [rows, setRows] = useState<PersonRow[]>(people.map((user, index) => ({ user, level: index === 0 ? ShareLevel.Edit : ShareLevel.View, isNew: false })));
  const [keyword, setKeyword] = useState('');
  const [linkLevel, setLinkLevel] = useState<ShareLevel>(ShareLevel.View);
  const [password, setPassword] = useState<PasswordDraft>({ enabled: storedPassword, keepStored: storedPassword, value: '' });
  const levels = levelOptions(true);
  const actions = { isApplying: false, onCancel: noop, onApply: noop };

  return (
    <div className="mx-auto max-w-[560px] bg-neutral-500 p-4">
      <ShareDialogView
        peopleSection={{
          expanded: section === 'people',
          summary: sharedSummary(rows.map(row => row.user.displayName)),
          onExpand: () => setSection('people'),
          people: {
            owner,
            rows,
            isLoading: false,
            onRetry: noop,
            onLevelChange: (username, level) => setRows(current => current.map(row => (row.user.username === username ? { ...row, level } : row)))
          },
          search: {
            keyword,
            users: suggestions,
            isLoading: false,
            onKeywordChange: setKeyword,
            onActivate: noop,
            onPick: user => setRows(current => [{ user, level: ShareLevel.View, isNew: true }, ...current])
          },
          levels,
          actions
        }}
        linkSection={{
          expanded: section === 'link',
          onExpand: () => setSection('link'),
          link: { url: LINK, level: linkLevel, isLoading: false, onLevelChange: setLinkLevel, onCopy: noop },
          levels,
          password: {
            draft: password,
            isReady: true,
            onToggle: enabled => setPassword(current => ({ ...current, enabled })),
            onType: value => setPassword(current => ({ ...current, value })),
            onReset: () => setPassword(current => ({ ...current, keepStored: false, value: '' }))
          },
          embedCode: embedCode('http://localhost:3000', 1, 'ba22832d'),
          actions
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Share/ShareDialog',
  component: Playground,
  args: { section: 'people', storedPassword: false }
} satisfies Meta<typeof Playground>;

export default meta;

type Story = StoryObj<typeof meta>;

export const People: Story = {};

export const GetLink: Story = { args: { section: 'link' } };

export const StoredPassword: Story = { args: { section: 'link', storedPassword: true } };
