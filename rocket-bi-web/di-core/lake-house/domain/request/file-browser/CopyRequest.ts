import { FileRequest } from './FileRequest';

export class CopyRequest extends FileRequest {
  constructor(path: string, readonly destPath: string, readonly overwrite?: boolean, readonly newName?: string) {
    super(path);
  }
}
