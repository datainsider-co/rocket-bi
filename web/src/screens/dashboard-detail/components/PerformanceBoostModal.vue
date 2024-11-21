<template>
  <DiCustomModal
    id="performance-modal"
    ref="modal"
    class="performance-modal"
    size="md"
    okTitle="Save"
    title="Performance Boost"
    hide-header-close
    @hidden="reset"
    @onClickOk="submitBoostSetting(setting)"
  >
    <div class="performance-modal--container" v-if="setting">
      <vuescroll :ops="verticalScrollConfig">
        <div class="performance-modal--container--scroll-body">
          <div class="title mb-0">Boost mode</div>
          <div class="d-flex row pl-3">
            <SingleChoiceItem :is-selected="!setting.enable" :item="boostEnabled[0]" class="mr-3" @onSelectItem="handleEnableBoost" />
            <SingleChoiceItem :is-selected="setting.enable" :item="boostEnabled[1]" @onSelectItem="handleEnableBoost" />
          </div>
          <div>
            <SchedulerSettingV2
              class="boost-scheduler"
              :class="{ disabled: !setting.enable }"
              :scheduler-time="setting.scheduleTime"
              @change="
                newScheduler => {
                  setting.scheduleTime = newScheduler;
                }
              "
            />
          </div>
        </div>
      </vuescroll>
    </div>
  </DiCustomModal>
</template>

<script lang="ts">
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import { BoostInfo } from '@core/common/domain';
import { Log } from '@core/utils';
import { Component, Vue, Ref } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { SelectOption, VerticalScrollConfigs } from '@/shared';
import SchedulerSettingV2 from '@/shared/components/common/scheduler/SchedulerSettingV2.vue';
import { cloneDeep } from 'lodash';

@Component({ components: { SingleChoiceItem, DiCustomModal, SchedulerSettingV2 } })
export default class PerformanceBoostModal extends Vue {
  private readonly boostEnabled: SelectOption[] = [
    { displayName: 'Off', id: false },
    { displayName: 'On', id: true }
  ];
  private readonly verticalScrollConfig = VerticalScrollConfigs;

  private setting: BoostInfo | null = null;

  private callback: ((setting: BoostInfo) => void) | null = null;
  @Ref()
  private readonly modal!: DiCustomModal;

  show(setting: BoostInfo | null | undefined, onCompleted: (setting: BoostInfo) => void) {
    this.setting = cloneDeep(setting || BoostInfo.default());
    this.callback = onCompleted;
    this.$nextTick(() => {
      this.modal.show();
    });
  }

  hide() {
    this.reset();
    this.modal.hide();
  }

  private reset() {
    this.setting = null;
    this.callback = null;
  }

  private submitBoostSetting(setting: BoostInfo) {
    if (this.callback) {
      Log.debug('PerformanceBoostModal::submitBoostSetting::', setting);
      this.callback(setting);
    }
  }

  private handleEnableBoost(item: SelectOption) {
    Log.debug('PerformanceBoostModal::handleEnableBoost', item);
    this.setting!.enable = item.id as boolean;
  }
}
</script>

<style lang="scss">
.performance-modal {
  &--container {
    &--scroll-body {
      //
      .boost-scheduler {
        margin-top: 16px;

        .job-scheduler-form-group {
          .frequency-setting {
            flex-direction: column;
            align-items: start;

            .frequency-radio-item {
              margin-top: 8px;
            }
          }

          & + .recurs-times {
            padding-top: 0 !important;
          }
        }
      }

      .boost-scheduler.disabled {
        pointer-events: none;
        cursor: not-allowed;
        opacity: 0.2;
      }
    }
  }
}
</style>
