import Deneric from 'deneric2';
import type { DenericSchema } from 'deneric2';
import type { ConnectionType } from './ConnectionType';
import { SshConfig } from './SshConfig';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Keeps keys exactly as sent. Not `Deneric.Map`: it reads and writes keys as dot paths, so a JDBC property such as
 * `ssl.mode` would turn into a nested object.
 */
function toProperties(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

/**
 * Fields every backend `Connection` shares. Audit fields are read only: the server fills them on save.
 * `tunnel_config` and `properties` are mapped by hand, see `toProperties` and `toJson`.
 */
export abstract class BaseConnection extends Deneric {
  abstract readonly className: ConnectionType;
  abstract readonly displayName: string;

  properties: Record<string, string> = {};
  tunnelConfig: SshConfig | undefined = undefined;
  createdBy = '';
  updatedBy = '';
  createdAt = 0;
  updatedAt = 0;

  protected constructor(schema: DenericSchema) {
    super({
      ...schema,
      createdBy: ['created_by', String, true],
      updatedBy: ['updated_by', String, true],
      createdAt: ['created_at', Number, true],
      updatedAt: ['updated_at', Number, true]
    });
  }

  /** Subclasses call this at the end of their constructor, once their own fields exist. */
  protected parse(json: unknown): void {
    this.fromJson(json);
    const source = isRecord(json) ? json : {};
    this.properties = toProperties(source.properties);
    this.tunnelConfig = isRecord(source.tunnel_config) ? new SshConfig(source.tunnel_config) : undefined;
  }

  override toJson(): Record<string, unknown> {
    return {
      ...(super.toJson() as Record<string, unknown>),
      class_name: this.className,
      properties: { ...this.properties },
      tunnel_config: this.tunnelConfig?.toJson()
    };
  }
}
