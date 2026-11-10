/** Backend `UserGroup`: what a user may be given. `None` is the organization's owner, outside both groups. */
export const UserGroup = {
  Editor: 'Editor',
  Viewer: 'Viewer',
  None: 'None'
} as const;

export type UserGroup = (typeof UserGroup)[keyof typeof UserGroup];

export function toUserGroup(value: unknown): UserGroup {
  return value === UserGroup.Editor || value === UserGroup.Viewer ? value : UserGroup.None;
}
