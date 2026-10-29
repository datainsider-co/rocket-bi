import { describe, expect, it } from 'vitest';
import { databaseEntryFromJson, type DatabaseEntry } from '@/core/schema/DatabaseService';
import fixture from '@/core/schema/warehouse.fixture.json';
import { UserProfile } from '@/core/user/UserProfile';
import {
  compareDatabases,
  deleteDatabaseText,
  filterDatabaseEntries,
  formatCreatedTime,
  ownerName,
  schemaPathOf
} from './databases.utils';

function entry(name: string, extra: Partial<DatabaseEntry> = {}): DatabaseEntry {
  return { name, displayName: name, creatorId: '', createdTime: 0, updatedTime: 0, owner: undefined, ...extra };
}

const sales = entry('sales_2026', { displayName: 'Sales 2026', createdTime: 2 });
const hr = entry('hr', { createdTime: 1, owner: new UserProfile({ username: 'root', full_name: 'Root' }) });
const shop = entry('shop', { creatorId: 'up-1', createdTime: 3 });

describe('filterDatabaseEntries', () => {
  it('matches the display name or the name, ignoring case', () => {
    expect(filterDatabaseEntries([sales, hr, shop], 'SALES')).toEqual([sales]);
    expect(filterDatabaseEntries([sales, hr, shop], '_2026')).toEqual([sales]);
  });

  it('keeps everything for a blank search, as a copy', () => {
    const entries = [sales, hr];
    const shown = filterDatabaseEntries(entries, '  ');
    expect(shown).toEqual(entries);
    expect(shown).not.toBe(entries);
  });

  it('finds nothing', () => {
    expect(filterDatabaseEntries([sales], 'zzz')).toEqual([]);
    expect(filterDatabaseEntries([], 'a')).toEqual([]);
  });
});

describe('ownerName', () => {
  it('prefers the owner, then the creator id, then Unknown', () => {
    expect(ownerName(hr)).toBe('Root');
    expect(ownerName(shop)).toBe('up-1');
    expect(ownerName(sales)).toBe('Unknown');
  });

  it('reads the owner of a database created through the API', () => {
    expect(ownerName(databaseEntryFromJson(fixture.multiGets.response[0]))).toBe('root');
  });
});

describe('formatCreatedTime', () => {
  it('formats like v1 and shows -- when unknown', () => {
    expect(formatCreatedTime(new Date(2026, 9, 30, 13, 5).getTime())).toBe('Oct 30, 2026 01:05 PM');
    expect(formatCreatedTime(0)).toBe('--');
  });
});

describe('compareDatabases', () => {
  it('sorts by display name, owner and created time', () => {
    expect([shop, sales, hr].sort(compareDatabases.name).map(item => item.name)).toEqual(['hr', 'sales_2026', 'shop']);
    expect([sales, shop, hr].sort(compareDatabases.owner).map(item => item.name)).toEqual(['hr', 'sales_2026', 'shop']);
    expect([shop, sales, hr].sort(compareDatabases.createdTime).map(item => item.name)).toEqual(['hr', 'sales_2026', 'shop']);
  });
});

describe('schemaPathOf', () => {
  it('opens the database on the Schema page', () => {
    expect(schemaPathOf('dw0_probe')).toBe('/data-warehouse/schema?database=dw0_probe');
    expect(schemaPathOf('a&b')).toBe('/data-warehouse/schema?database=a%26b');
  });
});

describe('deleteDatabaseText', () => {
  it("names the database by its display name", () => {
    expect(deleteDatabaseText(sales)).toBe("Are you sure you want to permanently delete database 'Sales 2026'?");
  });
});
