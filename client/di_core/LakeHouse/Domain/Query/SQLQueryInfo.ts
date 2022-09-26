import { ResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutput';

export class SQLQueryInfo {
  query: string;
  outputs: ResultOutput[];

  constructor(query: string, output: ResultOutput[]) {
    this.query = query;
    this.outputs = output;
  }

  static fromObject(obj: any): SQLQueryInfo {
    const configs: ResultOutput[] = (obj.outputs ?? []).map((config: any) => ResultOutput.fromObject(config));
    return new SQLQueryInfo(obj.query, configs);
  }

  static fromQuery(query: string): SQLQueryInfo {
    return new SQLQueryInfo(query, []);
  }
}
