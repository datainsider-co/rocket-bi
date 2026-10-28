import { z } from 'zod';
import { JdbcDatabaseType, newJdbcSource, type JdbcSource, type JdbcSourceValues } from '@/core/ingestion/DataSource';
import { portError, requiredError } from '@/shared/form/fieldErrors';
import { fromPropertyRows, propertyKeyErrors, toPropertyRows } from '@/shared/properties/properties.utils';
import { JDBC_SOURCE_KINDS, type JdbcSourceKind } from '../sourceKinds';
import { buildJdbcUrl, OracleTarget, parseJdbcUrl } from './jdbcUrl.utils';

/**
 * One form for the six JDBC types (v1 had a `*FormRender` class each). Which fields show and are checked comes from
 * the type's `JdbcSourceKind`; fields a type doesn't use stay empty and are ignored by `formValuesToSource`.
 *
 * `rawUrl` edits the JDBC URL as text instead of host and port: always for Generic JDBC, and for a saved source whose
 * URL the fields can't hold (so saving never rewrites it into something else).
 */
export const sourceFormSchema = z
  .object({
    databaseType: z.enum(Object.values(JdbcDatabaseType) as [JdbcDatabaseType, ...JdbcDatabaseType[]]),
    displayName: z.string(),
    rawUrl: z.boolean(),
    jdbcUrl: z.string(),
    host: z.string(),
    port: z.string(),
    database: z.string(),
    oracleTarget: z.enum([OracleTarget.ServiceName, OracleTarget.Sid]),
    username: z.string(),
    password: z.string(),
    properties: z.array(z.object({ key: z.string(), value: z.string() }))
  })
  .superRefine((values, ctx) => {
    const fail = (path: (string | number)[], message: string | undefined) => {
      if (message) ctx.addIssue({ code: 'custom', path, message });
    };
    const kind = JDBC_SOURCE_KINDS[values.databaseType];

    fail(['displayName'], requiredError(values.displayName, 'Display name'));
    fail(['username'], requiredError(values.username, 'Username'));
    if (values.rawUrl) {
      fail(['jdbcUrl'], requiredError(values.jdbcUrl, 'JDBC URL'));
      return;
    }
    fail(['host'], requiredError(values.host, 'Host'));
    fail(['port'], portError(values.port, 'Port'));
    if (kind.database !== 'none') fail(['database'], requiredError(values.database, databaseLabel(kind, values.oracleTarget)));
    if (kind.properties) {
      propertyKeyErrors(values.properties).forEach((message, index) => fail(['properties', index, 'key'], message));
    }
  });

export type SourceFormValues = z.infer<typeof sourceFormSchema>;

/** v1's labels: "Database name", "Service name", or "SID" for an Oracle SID. */
export function databaseLabel(kind: JdbcSourceKind, oracleTarget: OracleTarget): string {
  if (kind.database !== 'oracle') return 'Database name';
  return oracleTarget === OracleTarget.Sid ? 'SID' : 'Service name';
}

/** Whether the form shows Properties: types whose URL takes them, edited as fields. */
export function showsProperties(kind: JdbcSourceKind, rawUrl: boolean): boolean {
  return kind.properties && !rawUrl;
}

/** An empty form for a new source of `databaseType`, with its default port and properties. */
export function newSourceFormValues(databaseType: JdbcDatabaseType): SourceFormValues {
  const kind = JDBC_SOURCE_KINDS[databaseType];
  return {
    databaseType,
    displayName: '',
    rawUrl: databaseType === JdbcDatabaseType.GenericJdbc,
    jdbcUrl: '',
    host: '',
    port: kind.defaultPort,
    database: '',
    oracleTarget: OracleTarget.ServiceName,
    username: '',
    password: '',
    properties: toPropertyRows(kind.defaultProperties)
  };
}

/** The form for a saved source: its URL split into fields when it can be. */
export function sourceToFormValues(source: JdbcSource): SourceFormValues {
  const base = {
    ...newSourceFormValues(source.databaseType),
    displayName: source.displayName,
    jdbcUrl: source.jdbcUrl,
    username: source.username,
    password: source.password,
    properties: []
  };
  if (source.databaseType === JdbcDatabaseType.GenericJdbc) return base;
  const endpoint = parseJdbcUrl(source.databaseType, source.jdbcUrl);
  if (!endpoint) return { ...base, rawUrl: true };
  return {
    ...base,
    rawUrl: false,
    host: endpoint.host,
    port: endpoint.port,
    database: endpoint.database,
    oracleTarget: endpoint.oracleTarget,
    properties: toPropertyRows(endpoint.properties)
  };
}

function toJdbcUrl(values: SourceFormValues): string {
  if (values.rawUrl || values.databaseType === JdbcDatabaseType.GenericJdbc) return values.jdbcUrl.trim();
  const kind = JDBC_SOURCE_KINDS[values.databaseType];
  return buildJdbcUrl(values.databaseType, {
    host: values.host.trim(),
    port: values.port.trim(),
    database: kind.database === 'none' ? '' : values.database.trim(),
    oracleTarget: values.oracleTarget,
    properties: kind.properties ? fromPropertyRows(values.properties) : {}
  });
}

/**
 * The source to send from valid form values: a new one, or `saved` with the edits merged on (it keeps its id and the
 * JSON fields v2 doesn't edit). Names, hosts and usernames are trimmed; passwords are not.
 */
export function formValuesToSource(values: SourceFormValues, saved?: JdbcSource): JdbcSource {
  const edits: JdbcSourceValues = {
    displayName: values.displayName.trim(),
    databaseType: values.databaseType,
    jdbcUrl: toJdbcUrl(values),
    username: values.username.trim(),
    password: values.password
  };
  return saved ? { ...saved, ...edits } : newJdbcSource(edits);
}

/** What the source form opens on: a new source of a type picked in the catalog, or a saved one. */
export type SourceFormTarget = { mode: 'create'; databaseType: JdbcDatabaseType } | { mode: 'edit'; source: JdbcSource };

export function initialSourceFormValues(target: SourceFormTarget): SourceFormValues {
  return target.mode === 'edit' ? sourceToFormValues(target.source) : newSourceFormValues(target.databaseType);
}
