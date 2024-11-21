export class Ga4Dimension {
  constructor(public name: string) {}

  static fromObject(obj: Ga4Dimension) {
    return new Ga4Dimension(obj.name);
  }
}
