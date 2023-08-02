/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:23 PM
 */

import { GetListResponse } from '../GetListResponse';
import { FieldMappingInfo } from './FieldMappingInfo';

export class ParquetTableResponse extends GetListResponse<FieldMappingInfo> {
  constructor(data: FieldMappingInfo[], total: number, public delimiter?: string, code = 0, msg?: string | null) {
    super(data, total, code, msg);
  }

  static fromObject(obj: any) {
    const data = (obj.data ?? []).map((item: any) => FieldMappingInfo.fromObject(item));
    return new ParquetTableResponse(data, obj.total, obj.delimiter, obj.code, obj.msg);
  }

  static mock() {
    return ParquetTableResponse.fromObject({
      code: 0,
      msg: null,
      data: [
        { position: 0, name: '__null_dask_index__', type: 'long', sampleData: ['0', '1', '2', '3', '4'] },
        { position: 1, name: 'ID', type: 'double', sampleData: ['1.6260142E7', '7.7789628E7', '6.2602999E7', '1.0716463E7', '4.1848132E7'] },
        { position: 2, name: 'DELETED', type: 'double', sampleData: ['0.0', '0.0', '0.0', '0.0', '0.0'] },
        { position: 3, name: 'CREATED_DATE', type: 'long', sampleData: ['1299405886000', '1636616106000', '1588823998000', '1280030987000', '1530717012000'] },
        { position: 4, name: 'DELETED_DATE', type: 'long', sampleData: ['1.6289459E7', '7.0397105E7', '5.580462E7', '1.073578E7', '4.2462007E7'] },
        { position: 5, name: 'BODYID', type: 'double', sampleData: ['16289459', '70397105', '55804620', '10735780', '42462007'] },
        { position: 6, name: 'REFERENCE', type: 'string', sampleData: ['12234556', '0.0', '0.0', '0.0', '0.0'] },
        { position: 7, name: 'REF_TYPE', type: 'string', sampleData: ['20211208', '20211208', '20211208', '20211208', '20211208'] },
        { position: 8, name: 'TENANT_ID', type: 'double', sampleData: [] },
        { position: 9, name: 'SHARD_DATE', type: 'string', sampleData: [] }
      ],
      delimiter: '\\t'
    });
  }
}
