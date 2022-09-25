export class GA4Metric {
  constructor(public name: string, public dataType: string) {}

  static fromObject(obj: GA4Metric) {
    return new GA4Metric(obj.name, obj.dataType);
  }
}
