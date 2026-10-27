import { describe, expect, it, vi } from 'vitest';
import { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import type { RelationshipService } from '@/core/relationship/RelationshipService';
import { databaseSchemaFromJson, type SchemaService } from '@/core/schema/SchemaService';
import { RELATIONSHIP_JSON, fixtureRelationshipService, fixtureSchemaService } from './relationship.fixtures';
import { ADHOC_DB_NAME, tableIdOf } from './relationship.utils';
import { loadRelationshipData, tableColumns } from './relationshipQueries';

const SALES_ID = tableIdOf('sample_v2', 'sales');
const ORDERS_ID = tableIdOf(ADHOC_DB_NAME, 'orders');
const REGIONS_ID = tableIdOf(ADHOC_DB_NAME, 'regions');

describe('tableColumns', () => {
  const database = databaseSchemaFromJson({
    name: 'db',
    tables: [
      {
        name: 't',
        columns: [
          { name: 'b', display_name: 'b', class_name: 'string' },
          { name: 'a', display_name: 'a', class_name: 'int64' }
        ]
      }
    ]
  });

  it('sorts columns by display name', () => {
    expect(tableColumns(database, 't')).toEqual([
      { name: 'a', type: 'int64' },
      { name: 'b', type: 'string' }
    ]);
  });

  it('does not reorder the schema it was given', () => {
    tableColumns(database, 't');
    expect(database.tables[0]?.columns.map(column => column.name)).toEqual(['b', 'a']);
  });

  it.each([
    [undefined, 't'],
    [database, 'missing']
  ])('is empty for an unknown table', (db, tbl) => {
    expect(tableColumns(db, tbl)).toEqual([]);
  });
});

describe('loadRelationshipData', () => {
  it('loads the relationships and the columns of every view', async () => {
    const schema = fixtureSchemaService();
    const getDatabase = vi.spyOn(schema, 'getDatabase');

    const { info, columns } = await loadRelationshipData(fixtureRelationshipService(), schema, 1);

    expect(info.views).toHaveLength(3);
    expect(getDatabase).toHaveBeenCalledTimes(1);
    expect(columns[SALES_ID]?.[0]).toEqual({ name: 'country', type: 'string' });
    expect(columns[ORDERS_ID]?.map(column => column.name)).toEqual([
      'order_id',
      'order_date',
      'ship_date',
      'order_priority',
      'sales_channel'
    ]);
    expect(columns[REGIONS_ID]).toHaveLength(3);
  });

  it('gives tables whose schema fails to load no columns', async () => {
    const schema: SchemaService = {
      listDatabases: vi.fn<SchemaService['listDatabases']>(async () => []),
      getDatabase: vi.fn<SchemaService['getDatabase']>(async () => {
        throw new Error('forbidden');
      }),
      detectTableSchema: vi.fn<SchemaService['detectTableSchema']>(async () => {
        throw new Error('bad query');
      })
    };

    const { columns } = await loadRelationshipData(fixtureRelationshipService(), schema, 1);

    expect(columns).toEqual({ [SALES_ID]: [], [ORDERS_ID]: [], [REGIONS_ID]: [] });
  });

  it('fails when the relationships fail to load', async () => {
    const relationships = fixtureRelationshipService();
    relationships.getDashboardRelationship = vi.fn<RelationshipService['getDashboardRelationship']>(async () => {
      throw new Error('No permission');
    });

    await expect(loadRelationshipData(relationships, fixtureSchemaService(), 1)).rejects.toThrow('No permission');
  });

  it('loads nothing more for a dashboard without views', async () => {
    const schema = fixtureSchemaService();
    const getDatabase = vi.spyOn(schema, 'getDatabase');

    const data = await loadRelationshipData(fixtureRelationshipService({ views: [] }), schema, 1);

    expect(data.columns).toEqual({});
    expect(getDatabase).not.toHaveBeenCalled();
  });

  it('reads the fixture as the backend sends it', () => {
    expect(new RelationshipInfo(RELATIONSHIP_JSON).relationships).toHaveLength(2);
  });
});
