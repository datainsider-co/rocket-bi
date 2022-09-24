import { QueryOutputTemplate, TextOutputInfo, TimeUnit, WriteMode } from '@core/LakeHouse';
import { LakeHouseResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/LakeHouseResultOutput';
import { Log } from '@core/utils';
import { ResultOutputs } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutputs';
import { ResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutput';

export class LakeHouseUIConfig {
  enable: boolean;
  path: string;
  saveMode?: WriteMode;
  partitionPattern: string;
  delay: number;
  delayUnit: TimeUnit;
  hideSaveMode: boolean;

  constructor(enable: boolean, path: string, saveMode: WriteMode, partitionPattern: string, delay: number, delayUnit: TimeUnit, hideSaveMode = false) {
    this.enable = enable;
    this.path = path;
    this.saveMode = saveMode;
    this.partitionPattern = partitionPattern;
    this.delay = delay;
    this.delayUnit = delayUnit;
    this.hideSaveMode = hideSaveMode;
  }

  static create(path: string, saveMode: WriteMode, partitionPattern: string, delay: number, delayUnit: TimeUnit): LakeHouseUIConfig {
    return new LakeHouseUIConfig(false, path, saveMode, partitionPattern, delay, delayUnit);
  }

  static default(): LakeHouseUIConfig {
    return LakeHouseUIConfig.create(
      this.defaultConfig().resultPath,
      WriteMode.Append,
      TextOutputInfo.DEFAULT_PARTITION,
      TextOutputInfo.DEFAULT_INTERVAL,
      TextOutputInfo.DEFAULT_INTERVAL_UNIT
    );
  }

  updateFromOutputTemplate(output: QueryOutputTemplate) {
    this.enable = !!output.output.textOutputInfo;
    this.path = output.output.textOutputInfo?.resultPath ?? '';
    this.saveMode = output.output.textOutputInfo?.writeMode ?? WriteMode.Append;
    // this.partitionPattern = output.output.textOutputInfo?.partitionPattern ?? TextOutputInfo.DEFAULT_PARTITION;
    // this.delay = output.output.textOutputInfo?.delay ?? TextOutputInfo.DEFAULT_INTERVAL;
    // this.delayUnit = output.output.textOutputInfo?.delayUnit ?? TextOutputInfo.DEFAULT_INTERVAL_UNIT;
  }

  updateFromOutputInfo(config: ResultOutput) {
    this.enable = true;
    this.path = (config as LakeHouseResultOutput).resultPath ?? '';
    this.saveMode = (config as LakeHouseResultOutput).writeMode ?? WriteMode.Append;
  }

  toQueryOutputTemplate(): QueryOutputTemplate | undefined {
    if (this.enable && this.path && this.saveMode) {
      const result = LakeHouseUIConfig.output();
      result.output.textOutputInfo.resultPath = this.path;
      result.output.textOutputInfo.writeMode = this.saveMode;
      // result.output.textOutputInfo.partitionPattern = this.partitionPattern;
      // result.output.textOutputInfo.delay = this.delay;
      // result.output.textOutputInfo.delayUnit = this.delayUnit;
      return QueryOutputTemplate.fromObject(result);
    } else {
      return void 0;
    }
  }

  toOutputInfo(): ResultOutput | undefined {
    if (this.enable && this.path && this.saveMode) {
      const config = LakeHouseUIConfig.defaultConfig();
      config.resultPath = this.path;
      config.writeMode = this.saveMode;
      Log.debug('toOutputInfo::', ResultOutput.fromObject(config));
      return ResultOutput.fromObject(config);
    } else {
      return void 0;
    }
  }

  static output() {
    return {
      id: '123456',
      ownerId: 'root',
      accessType: 1,
      outputName: 'hadoop_output',
      output: {
        type: 0,
        textOutputInfo: {
          resultPath: '/miner/query_result',
          hdfsUri: 'hdfs://namenode:9000',
          writeMode: 'append'
          // partitionPattern: 'YYYY/MM/DD',
          // delay: 1,
          // delayUnit: TimeUnit.DAY
        }
      }
    };
  }

  static defaultConfig() {
    return {
      className: ResultOutputs.LakeHouse,
      resultPath: '/data/result',
      writeMode: WriteMode.Append
    };
  }
}
