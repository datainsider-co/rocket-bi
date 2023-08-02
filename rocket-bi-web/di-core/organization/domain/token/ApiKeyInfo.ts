import { cloneDeep } from 'lodash';
import { DIException } from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import { DateTimeFormatter, DateUtils } from '@/utils';
import { Log } from '@core/utils';

export class ApiKeyInfo {
  constructor(
    public displayName: string,
    public apiKey: string,
    //duration from created time to expired time
    public expiredTimeMs?: number,
    public organizationId?: number,
    public createdAt?: number
  ) {}

  get expireDate(): Date {
    return new Date((this.createdAt ?? Date.now()) + (this.expiredTimeMs ?? 0));
  }

  get expireDateAsDisplay() {
    Log.debug(`ApiKeyInfo::expireDateAsDisplay::expiredTime::`, this.expireDate);
    return DateTimeFormatter.formatASMMMDDYYYY(this.expireDate);
  }

  updateExpireTime(date?: Date) {
    if (date) {
      const expireDate = cloneDeep(date);
      const createdDate = new Date(this.createdAt ?? Date.now());
      this.expiredTimeMs = DateUtils.toStartTime(expireDate) - DateUtils.toStartTime(createdDate);
    } else {
      this.expiredTimeMs = undefined;
    }
  }

  static fromObject(obj: ApiKeyInfo) {
    return new ApiKeyInfo(obj.displayName, obj.apiKey, obj.expiredTimeMs, obj.organizationId, obj.createdAt);
  }

  static default() {
    //from now
    const oneYearLaterDuration = 365 * 24 * 60 * 60 * 1000;
    return new ApiKeyInfo('', '', oneYearLaterDuration);
  }

  ensure() {
    if (StringUtils.isEmpty(this.displayName)) {
      throw new DIException(`Api key name is required.`);
    } else if (!this.expiredTimeMs) {
      throw new DIException(`Expire time is a valid date.`);
    }
  }
}
