<template>
  <DIPopover
    :isShow="true"
    :targetId="targetId"
    custom-class="chart-filter-popover"
    is-show-header
    is-show-title
    placement="bottom-left"
    triggers="blur"
    @update:isShow="handleHidePopover"
  >
    <vuescroll :ops="ScrollOption">
      <div :style="containerStyle" class="chart-filter-popover-scroller">
        <template v-if="displayAsTab">
          <NormalTabItem
            v-for="(item, index) in data"
            :key="index"
            :isSelected="isSelected(item)"
            :item="item"
            class="vertical"
            @onSelectItem="handleItemSelected(item.id)"
          />
        </template>
        <div class="button-option" v-else>
          <template v-for="(item, index) in data">
            <DiButton
              :id="genBtnId(`action-${item.id}`, index)"
              :key="genBtnId(`action-${item.id}`, index)"
              :title="item.displayName"
              @click.stop="handleItemSelected(item.id)"
            >
              <template #suffix-content>
                <span v-if="isSelected(item)" id="suffix-content">
                  <svg height="16" viewBox="0 0 16 16" width="16">
                    <g fill="none" fill-rule="evenodd">
                      <path d="M0 0H16V16H0z" />
                      <path
                        d="M12.293 4.293L6 10.586 3.707 8.293c-.392-.379-1.016-.374-1.402.012-.386.386-.391 1.01-.012 1.402l3 3c.39.39 1.024.39 1.414 0l7-7c.379-.392.374-1.016-.012-1.402-.386-.386-1.01-.391-1.402-.012z"
                        fill="#597FFF"
                        fill-rule="nonzero"
                      />
                    </g>
                  </svg>
                </span>
              </template>
            </DiButton>
          </template>
        </div>
      </div>
    </vuescroll>
  </DIPopover>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo, TabFilterOption } from '@core/common/domain';
import { SelectOption, TabFilterDisplay, VerticalScrollConfigs } from '@/shared';
import NormalTabItem from '@/shared/components/filters/NormalTabItem.vue';
import DIPopover from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/DIPopover.vue';

@Component({ components: { NormalTabItem, DIPopover } })
export default class ChartFilterPopover extends Vue {
  private ScrollOption = VerticalScrollConfigs;
  @Prop({ required: true, type: Object })
  private readonly metaData!: ChartInfo;

  @Prop({ required: true, type: String })
  private targetId!: string;

  @Prop({ required: false, type: Array, default: [] })
  private readonly data!: SelectOption[];

  @Prop()
  private readonly selectedValue!: any;

  get containerStyle() {
    // const alignKey = this.direction == Direction.column ? 'justify-content' : 'align-self';
    return {
      '--background-color': this.options.options.background,
      // '--text-color': this.setting.options.textColor,
      // [alignKey]: this.setting.options.align ?? 'center',
      '--background-active': this.options.options.activeColor,
      '--background-de-active': this.options.options.deActiveColor
    };
  }

  private get options(): TabFilterOption {
    return this.metaData.chartFilter!.setting.getChartOption() as TabFilterOption;
  }

  private get displayAsTab(): boolean {
    return (this.metaData.chartFilter!.setting.getChartOption() as TabFilterOption)?.options?.displayAs === TabFilterDisplay.normal;
  }

  private isSelected(item: SelectOption) {
    return this.selectedValue === item.id;
  }

  @Emit('onSelected')
  private handleItemSelected(newValue: any) {
    this.handleHidePopover();
    return newValue;
  }

  @Emit('hide')
  private handleHidePopover(currentEvent?: Event) {
    return currentEvent ?? event;
  }
}
</script>

<style lang="scss">
.chart-filter-popover .popover-body {
  max-width: 210px;
  min-width: 90px;
}

.chart-filter-popover .custom-popover {
  max-width: 210px;
  min-width: 90px;
  padding: 8px;

  .chart-filter-popover-scroller {
    max-height: 250px;
    .button-option {
      .di-button {
        padding: 16px 8px;
      }

      .di-button .title {
        font-size: 14px;
        text-align: left;
        font-weight: 400;
        color: var(--secondary-text-color);
      }

      .di-button:hover .title {
        color: var(--text-color);
      }
    }
  }

  .vertical + .vertical {
    margin-top: 8px;
  }

  .tab-item-mini {
    width: 100%;
    color: var(--tab-filter-de-active);
  }
}
</style>
