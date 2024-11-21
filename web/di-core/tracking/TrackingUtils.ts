import { TrackingService } from '@core/tracking/service';
import { Di } from '@core/common/modules';
import { Properties } from 'di-web-analytics/dist/domain';

export class TrackingUtils {
  private static instance: TrackingService;

  private static getInstance() {
    if (!this.instance) {
      this.instance = Di.get(TrackingService);
    }
    return this.instance;
  }

  static track(event: string, properties: Properties) {
    this.getInstance().track(event, properties);
  }
}
