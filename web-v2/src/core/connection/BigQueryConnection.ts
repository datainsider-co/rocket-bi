import { BaseConnection } from './BaseConnection';
import { ConnectionType } from './ConnectionType';

/**
 * Backend `BigQueryConnection`. `credentials` is the service account key, a JSON document kept as the text the user
 * pasted. It has neither SSH tunnel nor properties, so those are never sent.
 */
export class BigQueryConnection extends BaseConnection {
  readonly className = ConnectionType.BigQuery;
  readonly displayName = 'BigQuery';

  projectId = '';
  credentials = '';
  /** A value of `BIGQUERY_LOCATIONS`; empty when unset. */
  location = '';

  constructor(json?: unknown) {
    super({
      projectId: ['project_id', String],
      credentials: ['credentials', String],
      location: ['location', String, true]
    });
    this.parse(json);
    this.properties = {};
    this.tunnelConfig = undefined;
  }

  override toJson(): Record<string, unknown> {
    const { tunnel_config: _tunnel, properties: _properties, ...json } = super.toJson();
    return { ...json, location: this.location || undefined };
  }
}
