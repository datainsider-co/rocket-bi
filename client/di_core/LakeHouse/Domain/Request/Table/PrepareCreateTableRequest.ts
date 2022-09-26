/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 5:26 PM
 */

import { AccessType, TableType } from '../../Table/TableInfo';

export class PrepareCreateTableRequest {
  constructor(
    public tableName: string,
    public dataSource: string[],
    public description?: string,
    public delimiter?: string,
    public tableType?: TableType,
    public oldName?: string,
    public accessType?: AccessType,
    public windowSize?: number,
    public timeStep?: number
  ) {}
}
