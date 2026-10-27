import { Avatar } from 'antd';
import { avatarColor } from './avatarColor';

interface UserAvatarProps {
  /** Shown name; its first letter stands in for a missing picture. */
  name: string;
  avatar?: string;
  size: number;
  className?: string;
}

/** v1's round user avatar: the picture, or the first letter on a color picked from the name. */
export function UserAvatar({ name, avatar, size, className = '' }: UserAvatarProps) {
  return (
    <Avatar
      size={size}
      src={avatar || undefined}
      className={`shrink-0 font-bold ${className}`}
      style={{ backgroundColor: avatarColor(name) }}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>
  );
}
