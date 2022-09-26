<template>
  <div class="funnel-analysis-chart" :style="funnelChartStyle">
    <div class="fc-overview">
      <template>
        <div class="fc-overview-item" v-loading="isLoading">
          <label>Session</label>
          <span>{{ total }}</span>
        </div>
      </template>
      <template>
        <div class="fc-overview-item" v-loading="isLoading">
          <label>Conversion Rate</label>
          <template>
            <span v-if="conversionRate">{{ conversionRate }}%</span>
            <span v-else>--</span>
          </template>
        </div>
      </template>
      <template>
        <div class="fc-overview-item" v-loading="isLoading">
          <label>Average Complete Time</label>
          <span>{{ averageTime }}</span>
        </div>
      </template>
    </div>
    <div class="fc-scroll-actions">
      <button class="fcsa-left" type="button" @click="scrollToLeft">
        <i class="di-icon-arrow-left2"></i>
      </button>
      <button class="fcsa-right" type="button" @click="scrollToRight">
        <i class="di-icon-arrow-right"></i>
      </button>
    </div>
    <vuescroll ref="scroller">
      <div class="fc-list-item" :style="`--fill-height: ${FILL_HEIGHT}px`">
        <template v-for="(item, idx) in funnelItems">
          <div v-if="item.isLoading" class="fc-item" :key="`loading-${idx}`" :id="getItemId(idx)" v-loading="true">
            <div class="fc-item-event-name">
              <label><br /></label>
              <span class="text-uppercase"><br /></span>
            </div>
            <div class="fc-item-fill">
              <div class="fcif-total"><br /></div>
              <div class="fcif-container">
                <div class="fcif-1"></div>
                <div class="fcif-2"></div>
              </div>
              <div class="fcif-dropoff">
                <div><br /></div>
                <div class="font-weight-bold fs-18"><br /></div>
                <div class="font-weight-bold fs-18"><br /></div>
              </div>
            </div>
            <div class="fc-item-avg-time">
              <div><br /><br /></div>
              <div class="font-weight-bold fs-18 mt-1">
                <br />
              </div>
            </div>
          </div>
          <div v-else :key="`${item.eventName}-${idx}`" :id="getItemId(idx)" class="fc-item" :style="getFunnelItemStyle(item)">
            <div class="fc-item-event-name">
              <label>Step {{ idx + 1 }}</label>
              <span class="text-uppercase">{{ item.eventName }}</span>
            </div>
            <div class="fc-item-fill">
              <div class="fcif-total">{{ item.value }}</div>
              <div class="fcif-container">
                <div class="fcif-1"></div>
                <div class="fcif-2"></div>
              </div>
              <div class="fcif-dropoff" :class="item.mode">
                <label class="fcif-dropoff-icon">
                  <i class="di-icon-arrow-down2"></i>
                </label>
                <template v-if="idx === funnelItems.length - 1">
                  <div class="text-uppercase">conversion</div>
                  <div class="font-weight-bold fs-18">{{ item.conversionRate }}%</div>
                  <div class="font-weight-bold fs-18"><br /></div>
                </template>
                <template v-else>
                  <div>Drop-off</div>
                  <div class="font-weight-bold fs-18">{{ item.dropOffRate }}%</div>
                  <div class="font-weight-bold fs-18">({{ item.dropOff }})</div>
                </template>
              </div>
            </div>
            <div class="fc-item-avg-time">
              <div>
                <template v-if="idx > 0">Average time from previous step</template>
                <template v-else><br /><br /></template>
              </div>
              <div class="font-weight-bold fs-18 mt-1">
                <template v-if="idx > 0">{{ getDate(item.avgDateFromPrev) }}</template>
                <template v-else><br /></template>
              </div>
              <label v-if="idx < funnelItems.length - 1" class="fc-item-avg-time-icon">
                <i class="di-icon-arrow-right"></i>
              </label>
            </div>
          </div>
        </template>
      </div>
    </vuescroll>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from 'vue-property-decorator';
import { FunnelAnalysisResponse, EventDetail } from '@core/CDP';
import { FunnelAnalysisItem } from '@/screens/CDP/components/FunnelChart/FunnelChart.entity';
import { ListUtils, RandomUtils } from '@/utils';
import { IdGenerator } from '@/utils/id_generator';
import vuescroll from 'vuescroll';
import { StringUtils } from '@/utils/string.utils';

@Component
export default class FunnelChart extends Vue {
  private readonly FILL_HEIGHT = FunnelAnalysisItem.FILL_HEIGHT;
  private readonly FUNNEL_WIDTH = 228;
  private funnelItems: FunnelAnalysisItem[] = [];
  private readonly uid = RandomUtils.nextString();

  @Prop({ required: true, type: Object, default: () => FunnelAnalysisResponse.default() })
  private readonly value!: FunnelAnalysisResponse;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isLoading!: boolean;

  @Ref()
  private readonly scroller!: any;

  @Watch('value', { immediate: true })
  private onFunnelAnalysisResponseChanged(value: FunnelAnalysisResponse) {
    this.funnelItems = FunnelChart.toFunnelChartItems(this.isLoading, value);
  }

  @Watch('isLoading', { immediate: true, deep: true })
  private onLoadingChanged(isLoading: boolean) {
    this.funnelItems = FunnelChart.toFunnelChartItems(isLoading, this.value);
  }
  private get total(): number {
    return this.value.getTotal();
  }

  private get conversionRate(): number | null {
    return ListUtils.getLast(this.funnelItems)?.conversionRate ?? null;
  }

  private get averageTime(): string {
    return '--';
  }

  private getDate(date: number | null): string {
    return '--';
  }

  private get funnelChartStyle() {
    return {
      '--funnel-width': StringUtils.toPx(this.FUNNEL_WIDTH)
    };
  }

  private getFunnelItemStyle(item: FunnelAnalysisItem) {
    return {
      '--total': StringUtils.toPx(item.totalHeight),
      '--dropoff': StringUtils.toPx(item.dropOffHeight)
    };
  }

  private getLoadingFunnelItemStyle() {
    return {
      '--total': StringUtils.toPx(this.FILL_HEIGHT),
      '--dropoff': 0
    };
  }

  private static toFunnelChartItems(isLoading: boolean, response: FunnelAnalysisResponse): FunnelAnalysisItem[] {
    const items: FunnelAnalysisItem[] = [];
    const finalTotal: number = response.getTotal();
    for (let index = 0; index < response.events.length; index++) {
      const curEvent = response.events[index];
      const preValue = response.events[index - 1]?.value ?? null;
      const nextValue = response.events[index + 1]?.value ?? null;
      const isLastItem = index == response.events.length - 1;
      const event = this.toFunnelChartItem(isLoading, curEvent, isLastItem, finalTotal, nextValue, preValue);
      items.push(event);
    }
    return items;
  }

  static toFunnelChartItem(isLoading: boolean, curEvent: EventDetail, isLastItem: boolean, finalTotal: number, nextValue?: number, preValue?: number) {
    if (isLastItem) {
      return FunnelAnalysisItem.showConversion(isLoading, curEvent.name, finalTotal, curEvent.value, preValue, nextValue, null);
    } else {
      return FunnelAnalysisItem.showDropOff(isLoading, curEvent.name, finalTotal, curEvent.value, preValue, nextValue, null);
    }
  }

  private getItemId(index: number): string {
    return IdGenerator.generateKey(['funnel', this.uid, index.toString()]);
  }

  private getFirstIndexInView(): number {
    const { scrollLeft } = this.scroller.getPosition();
    return Math.floor((scrollLeft ?? 0) / this.FUNNEL_WIDTH);
  }

  private getLastIndexInView(): number {
    const { scrollLeft } = this.scroller.getPosition();
    const width = this.scroller.$el.clientWidth;
    const maxWidth = (scrollLeft ?? 0) + width;
    return Math.floor(maxWidth / this.FUNNEL_WIDTH);
  }

  private scrollToLeft() {
    const index = this.getFirstIndexInView();
    if (index >= 0) {
      this.scrollToItem(index - 1);
    }
  }

  private scrollToRight() {
    const lastIndex = this.getLastIndexInView();
    if (lastIndex < this.funnelItems.length) {
      this.scrollToItem(lastIndex + 1);
    }
  }

  private scrollToItem(index: number) {
    const id = `#${this.getItemId(index)}`;
    this.scroller.scrollIntoView(id, 500);
  }
}
</script>
<style lang="scss">
.funnel-analysis-chart {
  $spacing: 16px;
  $bg-item: #fafafb;
  $bg-item-loading: #abadb0;
  $item-border-radius: 4px;
  $fill-color: #7a99ff;
  $danger-color: #e34f2e;
  $success-color: #2fc740;
  $draft-color: #5f6368;

  display: flex;
  flex-direction: column;
  width: 100%;
  color: var(--secondary-text-color);
  line-height: 1.4;

  .fs-18 {
    font-size: 18px;
  }
  position: relative;

  .fc-overview {
    padding: $spacing;
    display: flex;

    .fc-overview-item {
      display: flex;
      flex-direction: column;
      margin-right: 60px;
      margin-bottom: 10px;

      label {
        font-size: 16px;
        line-height: 1.4;
        margin-bottom: 4px;
      }

      span {
        font-size: 24px;
        font-weight: bold;
      }
    }
  }
  .fc-scroll-actions {
    display: none;
    .fcsa-right,
    .fcsa-left {
      position: absolute;
      z-index: 1;
      top: 50%;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      width: 24px;
      height: 24px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      border: none;
      font-size: 24px;
      color: #fff;
    }
    .fcsa-left {
      left: 0;
      transform: translate(-50%, 50%);
    }
    .fcsa-right {
      right: 0;
      transform: translate(50%, 50%);
    }
  }

  &:hover {
    .fc-scroll-actions {
      display: block;
    }
  }

  .fc-list-item {
    display: flex;
    margin-bottom: 20px;

    .fc-item {
      flex: 1;
      min-width: var(--funnel-width);
      max-width: var(--funnel-width);
      display: flex;
      flex-direction: column;
      margin-right: 3px;

      & > div {
        background-color: $bg-item;
        border-radius: $item-border-radius;
        margin-bottom: 2px;
        display: flex;
        flex-direction: column;
      }

      &.loading > {
        [class^='fc-item-'],
        [class*=' fc-item-'] {
          background-color: $bg-item-loading;
        }
      }
    }

    .fc-item-event-name {
      padding: 12px $spacing;
      white-space: nowrap;

      label {
        font-size: 16px;
        margin-bottom: 4px;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      span {
        font-size: 18px;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }

    .fc-item-fill {
      padding: 0;
      overflow: hidden;

      .fcif-total {
        font-size: 32px;
        padding: $spacing/2 $spacing 0;
      }
      .fcif-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        height: var(--fill-height);
        justify-content: flex-end;
      }
      .fcif-1 {
        width: calc(100% + 4px);
        margin: 0 -2px 0 -2px;
        height: var(--dropoff);
        background-color: $fill-color;
        clip-path: polygon(0% 0%, 100% 100%, 0% 100%);
      }
      .fcif-2 {
        height: calc(var(--total) - var(--dropoff));
        background-color: $fill-color;
        width: 100%;
      }

      .fcif-dropoff {
        font-size: 16px;
        text-align: center;
        padding: $spacing;
        position: relative;

        & > div {
          margin-top: 4px;
        }

        .fcif-dropoff-icon {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, -50%);
          display: inline-flex;
          width: 32px;
          height: 32px;
          justify-content: center;
          align-items: center;
          font-size: 32px;
          background: $draft-color;
          border-radius: 50%;
          color: #fff;
          z-index: 6;
        }
        &.dropoff {
          .fcif-dropoff-icon {
            background: $danger-color;
          }
        }

        &.conversion {
          color: $success-color;
          .fcif-dropoff-icon {
            background: $success-color;
          }
        }
      }
    }

    .fc-item-avg-time {
      padding: 12px $spacing * 2;
      display: flex;
      flex-direction: column;
      text-align: center;
      font-size: 16px;
      position: relative;

      .fc-item-avg-time-icon {
        position: absolute;
        width: 16px;
        height: 16px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        background: $fill-color;
        border-radius: 50%;
        font-size: 16px;
        color: #fff;
        right: 0;
        top: 50%;
        transform: translate(50%, -50%);
        z-index: 2;
      }
    }
  }
}
</style>
