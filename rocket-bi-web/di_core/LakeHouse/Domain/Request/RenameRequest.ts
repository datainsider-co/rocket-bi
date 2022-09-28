import { FileRequest } from './FileBrowser/FileRequest';

export class RenameRequest extends FileRequest {
  constructor(path: string, readonly newName: string) {
    super(path);
  }
}
