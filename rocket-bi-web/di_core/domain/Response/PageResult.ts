/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:01 PM
 */

export class PageResult<T> {
  constructor(public data: T[], public total: number) {}
}
