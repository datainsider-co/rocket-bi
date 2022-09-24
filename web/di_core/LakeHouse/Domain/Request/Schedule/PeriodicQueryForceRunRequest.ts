import { LakeHouseRequest } from '@core/LakeHouse/Domain/Request/LakeHouseRequest';

export class PeriodicQueryForceRunRequest extends LakeHouseRequest {
  queryId: string;
  startTime: number;
  endTime: number;

  constructor(queryId: string, startTime: number, endTime: number) {
    super();
    this.queryId = queryId;
    this.startTime = startTime;
    this.endTime = endTime;
  }
}
