export class QueryUtils {
  static isLimitQuery(query: string) {
    const existLimitRegex = new RegExp(/\w*(limit)\s+[0-9]+/);
    return existLimitRegex.test(query);
  }
}
