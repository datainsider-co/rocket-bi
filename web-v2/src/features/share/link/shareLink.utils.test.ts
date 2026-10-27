import { describe, expect, it } from 'vitest';
import { PermissionToken } from '@/core/share/ResourceSharing';
import { ShareLevel } from '@/core/share/shareLevel';
import { linkChange, linkLevel } from './shareLink.utils';

const dashboardEntry = { type: 'directory', id: 8 } as const;
const viewToken = new PermissionToken({ token_id: 't', permissions: ['0:directory:view:8'] });

describe('linkLevel', () => {
  it('reads the token permissions on the resource', () => {
    expect(linkLevel(viewToken, dashboardEntry)).toBe(ShareLevel.View);
  });

  it.each([null, undefined])('is none without a link (%s)', token => {
    expect(linkLevel(token, dashboardEntry)).toBe(ShareLevel.None);
  });
});

describe('linkChange', () => {
  it('keeps the link when nothing was picked', () => {
    expect(linkChange(viewToken, dashboardEntry, undefined)).toEqual({ kind: 'keep' });
  });

  it('keeps the link when the level is the stored one', () => {
    expect(linkChange(viewToken, dashboardEntry, ShareLevel.View)).toEqual({ kind: 'keep' });
  });

  it('does nothing without a link', () => {
    expect(linkChange(null, dashboardEntry, ShareLevel.Edit)).toEqual({ kind: 'keep' });
  });

  it('revokes for Remove access', () => {
    expect(linkChange(viewToken, dashboardEntry, ShareLevel.None)).toEqual({ kind: 'revoke' });
  });

  it('updates to the actions of the new level', () => {
    expect(linkChange(viewToken, dashboardEntry, ShareLevel.ViewAndDownload)).toEqual({ kind: 'update', actions: ['view', 'download'] });
  });
});
