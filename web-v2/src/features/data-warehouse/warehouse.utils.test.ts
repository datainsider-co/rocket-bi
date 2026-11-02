import { describe, expect, it } from 'vitest';
import { getWarehouseSection, WarehouseSection } from './warehouse.utils';

describe('getWarehouseSection', () => {
  it.each([
    [WarehouseSection.Databases, 'All Databases', 'di-icon-database', '/data-warehouse/databases/all'],
    [WarehouseSection.Schema, 'Schema', 'di-icon-schema', '/data-warehouse/schema'],
    [WarehouseSection.QueryEditor, 'Query Analysis', 'di-icon-query-editor', '/data-warehouse/query-editor'],
    [WarehouseSection.Relationship, 'Relationship', 'di-icon-relationship', '/data-warehouse/relationship']
  ])('%s has v1 title, icon and path', (key, title, icon, path) => {
    expect(getWarehouseSection(key)).toEqual({ key, title, icon, path });
  });
});
