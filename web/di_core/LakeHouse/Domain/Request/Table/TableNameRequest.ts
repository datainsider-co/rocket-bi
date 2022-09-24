import { CreateTableActionRequest } from './CreateTableActionRequest';

export class TableNameRequest extends CreateTableActionRequest {
  constructor(public tableName: string) {
    super();
  }
}
