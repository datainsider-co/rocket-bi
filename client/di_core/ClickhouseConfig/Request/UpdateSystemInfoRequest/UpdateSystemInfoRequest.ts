import { ClickhouseSource } from '@core/ClickhouseConfig/Domain/ClickhouseSource/ClickhouseSource';

export class UpdateSystemInfoRequest {
  constructor(public sources: ClickhouseSource[]) {}
}
