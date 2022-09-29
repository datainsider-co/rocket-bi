import { TableType } from '@core/common/domain';

export class TableCreationFromQueryRequest {
  constructor(
    public dbName: string,
    public displayName: string,
    public tblName: string,
    public query: string,
    public isOverride: boolean,
    public tableType: TableType
  ) {}
}

export class AdhocTableCreationRequest {
  constructor(public tblName: string, public query: string) {}
}
