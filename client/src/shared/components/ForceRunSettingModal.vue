<template>
  <EtlModal
    class="force-run-setting-modal"
    :borderCancel="true"
    :loading="isLoading"
    :title="title"
    ref="modal"
    :width="444"
    :actionName="actionName"
    @hidden="handleHidden"
    @submit="handleForceRun(job, selectedDate)"
  >
    <div class="border-top d-flex flex-column justify-content-center">
      <div class="pt-3 d-flex justify-content-center">
        {{ subTitle }}
      </div>
      <div class="calendar-picker-container ">
        <v-calendar
          ref="datePicker"
          :attributes="startDatePickerAttributes"
          :locale="locale"
          class="calendar-picker"
          color="blue"
          is-expanded
          is-inline
          isDark
          @dayclick="handleSelectForceRunDate"
        >
        </v-calendar>
      </div>
    </div>
  </EtlModal>
</template>
<script lang="ts">
import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { LakeJob } from '@core/LakeHouse/Domain/LakeJob/LakeJob';
import { Job } from '@core/DataIngestion';
import { EtlJobInfo } from '@core/DataCook';
import { DateUtils } from '@/utils';
@Component({
  components: { EtlModal }
})
export default class ForceRunSettingModal extends Vue {
  private selectedDate: Date = new Date();
  private job: LakeJob | Job | EtlJobInfo | null = null;
  private isLoading = false;
  @Ref()
  private readonly modal!: EtlModal;

  @Prop({ default: 'Force run setting' })
  private readonly title!: string;

  @Prop({ default: 'Force run' })
  private readonly actionName!: string;

  @Prop({ default: 'Select the date you want to force run' })
  private readonly subTitle!: string;

  @Prop({ required: false, default: DateUtils.DefaultLocale })
  private readonly locale!: string;

  show(job: LakeJob | Job | EtlJobInfo) {
    this.job = job;
    //@ts-ignored
    this.modal.show();
  }

  showLoading() {
    this.isLoading = true;
  }

  hideLoading() {
    this.isLoading = false;
  }

  hide() {
    //@ts-ignored
    this.modal.hide();
  }

  private get startDatePickerAttributes() {
    return [
      {
        highlight: {
          base: { fillMode: 'light' },
          start: { fillMode: 'outline' }
        },
        dates: {
          start: this.selectedDate,
          end: this.selectedDate
        }
      },
      {
        highlight: {
          color: 'blue',
          fillMode: 'outline',
          contentClass: 'highlight-solid'
        },
        dates: new Date()
      },
      {
        highlight: {
          color: 'blue',
          contentClass: 'highlight'
        },
        dates: this.selectedDate
      },
      {
        highlight: {
          color: 'none'
        },
        dates: this.selectedDate
      }
    ];
  }

  private handleHidden() {
    this.reset();
  }

  private reset() {
    this.selectedDate = new Date();
    this.job = null;
  }

  private handleForceRun(job: LakeJob | Job, forceRunDate: Date) {
    Log.debug('handleForceRun::', job, forceRunDate);
    this.$emit('forceRun', job, forceRunDate);
  }

  private handleSelectForceRunDate(dateRange: any) {
    this.selectedDate = dateRange.date;
  }
}
</script>

<style lang="scss" scoped>
.calendar-picker-container {
  width: 321px;
  align-self: center;
}
@import '~@/shared/components/calendar.scss';
.force-run-setting-modal {
  ::v-deep {
    .modal-content {
      //padding: 0;
      .modal-header.dark {
        background: var(--secondary);
        h4 {
          margin-bottom: 16px;
        }

        .btn-primary {
          display: flex;
          i {
            height: 14px;
            width: 14px;
            margin-right: 5px;
          }
        }
        button,
        .di-button {
          height: 26px;
        }
      }
      .modal-body {
        background: var(--secondary);
        padding: 0;
      }
    }
    .calendar-picker.vc-container.vc-rounded-lg {
      background-color: var(--secondary) !important;
    }
  }
}
</style>
