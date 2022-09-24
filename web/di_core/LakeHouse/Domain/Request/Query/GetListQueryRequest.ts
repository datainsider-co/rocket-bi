/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 3:22 PM
 */

export class GetListQueryRequest {
  constructor(
    public searchVal?: string,
    ///"0,1"
    public queryState?: string,
    public sortBy?: string,
    public sortMode?: number,
    public from?: number,
    public size?: number,
    public ownerId?: string
  ) {}
}
