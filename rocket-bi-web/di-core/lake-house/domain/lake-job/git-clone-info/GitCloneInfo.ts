import { GitCloneInfos } from '@core/lake-house/domain/lake-job/git-clone-info/GitCloneInfos';
import { SSHInfo } from '@core/lake-house/domain/lake-job/git-clone-info/SSHInfo';
import { HTTPSInfo } from '@core/lake-house/domain/lake-job/git-clone-info/HTTPSInfo';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';

export abstract class GitCloneInfo {
  abstract className: GitCloneInfos;

  abstract isValid(): boolean;

  static fromObject(obj: any): GitCloneInfo {
    switch (obj.className as GitCloneInfos) {
      case GitCloneInfos.HTTPS:
        return new HTTPSInfo(obj.url, obj.username, obj.password);
      case GitCloneInfos.SSH:
        return new SSHInfo(obj.url, obj.privateKey);
      default:
        throw new UnsupportedException(`Unsupported git clone type ${obj.className}`);
    }
  }
}
