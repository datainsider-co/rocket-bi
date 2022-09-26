import { GitCloneInfos } from '@core/LakeHouse/Domain/LakeJob/GitCloneInfo/GitCloneInfos';
import { SSHInfo } from '@core/LakeHouse/Domain/LakeJob/GitCloneInfo/SSHInfo';
import { HTTPSInfo } from '@core/LakeHouse/Domain/LakeJob/GitCloneInfo/HTTPSInfo';
import { UnsupportedException } from '@core/domain/Exception/UnsupportedException';

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
