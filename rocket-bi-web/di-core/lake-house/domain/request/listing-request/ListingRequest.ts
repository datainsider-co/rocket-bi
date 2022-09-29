import { SortRequest } from '@core/data-ingestion';

export class ListingRequest {
  constructor(public keyword?: string, public from?: number, public size?: number, public sorts?: SortRequest[]) {}
}
