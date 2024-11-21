import { SortRequest } from '@core/common/domain';

export class ListingRequest {
  constructor(public keyword?: string, public from?: number, public size?: number, public sorts?: SortRequest[]) {}
}
