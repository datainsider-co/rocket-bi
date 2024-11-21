export class ProductSubscription {
  constructor(
    public id: string,
    public licenseKey: string,
    public productId: string,
    public paymentId: string,
    public startTime: number,
    public endTime: number,
    public createdTime: number,
    public updatedTime: number
  ) {}

  static fromObject(obj: ProductSubscription) {
    return new ProductSubscription(obj.id, obj.licenseKey, obj.productId, obj.paymentId, obj.startTime, obj.endTime, obj.createdTime, obj.updatedTime);
  }
}
