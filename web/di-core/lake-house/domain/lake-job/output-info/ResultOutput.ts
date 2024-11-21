import { ResultOutputs } from '@core/lake-house/domain/lake-job/output-info/ResultOutputs';
import { WareHouseResultOutput } from '@core/lake-house/domain/lake-job/output-info/WareHouseResultOutput';
import { LakeHouseResultOutput } from '@core/lake-house/domain/lake-job/output-info/LakeHouseResultOutput';

export abstract class ResultOutput {
  abstract className: ResultOutputs;

  static fromObject(obj: ResultOutput) {
    switch (obj.className) {
      case ResultOutputs.WareHouse:
        return WareHouseResultOutput.fromObject(obj as WareHouseResultOutput);
      case ResultOutputs.LakeHouse:
        return LakeHouseResultOutput.fromObject(obj as LakeHouseResultOutput);
    }
  }
}
