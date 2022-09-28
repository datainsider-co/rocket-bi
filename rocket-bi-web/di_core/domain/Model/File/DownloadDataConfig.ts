/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:19 PM
 */

export interface DownloadDataConfig {
  name: string;
  maxSizeInBytes: number;
  request: any;
  from?: number;
  batchSize?: number;
}
