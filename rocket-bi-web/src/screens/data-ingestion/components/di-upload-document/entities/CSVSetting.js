import deneric from 'deneric';
import { config } from '../services/Common';
import { ENCODING } from './Enum';

export class CSVSetting extends deneric.Entity {
  constructor(data) {
    super(data, {
      include_header: ['include_header', deneric.Boolean],
      delimiter: ['delimiter', deneric.String, ','],
      quote: ['quote', deneric.String],
      add_batch_info: ['add_batch_info', deneric.Boolean],
      encoding: ['encoding', deneric.String, ENCODING.UTF_8],
      chunkSize: ['chunkSize', deneric.Number, config.chunkSize]
    });
  }
}
