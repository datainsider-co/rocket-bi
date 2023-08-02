import { Log } from '@core/utils';
import { PlanType } from '@core/organization/domain/Plan/PlanType';

export class ProductInfo {
  constructor(
    public id: string,
    public name: PlanType,
    public description: string,
    public price: number,
    public editorSeats: number,
    public createdAt?: number
  ) {}

  static fromObject(obj: ProductInfo) {
    const editorPermission = (obj as any).permissions.find((item: any) => item.key === 'NumEditorsPermission');
    const editorSeats = editorPermission ? editorPermission.maxNumEditors : 0;
    Log.debug('ProductInfo::fromObject::', editorSeats);
    return new ProductInfo(obj.id, obj.name, obj.description, obj.price, editorSeats, obj.createdAt);
  }
}
