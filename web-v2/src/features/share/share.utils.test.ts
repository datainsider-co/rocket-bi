import { describe, expect, it } from 'vitest';
import { Directory } from '@/core/directory/Directory';
import { ShareLevel } from '@/core/share/shareLevel';
import { ShareLinkKind, directoryShare, embedCode, levelOptions, linkSummary, shareLink, sharedSummary } from './share.utils';

describe('levelOptions', () => {
  it('lists v1 levels, highest first', () => {
    expect(levelOptions(true)).toEqual([
      { value: 'edit', label: 'Edit' },
      { value: 'view_and_download', label: 'View & Download' },
      { value: 'view', label: 'View' },
      { value: 'none', label: 'Remove access' }
    ]);
  });

  it('leaves View & Download out when the resource has no download', () => {
    expect(levelOptions(false).map(option => option.value)).toEqual(['edit', 'view', 'none']);
  });
});

describe('sharedSummary', () => {
  it('says no one when the list is empty', () => {
    expect(sharedSummary([])).toBe('No one has been added yet');
  });

  it('names the users', () => {
    expect(sharedSummary(['Ann', 'Bob'])).toBe('Shared with Ann, Bob');
  });

  it('names the first ten only', () => {
    const names = Array.from({ length: 12 }, (_, index) => `u${index}`);
    expect(sharedSummary(names)).toBe(`Shared with ${names.slice(0, 10).join(', ')}`);
  });
});

describe('linkSummary', () => {
  it.each([
    [ShareLevel.Edit, 'edit'],
    [ShareLevel.ViewAndDownload, 'view'],
    [ShareLevel.View, 'view'],
    [ShareLevel.None, 'view']
  ])('says %s as %s', (level, word) => {
    expect(linkSummary(level)).toBe(`Anyone on the internet with this link can ${word}`);
  });
});

describe('shareLink', () => {
  const params = { origin: 'http://bi.test', target: { id: 8, name: 'v2 Sample' }, dashboardId: 1, tokenId: 'tok-1' };

  it('opens a dashboard by <slug>-<dashboard id>', () => {
    expect(shareLink(ShareLinkKind.Dashboard, params)).toBe('http://bi.test/dashboard/v2-sample-1?token=tok-1');
  });

  it('opens a folder by <slug>-<directory id> under /shared', () => {
    expect(shareLink(ShareLinkKind.Folder, { ...params, target: { id: 7, name: '123' }, dashboardId: undefined })).toBe(
      'http://bi.test/shared/123-7?token=tok-1'
    );
  });

  it('opens a query in the query editor', () => {
    expect(shareLink(ShareLinkKind.Query, { ...params, dashboardId: 4 })).toBe('http://bi.test/data-warehouse/query-editor?token=tok-1&adhoc=4');
  });

  it('encodes the token', () => {
    expect(shareLink(ShareLinkKind.Folder, { ...params, tokenId: 'a b&c' })).toBe('http://bi.test/shared/v2-sample-8?token=a%20b%26c');
  });
});

describe('embedCode', () => {
  it("is v1's iframe on the embedded route", () => {
    expect(embedCode('http://bi.test', 1, 'tok-1')).toBe(
      '<iframe id="datainsider-dashboard-iframe" width="1280" height="720" src="http://bi.test/embedded/dashboard/1?token=tok-1" title="RocketBI Dashboard" frameborder="0"></iframe>'
    );
  });
});

describe('directoryShare', () => {
  const owner = { username: 'root', full_name: 'root' };

  it('shares a folder with a folder link', () => {
    const folder = new Directory({ id: 7, name: '123', owner, directory_type: 'directory' });
    expect(directoryShare(folder)).toEqual({
      target: { type: 'directory', id: 7, name: '123', owner: 'root' },
      options: { link: 'folder' }
    });
  });

  it('shares a dashboard with its link, password and embed code', () => {
    const dashboard = new Directory({ id: 8, name: 'v2 Sample', owner, directory_type: 'dashboard', dashboard_id: 1 });
    expect(directoryShare(dashboard)).toEqual({
      target: { type: 'directory', id: 8, name: 'v2 Sample', owner: 'root' },
      options: { link: 'dashboard', dashboardId: 1, password: true, embed: true }
    });
  });

  it('shares a query with its link and password', () => {
    const query = new Directory({ id: 9, name: 'q', owner, directory_type: 'queries', dashboard_id: 4 });
    expect(directoryShare(query).options).toEqual({ link: 'query', dashboardId: 4, password: true });
  });

  it('falls back to owner_id when the owner is not sent', () => {
    const folder = new Directory({ id: 7, name: '123', owner_id: 'ann', directory_type: 'directory' });
    expect(directoryShare(folder).target.owner).toBe('ann');
  });
});
