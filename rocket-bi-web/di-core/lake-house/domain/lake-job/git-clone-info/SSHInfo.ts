import { GitCloneInfo } from '@core/lake-house/domain/lake-job/git-clone-info/GitCloneInfo';
import { GitCloneInfos } from '@core/lake-house/domain/lake-job/git-clone-info/GitCloneInfos';
import { StringUtils } from '@/utils/StringUtils';

export class SSHInfo implements GitCloneInfo {
  className = GitCloneInfos.SSH;
  constructor(public url: string, public privateKey: string) {}

  isValid(): boolean {
    return StringUtils.isNotEmpty(this.url);
  }
}
