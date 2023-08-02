import { ResultOutput } from '@core/lake-house/domain/lake-job/output-info/ResultOutput';
import { ResultOutputs } from '@core/lake-house/domain/lake-job/output-info/ResultOutputs';
import { Log } from '@core/utils';
import { WriteMode } from '@core/lake-house';

export class LakeHouseResultOutput implements ResultOutput {
  className = ResultOutputs.LakeHouse;
  resultPath: string;
  writeMode: WriteMode;

  constructor(resultPath: string, writeMode: WriteMode) {
    this.resultPath = resultPath;
    this.writeMode = writeMode;
  }

  static fromObject(obj: any) {
    Log.debug('DataLakeConfig::fromObject::', obj);
    return new LakeHouseResultOutput(obj.resultPath, obj.writeMode);
  }
}
