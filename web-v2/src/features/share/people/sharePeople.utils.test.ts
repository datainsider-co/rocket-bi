import { describe, expect, it } from 'vitest';
import { ResourceSharing } from '@/core/share/ResourceSharing';
import { ShareLevel } from '@/core/share/shareLevel';
import { UserProfile } from '@/core/user/UserProfile';
import type { PeopleDraft } from './sharePeople.utils';
import { EMPTY_PEOPLE_DRAFT, hasPeopleChanges, listedUsernames, peopleChanges, peopleDraftReducer, personRows } from './sharePeople.utils';

const folder = { type: 'directory', id: 7 } as const;
const ann = new UserProfile({ username: 'ann', full_name: 'Ann' });
const bob = new UserProfile({ username: 'bob', full_name: 'Bob' });

/** Reply of `GET share/directory/7`: root owns it, Cid can view, Dan can edit. */
const sharing = new ResourceSharing({
  owner: { username: 'root', full_name: 'root' },
  total_user_sharing: 2,
  users_sharing: [
    { id: 's_1', user: { username: 'cid', full_name: 'Cid' }, permissions: ['0:directory:view:7'] },
    { id: 's_2', user: { username: 'dan', full_name: 'Dan' }, permissions: ['0:directory:view:7', '0:directory:edit:7'] }
  ]
});

function draftOf(...actions: Parameters<typeof peopleDraftReducer>[1][]): PeopleDraft {
  return actions.reduce(peopleDraftReducer, EMPTY_PEOPLE_DRAFT);
}

describe('peopleDraftReducer', () => {
  it('adds a user on top with View', () => {
    const draft = draftOf({ type: 'add', user: ann }, { type: 'add', user: bob });
    expect(draft.added.map(user => user.username)).toEqual(['bob', 'ann']);
    expect(draft.levels).toEqual({ ann: 'view', bob: 'view' });
  });

  it('ignores a user added twice, keeping the level picked', () => {
    const first = draftOf({ type: 'add', user: ann }, { type: 'setLevel', username: 'ann', level: ShareLevel.Edit });
    expect(peopleDraftReducer(first, { type: 'add', user: ann })).toBe(first);
  });

  it('sets a level by username', () => {
    expect(draftOf({ type: 'setLevel', username: 'cid', level: ShareLevel.None }).levels).toEqual({ cid: 'none' });
  });

  it('resets', () => {
    expect(peopleDraftReducer(draftOf({ type: 'add', user: ann }), { type: 'reset' })).toBe(EMPTY_PEOPLE_DRAFT);
  });

  it('does not change the draft it is given', () => {
    const draft = draftOf({ type: 'add', user: ann });
    peopleDraftReducer(draft, { type: 'add', user: bob });
    peopleDraftReducer(draft, { type: 'setLevel', username: 'ann', level: ShareLevel.Edit });
    expect(draft).toEqual({ added: [ann], levels: { ann: 'view' } });
  });
});

describe('personRows', () => {
  it('lists added users first, then the shared ones with their level', () => {
    const rows = personRows(sharing, draftOf({ type: 'add', user: ann }), folder);
    expect(rows.map(row => [row.user.username, row.level, row.isNew])).toEqual([
      ['ann', 'view', true],
      ['cid', 'view', false],
      ['dan', 'edit', false]
    ]);
  });

  it('shows the level picked over the stored one', () => {
    const rows = personRows(sharing, draftOf({ type: 'setLevel', username: 'dan', level: ShareLevel.View }), folder);
    expect(rows.find(row => row.user.username === 'dan')?.level).toBe('view');
  });

  it('shows an added user once the server lists them', () => {
    const rows = personRows(sharing, draftOf({ type: 'add', user: new UserProfile({ username: 'cid' }) }), folder);
    expect(rows.filter(row => row.user.username === 'cid')).toHaveLength(1);
  });

  it('lists only added users while the sharing loads', () => {
    expect(personRows(undefined, draftOf({ type: 'add', user: ann }), folder).map(row => row.user.username)).toEqual(['ann']);
  });
});

describe('listedUsernames', () => {
  it('holds the owner, the shared and the added users', () => {
    expect([...listedUsernames(sharing, draftOf({ type: 'add', user: ann }))].sort()).toEqual(['ann', 'cid', 'dan', 'root']);
  });

  it('is empty before anything loads', () => {
    expect(listedUsernames(undefined, EMPTY_PEOPLE_DRAFT).size).toBe(0);
  });
});

describe('peopleChanges', () => {
  it('sends nothing without edits', () => {
    const changes = peopleChanges(sharing, EMPTY_PEOPLE_DRAFT, folder);
    expect(changes).toEqual({ create: {}, edit: {}, revoke: [] });
    expect(hasPeopleChanges(changes)).toBe(false);
  });

  it('creates added users by username with the actions of their level', () => {
    const draft = draftOf({ type: 'add', user: ann }, { type: 'add', user: bob }, { type: 'setLevel', username: 'bob', level: ShareLevel.ViewAndDownload });
    expect(peopleChanges(sharing, draft, folder).create).toEqual({ ann: ['view'], bob: ['view', 'download'] });
  });

  it('skips an added user set to Remove access', () => {
    const draft = draftOf({ type: 'add', user: ann }, { type: 'setLevel', username: 'ann', level: ShareLevel.None });
    expect(hasPeopleChanges(peopleChanges(sharing, draft, folder))).toBe(false);
  });

  it('edits shared users by share id', () => {
    const draft = draftOf({ type: 'setLevel', username: 'cid', level: ShareLevel.Edit });
    expect(peopleChanges(sharing, draft, folder).edit).toEqual({ s_1: ['view', 'download', 'edit', 'copy', 'delete', 'create'] });
  });

  it('revokes shared users set to Remove access', () => {
    const changes = peopleChanges(sharing, draftOf({ type: 'setLevel', username: 'dan', level: ShareLevel.None }), folder);
    expect(changes).toEqual({ create: {}, edit: {}, revoke: ['dan'] });
    expect(hasPeopleChanges(changes)).toBe(true);
  });

  it('sends nothing for a user set back to their level', () => {
    const draft = draftOf(
      { type: 'setLevel', username: 'dan', level: ShareLevel.View },
      { type: 'setLevel', username: 'dan', level: ShareLevel.Edit }
    );
    expect(hasPeopleChanges(peopleChanges(sharing, draft, folder))).toBe(false);
  });

  it('ignores levels of users nobody lists', () => {
    expect(hasPeopleChanges(peopleChanges(sharing, draftOf({ type: 'setLevel', username: 'zed', level: ShareLevel.Edit }), folder))).toBe(false);
  });
});
