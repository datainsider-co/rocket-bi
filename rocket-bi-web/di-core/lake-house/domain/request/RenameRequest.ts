import { FileRequest } from './file-browser/FileRequest';

export class RenameRequest extends FileRequest {
  constructor(path: string, readonly newName: string) {
    super(path);
  }
}
