import { GitCloneInfo } from '@core/lake-house/domain/lake-job/git-clone-info/GitCloneInfo';
import { GitCloneInfos } from '@core/lake-house/domain/lake-job/git-clone-info/GitCloneInfos';
import { StringUtils } from '@/utils/StringUtils';

export class HTTPSInfo implements GitCloneInfo {
  className = GitCloneInfos.HTTPS;
  constructor(public url: string, public username: string, public password: string) {}

  isValid(): boolean {
    return StringUtils.isNotEmpty(this.url);
  }
}
