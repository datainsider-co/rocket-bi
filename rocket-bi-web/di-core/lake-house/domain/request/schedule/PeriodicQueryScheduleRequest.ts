import { LakeHouseRequest } from '../LakeHouseRequest';
import { PeriodicQueryInfo } from '@core/lake-house';

export class PeriodicQueryScheduleRequest extends LakeHouseRequest {
  query?: PeriodicQueryInfo;
}
