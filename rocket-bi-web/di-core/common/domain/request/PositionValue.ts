export class PositionValue {
  constructor(public x: number, public y: number) {}

  static fromObject(obj: PositionValue | undefined): PositionValue {
    return new PositionValue(obj?.x ?? 0, obj?.y ?? 0);
  }
}
