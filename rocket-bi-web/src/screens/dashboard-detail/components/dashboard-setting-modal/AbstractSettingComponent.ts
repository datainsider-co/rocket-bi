import Vue from 'vue';
import Component from 'vue-class-component';
import { Emit, Model } from 'vue-property-decorator';
import { DashboardSetting } from '@core/common/domain';
import { AtomicAction } from '@core/common/misc';

// @ts-ignore
@Component
export abstract class AbstractSettingComponent extends Vue {
  @Model('change', { required: true, type: Object })
  protected readonly value!: DashboardSetting;

  @Emit('applySetting')
  @AtomicAction()
  applySetting(): void {
    return void 0;
  }

  /**
   * method ensure setting is valid, if not it will be render error in UI and throw error
   *
   * @throws {DiException} if setting is invalid
   */
  abstract ensureSetting(): void;
}
