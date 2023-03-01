export class ProductInfo {
  constructor(
    public id: string,
    public name: string,
    public isSelected: boolean,
    public isSubscribed: boolean,
    public description: string,
    public price: number,
    public createdAt?: number
  ) {}

  static fromObject(obj: ProductInfo) {
    return new ProductInfo(obj.id, obj.name, false, false, obj.description, obj.price, obj.createdAt);
  }
}
