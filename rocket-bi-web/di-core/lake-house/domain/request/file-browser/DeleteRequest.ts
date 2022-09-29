import { FileRequest } from './FileRequest';

export enum DeleteMode {
  MoveTrash = 0,
  DeleteForever = 1
}

export class DeleteRequest extends FileRequest {
  constructor(path: string, readonly deleteMode: DeleteMode) {
    super(path);
  }

  static moveToTrash(path: string) {
    return new DeleteRequest(path, DeleteMode.MoveTrash);
  }

  static deleteForever(path: string) {
    return new DeleteRequest(path, DeleteMode.DeleteForever);
  }
}
