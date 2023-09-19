export class SSHConfig {
  constructor(public host: string, public port: string, public username: string, public publicKey: string, public timeoutMs = 60000) {}

  static fromObject(obj: SSHConfig) {
    return new SSHConfig(obj.host, obj.port, obj.username, obj.publicKey);
  }

  static default() {
    return new SSHConfig('', '', '', '');
  }

  toJson() {
    return {
      host: this.host,
      port: this.port,
      username: this.username,
      public_key: this.publicKey,
      timeout_ms: this.timeoutMs
    };
  }
}
