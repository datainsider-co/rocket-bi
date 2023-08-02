/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:06 PM
 */

export class SessionInfo {
  key!: string;
  value!: string;
  domain!: string;
  timeoutInMS!: number;
  maxAge!: number;
  path = '/';

  constructor(key: string, value: string, domain: string, timeoutInMS: number, maxAge: number, path: string) {
    this.key = key;
    this.value = value;
    this.domain = domain;
    this.timeoutInMS = timeoutInMS;
    this.maxAge = maxAge;
    this.path = path;
  }

  static fromObject(object: any): SessionInfo {
    return new SessionInfo(object.key, object.value, object.domain, object.timeoutInMS, object.maxAge, object.path);
  }
}
