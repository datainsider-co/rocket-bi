import { FileRequest } from './file-browser/FileRequest';

export class CreateDirectoryRequest extends FileRequest {
  constructor(path: string, readonly name: string) {
    super(path);
  }
}
