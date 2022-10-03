import { LakeHouseRequest } from '@core/lake-house/domain/request/LakeHouseRequest';

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
