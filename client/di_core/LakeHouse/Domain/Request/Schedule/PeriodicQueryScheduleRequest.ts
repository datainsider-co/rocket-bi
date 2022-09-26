import { LakeHouseRequest } from '../LakeHouseRequest';
import { PeriodicQueryInfo } from '@core/LakeHouse';

export class PeriodicQueryScheduleRequest extends LakeHouseRequest {
  query?: PeriodicQueryInfo;
}
