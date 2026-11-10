import { Tag } from 'antd';

/** v1's Active / Suspended status of a user. */
export function UserStatusTag({ isActive }: { isActive: boolean }) {
  return isActive ? <Tag color="green">Active</Tag> : <Tag color="red">Suspended</Tag>;
}
