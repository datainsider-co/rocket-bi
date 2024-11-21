/*
 * @author: tvc12 - Thien Vi
 * @created: 5/21/21, 12:18 PM
 */

export abstract class Scrollable {
  static isScrollable(obj: any): obj is Scrollable {
    return !!obj.enableScrollBar;
  }

  abstract enableScrollBar(): boolean;
}
