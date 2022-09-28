export class ClickhouseSource {
  jdbcUrl: string;
  username: string;
  password: string;
  clusterName: string;

  constructor(jdbcURL: string, username: string, password: string, clusterName: string) {
    this.jdbcUrl = jdbcURL;
    this.username = username;
    this.password = password;
    this.clusterName = clusterName;
  }

  static fromObject(obj: any): ClickhouseSource {
    return new ClickhouseSource(obj.jdbcUrl, obj.username, obj.password, obj.clusterName);
  }

  static default() {
    return new ClickhouseSource('', '', '', '');
  }
}
