import { expect } from 'chai';
import { StringUtils } from '@/utils/StringUtils';
import { QueryUtils } from '@/screens/data-management/views/query-editor/QueryUtils';

describe('is Limit Query', () => {
  it('is have limit query with select * from database.table', () => {
    const query = 'select * from database.table';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(false);
  });

  it('is have limit query with select * from database.table limit 1', () => {
    const query = 'select * from database.table limit 1';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(true);
  });

  it('is have limit query with select * from database.table limit 1234567', () => {
    const query = 'select * from database.table limit 1234567';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(true);
  });

  it('is have limit query with select * from database.table limit database.table.limit', () => {
    const query = 'select * from database.table limit database.table.limit';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(false);
  });

  it('is have limit query with select * from limit.table', () => {
    const query = 'select * from limit.table';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(false);
  });

  it('is have limit query with select * from database.limit', () => {
    const query = 'select * from database.limit';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(false);
  });

  it('is have limit query with select country, count(population) from database.table limit 1233 group by country order by country', () => {
    const query = 'select country, count(population) from database.table limit 1233 group by country order by country';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(true);
  });

  it('is have limit query with select country, count(population) from database.table limit 1233 group by country order by country', () => {
    const query = 'select country, count(population) from database.table limit 1233 group by country order by country';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(true);
  });

  it('is have limit query with select country, count(population) from database.table limit 1233 group by country order by country', () => {
    const query = 'select country, count(population) from database.table limit 1233 group by country order by country';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(true);
  });

  it('is have limit query with select * from (select number from numbers(100) limit 20) where number > 10', () => {
    const query = 'select * from (select number from numbers(100) limit 20) where number > 10';
    const result = QueryUtils.isLimitQuery(query);
    expect(result).eq(true);
  });
});
