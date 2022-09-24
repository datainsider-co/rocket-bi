/*
 * @author: tvc12 - Thien Vi
 * @created: 5/31/21, 1:53 PM
 */

import { DashboardSetting } from '@core/domain';

export interface DashboardSettingModalData {
  setting: DashboardSetting;
  onApply?: (newSetting: DashboardSetting) => Promise<void>;
  onCancel?: () => void;
}
