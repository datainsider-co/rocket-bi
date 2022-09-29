<template>
  <div class="percentage-bar" :class="{ decrease: isShowDownIcon, increase: !isShowDownIcon }">
    <template v-if="isValueValid">
      <template v-if="comparisonDisplayAs === 'number'">
        <span> <i :class="comparisonIconClass"></i> ({{ formattedValue }}) </span>
      </template>
      <template v-else-if="comparisonDisplayAs === 'percentage'">
        <span>
          <i :class="comparisonIconClass"></i> <span class="percentage-value">{{ percentageAsString }}</span>
        </span>
      </template>
      <template v-else-if="comparisonDisplayAs === 'text'">
        <div class="percentage-bar--text">
          <span>
            <i :class="comparisonIconClass"></i> <span class="percentage-value">{{ percentageAsString }}</span>
          </span>
          <span>Compare period: {{ formattedValue }}</span>
        </div>
      </template>
      <template v-else>
        <span>
          <i :class="comparisonIconClass"></i> <span class="percentage-value mr-1">{{ percentageAsString }}</span> ({{ formattedValue }})
        </span>
      </template>
    </template>
    <template v-else>
      <span>--</span>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { CompareStyle, TrendIcon } from '@core/common/domain';

@Component
export default class PercentageBar extends Vue {
  @Prop({ required: true, type: String })
  private readonly formattedValue!: string;

  @Prop({ required: true, type: Number })
  private readonly percentageValue!: number;

  @Prop({ required: true, type: Number })
  private readonly rawValue!: number;

  @Prop({ required: true, type: String })
  private readonly comparisonDisplayAs!: CompareStyle;

  @Prop({ required: true, type: Boolean })
  private readonly isShowDownIcon!: boolean;

  @Prop({ required: true, type: String })
  private readonly trendIcon!: string;

  private get percentageAsString() {
    if (Number.isFinite(this.percentageValue)) {
      return `${Math.abs(this.percentageValue)}%`;
    } else {
      return '--';
    }
  }

  private get isValueValid(): boolean {
    return Number.isFinite(this.rawValue);
  }

  private get comparisonIconClass(): any {
    return {
      'down-trend-color': this.isShowDownIcon,
      'up-trend-color': !this.isShowDownIcon,
      [this.trendIcon]: true
    };
  }
}
</script>

<style lang="scss">
.percentage-bar {
  span {
    align-items: center;
    color: var(--text-color);
    display: flex;
    font-size: 14px;
    font-stretch: normal;
    font-style: normal;
    font-weight: 500;
    letter-spacing: 0.23px;
    line-height: normal;
    text-align: center;

    i {
      font-size: 24px;
      margin-right: 8px;

      &.down-trend-color {
        color: var(--down-trend-color);
      }

      &.up-trend-color {
        color: var(--up-trend-color);
      }
    }
  }

  &--text {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    justify-items: center;

    > span + span {
      margin-top: 4px;
    }
  }

  &.decrease span.percentage-value {
    color: var(--down-trend-color);
  }

  &.increase span.percentage-value {
    color: var(--up-trend-color);
  }
}
</style>
