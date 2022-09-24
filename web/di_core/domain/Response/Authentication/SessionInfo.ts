/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:06 PM
 */

export class SessionInfo {
  key!: string;
  value!: string;
  domain!: string;
  timeoutInMS!: number;
  maxAge!: number;
  path = '/';
}
