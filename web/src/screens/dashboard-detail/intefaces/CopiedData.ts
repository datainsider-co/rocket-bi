import { Log } from '@core/utils';

export enum CopiedDataType {
  Dashboard = 'dashboard',
  Widget = 'widget',
  Chart = 'chart'
}

export class CopiedData {
  /**
   * transfer data
   */
  readonly transferData: string;
  /**
   * type of resource
   */
  readonly type: CopiedDataType;
  /**
   * source url is current url when copy
   */
  readonly sourceUrl: string;

  constructor(type: CopiedDataType, sourceUrl: string, transferData: string) {
    this.type = type;
    this.sourceUrl = sourceUrl;
    this.transferData = transferData;
  }

  static create(type: CopiedDataType, data: any) {
    return new CopiedData(type, window.location.href, JSON.stringify(data));
  }

  static isSameOrigin(copiedData: CopiedData): boolean {
    try {
      const url = new URL(copiedData.sourceUrl);
      return url.origin === window.location.origin;
    } catch (ex) {
      Log.debug('isSameOrigin::', ex);
      return false;
    }
  }

  static fromObject<T>(obj: any): CopiedData | undefined {
    try {
      if (obj.type && obj.sourceUrl && obj.transferData) {
        return new CopiedData(obj.type, obj.sourceUrl, obj.transferData);
      } else {
        return void 0;
      }
    } catch (e) {
      Log.error('CopiedData.fromObject() error', e);
      return void 0;
    }
  }
}
