export class Page<T> {
  constructor(public total: number, public records: T[]) {}
}

export class CsvData extends Page<string[]> {
  constructor(public readonly headers: string[], total: number, records: string[][]) {
    super(total, records);
  }
}
