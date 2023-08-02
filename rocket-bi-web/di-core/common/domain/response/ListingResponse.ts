export class ListingResponse<ListingData> {
  data: ListingData[];
  total: number;
  constructor(data: ListingData[], total: number) {
    this.data = data;
    this.total = total;
  }
}
