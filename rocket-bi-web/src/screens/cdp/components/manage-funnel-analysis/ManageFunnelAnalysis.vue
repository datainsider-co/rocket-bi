<template>
  <div v-if="model" class="manage-funnel-analysis">
    <CdpBlock title="SELECT STEP" class="funnel-step-container mb-2px" @update:collapsed="onEventBlockCollapse">
      <div v-for="(step, idx) in model.steps" :key="idx" class="event-filters-item">
        <span class="efi-group">{{ idx + 1 }}</span>
        <div class="efi-content">
          <button @click.prevent="e => changeStep(step, idx, e)" class="efi-item" type="button">
            <i class="efi-item-icon di-icon-click"></i>
            <span class="efi-item-text">
              {{ step.eventName }}
            </span>
          </button>
        </div>
        <a @click.prevent="removeStep(idx)" href="#" class="efi-action efi-action-danger">
          <i class="di-icon-delete"></i>
        </a>
      </div>
      <div class="event-filters-item mb-0">
        <DiButton @click.prevent="addStep" id="efc-add" title="Add">
          <i class="di-icon-add"></i>
        </DiButton>
      </div>
    </CdpBlock>
    <SelectStepPopover ref="selectStepPopover"></SelectStepPopover>
  </div>
</template>
<script lang="ts">
import { Component, Model, Ref, Vue } from 'vue-property-decorator';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import CdpBlock from '../cdp-block/CdpBlock.vue';
import SelectStepPopover, { TabType } from '@/screens/cdp/components/select-step-popover/SelectStepPopover.vue';
import { FunnelAnalysisInfo, FunnelAnalysisStep } from '@/screens/cdp/components/manage-funnel-analysis/FunnelAnalysisInfo';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: {
    PopoverV2,
    CdpBlock,
    SelectStepPopover
  }
})
export default class ManageFunnelAnalysis extends Vue {
  @Model('input', { required: false, type: Object })
  private readonly model!: FunnelAnalysisInfo;

  @Ref()
  private readonly selectStepPopover!: SelectStepPopover;

  mounted() {
    if (!this.model) {
      this.$emit('input', FunnelAnalysisInfo.default());
    }
  }

  @Track(TrackEvents.FunnelAnalysisUpdateEvents, {
    events: (_: ManageFunnelAnalysis) => _.model.steps.map(step => step.eventName).join(',')
  })
  private addStep(e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event], {
      callback: (eventName: string) => {
        this.model.addStep(FunnelAnalysisStep.fromEventName(eventName));
        this.$emit('addStep');
      }
    });
  }

  @Track(TrackEvents.FunnelAnalysisUpdateEvents, {
    events: (_: ManageFunnelAnalysis) => _.model.steps.map(step => step.eventName).join(',')
  })
  private changeStep(step: FunnelAnalysisStep, index: number, e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event], {
      callback: (eventName: string) => {
        this.model.updateStep(index, FunnelAnalysisStep.fromEventName(eventName));
      }
    });
  }

  @Track(TrackEvents.FunnelAnalysisUpdateEvents, {
    events: (_: ManageFunnelAnalysis) => _.model.steps.map(step => step.eventName).join(',')
  })
  private removeStep(index: number) {
    this.model.removeStepAt(index);
  }

  private onEventBlockCollapse(collapse: boolean) {
    this.$emit('collapse:event', collapse);
  }
  private onFilterBlockCollapse(collapse: boolean) {
    this.$emit('collapse:filter', collapse);
  }
  private onCohortBlockCollapse(collapse: boolean) {
    this.$emit('collapse:cohort', collapse);
  }
}
</script>
<style lang="scss">
.manage-funnel-analysis {
  $spacing: 6px;

  .mb-2px {
    margin-bottom: 2px !important;
  }

  .input-group {
    //.form-control,
    .input-group-text {
      width: 30px;
      background-color: var(--input-background-color);
    }
  }

  .funnel-step-container {
    display: flex;
    flex-direction: column;
    position: relative;

    &.disabled {
      opacity: 0.7;

      &::after {
        content: '';
        display: block;
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 1;
        background: transparent;
      }
    }

    .event-filters-item {
      display: flex;
      //flex-wrap: wrap;
      margin-bottom: 8px;
      align-items: flex-start;

      .dropdown {
        display: inline-block;
      }
    }

    .efi {
      &-group,
      &-item,
      &-action {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        text-decoration: none;
        border: none;
        background: none;
        margin: 4px 10px 4px 0;
      }

      &-content {
        display: flex;
        justify-content: flex-start;
        flex-wrap: wrap;

        .efi-item {
          white-space: nowrap;
        }
      }

      &-group {
        font-weight: 500;
        width: 20px;
        //margin-right: 10px;
      }

      &-item {
        background-color: var(--active-color);
        padding: 6px 12px;
        border-radius: 4px;
        //margin-right: 8px;
        text-decoration: none;

        &-input {
          background: none;
          border: none;
          width: 60px;
          font-weight: 500;
        }
      }

      &-action {
        font-size: 18px;
        padding: 0 8px;
        color: var(--text-color);
        margin-right: 0;

        &:hover {
          background-color: #fafafb;
          border-radius: 4px;
        }

        &-danger {
          &:hover {
            color: var(--danger);
          }
        }
      }

      &-item-icon {
        margin-right: 8px;
      }

      &-event-icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        opacity: 0.1;
        border-radius: 4px;
        background-color: var(--accent);
      }

      &-item-text {
        color: var(--text-color);
        font-weight: 500;
      }
    }

    .di-calendar-input-container .input-calendar {
      height: auto !important;
    }
  }

  .dropdown-menu-events {
    width: 320px;
    //padding: 10px;
  }
}
</style>
