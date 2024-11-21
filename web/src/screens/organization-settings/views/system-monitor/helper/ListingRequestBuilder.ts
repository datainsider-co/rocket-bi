import { ListingRequest, SortDirection, SortRequest } from '@core/common/domain';

export class ListingRequestBuilder {
  private text: string;
  private from: number;
  private size: number;
  private sortName: string;
  private sort: SortDirection | null;

  constructor() {
    this.text = '';
    this.from = 0;
    this.size = 10;
    this.sortName = '';
    this.sort = null;
  }

  withKeyword(text: string): ListingRequestBuilder {
    this.text = text;
    return this;
  }

  withFrom(from: number): ListingRequestBuilder {
    this.from = from;
    return this;
  }

  withSize(size: number): ListingRequestBuilder {
    this.size = size;
    return this;
  }

  withSort(name: string, sort: SortDirection | null): ListingRequestBuilder {
    this.sortName = name;
    this.sort = sort;
    return this;
  }

  getResult(): ListingRequest {
    const sorts = this.sort ? [new SortRequest(this.sortName, this.sort)] : [];
    return new ListingRequest(this.text, this.from, this.size, sorts);
  }
}
