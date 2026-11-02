import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { newEtlJob, type EtlJob } from '@/core/data-cook/EtlJob';
import { UserProfile } from '@/core/user/UserProfile';
import { formatDateTime } from '@/shared/listing/listing.utils';
import { DataCookSection } from '../dataCook.utils';
import {
  DEFAULT_ETL_SORT,
  deleteForeverText,
  emptyEtlText,
  etlListingOf,
  etlOwnerName,
  etlRefetchInterval,
  forceRunMessage,
  forceRunTime,
  isPastDay,
  isRunActive,
  nextRunLabel,
  restoreEtlText,
  RUNNING_POLL_MS,
  toEtlSortField,
  trashEtlText
} from './etlListing.utils';

const NOW = dayjs('2026-11-02T10:30:00').valueOf();
const HOUR = 3_600_000;

function etl(overrides: Partial<EtlJob> = {}): EtlJob {
  return { ...newEtlJob('Sales'), ...overrides };
}

const daily = { kind: 'daily', recurEvery: 1, startTime: 0 } as const;

describe('DEFAULT_ETL_SORT', () => {
  it('is the newest ETL first', () => {
    expect(DEFAULT_ETL_SORT).toEqual({ field: 'created_time', order: 'DESC' });
  });
});

describe('etlListingOf', () => {
  it.each([
    [DataCookSection.MyEtl, 'mine'],
    [DataCookSection.Shared, 'shared'],
    [DataCookSection.Trash, 'trash'],
    [DataCookSection.History, 'mine']
  ] as const)('%s → %s', (section, listing) => {
    expect(etlListingOf(section)).toBe(listing);
  });
});

describe('toEtlSortField', () => {
  it.each(['display_name', 'created_time', 'last_execute_time', 'next_execute_time'])('accepts %s', key => {
    expect(toEtlSortField(key)).toBe(key);
  });

  it.each(['status', 'displayName', 'owner', '', undefined, null, 1])('rejects %j', key => {
    expect(toEtlSortField(key)).toBeUndefined();
  });
});

describe('etlOwnerName', () => {
  it('is the owner profile name', () => {
    const owner = new UserProfile({ username: 'root', full_name: 'Root User' });
    expect(etlOwnerName({ owner, ownerId: 'root' })).toBe(owner.displayName);
  });

  it('falls back to the owner id, then Unknown', () => {
    expect(etlOwnerName({ owner: undefined, ownerId: 'root' })).toBe('root');
    expect(etlOwnerName({ owner: undefined, ownerId: '' })).toBe('Unknown');
  });
});

describe('nextRunLabel', () => {
  const scheduled = etl({ scheduleTime: daily, nextExecuteTime: NOW + HOUR, status: 'Done' });

  it('shows the next run of a scheduled ETL', () => {
    expect(nextRunLabel(scheduled, 'mine')).toBe(formatDateTime(NOW + HOUR));
    expect(nextRunLabel(scheduled, 'shared')).toBe(formatDateTime(NOW + HOUR));
  });

  it('shows -- in the trash', () => {
    expect(nextRunLabel(scheduled, 'trash')).toBe('--');
  });

  it("shows -- when the server has no next run (Long.MaxValue)", () => {
    expect(nextRunLabel({ ...scheduled, nextExecuteTime: Number(JSON.parse("9223372036854775807")) }, 'mine')).toBe('--');
  });
});

describe('emptyEtlText', () => {
  it('says the search matched nothing, whatever the listing', () => {
    expect(emptyEtlText('mine', ' sales ')).toBe('No ETL matches "sales"');
    expect(emptyEtlText('trash', 'sales')).toBe('No ETL matches "sales"');
  });

  it.each([
    ['mine', 'Add your first ETL'],
    ['shared', "You don't have any ETL yet"],
    ['trash', 'The trash is empty']
  ] as const)('%s without a search: %s', (listing, text) => {
    expect(emptyEtlText(listing, '  ')).toBe(text);
  });
});

describe('isRunActive', () => {
  it.each(['Queued', 'Running', 'Syncing'] as const)('is true while %s', status => {
    expect(isRunActive(etl({ status }), NOW)).toBe(true);
  });

  it('is true for a forced run waiting for the scheduler', () => {
    expect(isRunActive(etl({ scheduleTime: daily, status: 'Initialized', nextExecuteTime: NOW - 1 }), NOW)).toBe(true);
  });

  it('is false before the next run, or without one', () => {
    expect(isRunActive(etl({ scheduleTime: daily, status: 'Done', nextExecuteTime: NOW + HOUR }), NOW)).toBe(false);
    expect(isRunActive(etl({ status: 'Error', nextExecuteTime: NOW - 1 }), NOW)).toBe(false);
  });
});

describe('etlRefetchInterval', () => {
  it('polls while an ETL of the page runs', () => {
    expect(etlRefetchInterval([etl({ status: 'Done' }), etl({ status: 'Running' })], NOW)).toBe(RUNNING_POLL_MS);
  });

  it('does not poll otherwise', () => {
    expect(etlRefetchInterval([etl({ status: 'Done' })], NOW)).toBe(false);
    expect(etlRefetchInterval([], NOW)).toBe(false);
    expect(etlRefetchInterval(undefined, NOW)).toBe(false);
  });
});

describe('confirm texts', () => {
  it('names the ETL', () => {
    expect(trashEtlText({ displayName: 'Sales' })).toContain("'Sales'");
    expect(deleteForeverText({ displayName: 'Sales' })).toContain("'Sales' forever");
    expect(restoreEtlText({ displayName: 'Sales' })).toBe("Are you sure to restore 'Sales'?");
  });
});

describe('forceRunTime', () => {
  it('is now for today', () => {
    expect(forceRunTime(dayjs(NOW).startOf('day'), NOW)).toBe(NOW);
  });

  it('is the start of a later day', () => {
    const day = dayjs('2026-11-05T15:00:00');
    expect(forceRunTime(day, NOW)).toBe(dayjs('2026-11-05T00:00:00').valueOf());
  });
});

describe('isPastDay', () => {
  it.each([
    ['2026-11-01T23:59:59', true],
    ['2026-11-02T00:00:00', false],
    ['2026-11-03T00:00:00', false]
  ])('%s → %s', (day, expected) => {
    expect(isPastDay(dayjs(day), NOW)).toBe(expected);
  });
});

describe('forceRunMessage', () => {
  it('says now for a run that is due', () => {
    expect(forceRunMessage(NOW, NOW)).toBe('The ETL will run now');
  });

  it('says when a later run starts', () => {
    expect(forceRunMessage(NOW + HOUR, NOW)).toBe(`The ETL will run at ${formatDateTime(NOW + HOUR)}`);
  });
});
