import { GitCloneInfo } from '@core/LakeHouse/Domain/LakeJob/GitCloneInfo/GitCloneInfo';
import { GitCloneInfos } from '@core/LakeHouse/Domain/LakeJob/GitCloneInfo/GitCloneInfos';
import { StringUtils } from '@/utils/string.utils';

export class SSHInfo implements GitCloneInfo {
  className = GitCloneInfos.SSH;
  constructor(public url: string, public privateKey: string) {}

  isValid(): boolean {
    return StringUtils.isNotEmpty(this.url);
  }
}
