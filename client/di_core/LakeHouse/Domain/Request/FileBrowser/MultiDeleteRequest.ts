/*
 * @author: tvc12 - Thien Vi
 * @created: 11/11/21, 9:44 AM
 */

import { DeleteMode } from './DeleteRequest';
import { MultiFileRequest } from './MultiFileRequest';

export class MultiDeleteRequest extends MultiFileRequest {
  constructor(paths: string[], public deleteMode: DeleteMode) {
    super(paths);
  }
}
