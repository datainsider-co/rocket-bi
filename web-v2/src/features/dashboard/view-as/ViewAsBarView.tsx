import type { SuggestedUser } from '@/core/user/UserService';
import { HeaderButton } from '../header/HeaderButton';
import './ViewAsBar.css';

interface ViewAsBarViewProps {
  user: SuggestedUser;
  onChange: () => void;
  onExit: () => void;
}

/** v1's RLS View As mode in the header: who the dashboard is shown as, to pick another, and the way out. */
export function ViewAsBarView({ user, onChange, onExit }: ViewAsBarViewProps) {
  const { profile } = user;
  return (
    <span className="view-as-bar">
      <button type="button" className="view-as-bar__user" title={profile.email} onClick={onChange}>
        <i className="di-icon-view-as" aria-hidden />
        View As:
        <strong>{profile.displayName}</strong>
      </button>
      <HeaderButton icon="di-icon-exit-view-as" title="Exit View As" onClick={onExit} />
    </span>
  );
}
