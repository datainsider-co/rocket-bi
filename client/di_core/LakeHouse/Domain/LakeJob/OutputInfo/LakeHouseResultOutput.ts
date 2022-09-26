import { ResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutput';
import { ResultOutputs } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutputs';
import { Log } from '@core/utils';
import { WriteMode } from '@core/LakeHouse';

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
