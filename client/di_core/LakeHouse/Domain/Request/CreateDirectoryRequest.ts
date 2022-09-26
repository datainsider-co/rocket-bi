import { FileRequest } from './FileBrowser/FileRequest';

export class CreateDirectoryRequest extends FileRequest {
  constructor(path: string, readonly name: string) {
    super(path);
  }
}
