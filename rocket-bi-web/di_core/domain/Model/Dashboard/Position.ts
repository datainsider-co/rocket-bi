/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:10 PM
 */

export class Position {
  row: number;
  column: number;
  width: number;
  height: number;
  zIndex: number;

  constructor(row: number, col: number, width: number, height: number, zIndex: number) {
    this.row = row;
    this.column = col;
    this.width = width;
    this.height = height;
    this.zIndex = zIndex || 0;
  }

  static fromObject(obj: Position): Position {
    return new Position(obj.row, obj.column, obj.width, obj.height, obj.zIndex ?? 1);
  }

  static default() {
    return new Position(0, 0, 5, 5, 1);
  }

  static defaultForText() {
    return new Position(-1, -1, 5, 1, 1);
  }

  static defaultForImage() {
    return new Position(-1, -1, 5, 5, 1);
  }

  static from(currentPosition: Position) {
    return new Position(-1, -1, currentPosition.width, currentPosition.height, currentPosition.zIndex);
  }
}
