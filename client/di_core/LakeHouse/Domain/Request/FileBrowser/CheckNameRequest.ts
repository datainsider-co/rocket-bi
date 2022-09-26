import { FileRequest } from './FileRequest';

export class CheckNameRequest extends FileRequest {
  constructor(path: string, readonly listName: string[]) {
    super(path);
  }
}
