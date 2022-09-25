import { GitCloneInfo } from '@core/LakeHouse/Domain/LakeJob/GitCloneInfo/GitCloneInfo';
import { GitCloneInfos } from '@core/LakeHouse/Domain/LakeJob/GitCloneInfo/GitCloneInfos';
import { StringUtils } from '@/utils/string.utils';

export class HTTPSInfo implements GitCloneInfo {
  className = GitCloneInfos.HTTPS;
  constructor(public url: string, public username: string, public password: string) {}

  isValid(): boolean {
    return StringUtils.isNotEmpty(this.url);
  }
}
