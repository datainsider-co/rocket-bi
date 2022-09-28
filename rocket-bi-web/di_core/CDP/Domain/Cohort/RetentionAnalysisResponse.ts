export class RetentionAnalysisRecord {
  date: string;
  total: number;
  values: number[];
  percents: number[];

  constructor(date: string, total: number, values: number[], percents: number[]) {
    this.date = date;
    this.total = total;
    this.values = values;
    this.percents = percents;
  }

  static fromObject(obj: any) {
    const percents: number[] = obj.values.map((value: number) => Math.round((value / obj.total) * 100));
    return new RetentionAnalysisRecord(obj.date, obj.total, obj.values, percents);
  }
}

export class RetentionAnalysisResponse {
  constructor(public headers: string[], public records: RetentionAnalysisRecord[]) {}

  static fromObject(obj: any): RetentionAnalysisResponse {
    return new RetentionAnalysisResponse(
      obj.headers,
      obj.records.map((record: RetentionAnalysisRecord) => RetentionAnalysisRecord.fromObject(record))
    );
  }
}
