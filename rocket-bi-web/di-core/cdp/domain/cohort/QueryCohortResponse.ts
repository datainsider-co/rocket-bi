export class QueryCohortHeader {
  constructor(public key: number, public label: string, public isGroupBy: boolean, public isTextLeft: boolean) {}
}

const QUERY_COHORT_HEADER_DATE = 0;
const QUERY_COHORT_HEADER_TOTAL_USER = 1;

type TQueryCohortRecord = {
  [key: string]: string;
};

type TQueryCohortCalculatedRecord = {
  [key: string]: {
    total: number;
    value: number;
    valueString: string;
    percent: number;
    isValid: boolean;
  };
};

export class QueryCohortResponse {
  constructor(
    public className: string,
    public headers: QueryCohortHeader[],
    public records: TQueryCohortRecord[],
    public total: number,
    public minMaxValues: [number, number]
  ) {}

  get valueHeaders(): QueryCohortHeader[] {
    return this.headers.filter(h => ![QUERY_COHORT_HEADER_DATE, QUERY_COHORT_HEADER_TOTAL_USER].includes(h.key));
  }

  get calculatedRecords(): TQueryCohortCalculatedRecord[] {
    return this.records.map(record => {
      const total = parseFloat(record[QUERY_COHORT_HEADER_TOTAL_USER] ?? 0);
      return Object.keys(record).reduce((prev: TQueryCohortCalculatedRecord, key) => {
        const valueString = record[key];
        const isNumber = /^\d+$/.test(valueString);
        const value = isNumber ? parseFloat(valueString) : 0;
        prev[key] = {
          total,
          value: value,
          valueString: valueString,
          percent: Math.round((value / total) * 100),
          isValid: isNumber
        };
        return prev;
      }, {});
    });
  }

  static fromObject(obj: QueryCohortResponse) {
    return new QueryCohortResponse(obj.className, obj.headers, obj.records, obj.total, obj.minMaxValues);
  }
}
