/*
 * @author: tvc12 - Thien Vi
 * @created: 3/30/21, 10:15 AM
 */

export abstract class Equatable {
  static isEquatable(obj: Equatable & any): obj is Equatable {
    return !!obj.equals;
  }

  abstract equals(obj: any): boolean;
}
