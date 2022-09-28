import { ResultOutputs } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutputs';
import { WareHouseResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/WareHouseResultOutput';
import { LakeHouseResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/LakeHouseResultOutput';

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
