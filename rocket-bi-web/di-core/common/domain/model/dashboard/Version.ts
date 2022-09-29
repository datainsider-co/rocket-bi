/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 1:30 PM
 */

export abstract class Version {
  abstract get version(): string;

  static isVersion(obj: any & Version): obj is Version {
    return !!obj.version;
  }
}
