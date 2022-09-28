/*
 * @author: tvc12 - Thien Vi
 * @created: 11/11/21, 9:44 AM
 */

import { MultiFileRequest } from './MultiFileRequest';

export class MultiCopyRequest extends MultiFileRequest {
  constructor(paths: string[], public destPath: string, public overwrite?: boolean, public newNames?: string[]) {
    super(paths);
  }
}
