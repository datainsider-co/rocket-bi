import Deneric from 'deneric2';

export const DEFAULT_SSH_TIMEOUT_MS = 60_000;

/** `tunnel_config` of a connection; backend `SshConfig`. The key pair belongs to the organization. */
export class SshConfig extends Deneric {
  host = '';
  port = 0;
  username = '';
  publicKey = '';
  timeoutMs = DEFAULT_SSH_TIMEOUT_MS;

  constructor(json?: unknown) {
    super({
      host: ['host', String],
      port: ['port', Number],
      username: ['username', String],
      publicKey: ['public_key', String],
      timeoutMs: ['timeout_ms', Number]
    });
    this.fromJson(json);
  }
}
