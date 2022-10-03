<template>
  <div class="plan-type-item" :style="computedStyles">
    <div class="plan-type-item-header">
      <div class="plan-type-item-header-title">
        {{ planType }}
      </div>
      <div class="plan-type-item-header-price">
        {{ price }}
      </div>
    </div>
    <div class="plan-type-item-header-desc">
      Best for freelancers, small teams
    </div>
    <div v-if="active" class="plan-type-item-actions">
      <DiButton title="Active Plan" white class="active">
        <div class="active-plan-iw">
          <i class="di-icon-check"></i>
        </div>
      </DiButton>
    </div>
    <div v-else class="plan-type-item-actions">
      <DiButton v-if="isOnPremise" @click.prevent="contactUs" white title="Contact us"></DiButton>
      <DiButton v-else @click.prevent="buyNow" white title="Buy now"></DiButton>
    </div>
    <ul class="plan-type-item-features">
      <template v-for="(feature, index) in features">
        <li :key="index">{{ feature }}</li>
      </template>
    </ul>
    <img class="plan-type-item-icon" :src="require(`@/assets/icon/${icon}`)" />
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PlanFeatures, PlanPrice, PlanType, PlanTypeBgColors, PlanTypeIcon } from '@core/organization/domain/plan/PlanType';

@Component({})
export default class PlanTypeItem extends Vue {
  @Prop({ required: true, type: String })
  private planType!: PlanType;

  @Prop({ default: false, type: Boolean })
  private active = false;

  private get isOnPremise() {
    return this.planType === PlanType.OnPremise;
  }

  private get icon() {
    return PlanTypeIcon[this.planType];
  }

  private get bgColors() {
    return PlanTypeBgColors[this.planType];
  }

  private get price(): string {
    return PlanPrice[this.planType];
  }

  private get features(): string[] {
    return PlanFeatures[this.planType];
  }

  private get computedStyles() {
    return `--plan-bg-from: ${this.bgColors[0]}; --plan-bg-to: ${this.bgColors[1]}`;
  }

  private contactUs() {
    this.$emit('contactUs', this.planType);
  }

  private buyNow() {
    this.$emit('buyNow', this.planType);
  }
}
</script>
<style lang="scss">
$padding-x: 12px;
.plan-type-item {
  width: calc(50% - #{$padding-x * 2});
  margin: $padding-x;
  border-radius: 12px;
  padding: 32px;
  position: relative;
  text-align: left;
  background-image: linear-gradient(118deg, var(--plan-bg-from), var(--plan-bg-to));
  color: var(--secondary-2);

  @media screen and (max-width: 1000px) {
    width: calc(100% - 48px);
    justify-content: center;
  }

  &-header {
    display: flex;
    justify-content: space-between;
    line-height: 1;
    align-items: center;
    margin-bottom: 2px;
    &-title {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 1.03px;
      text-align: justify;
    }

    &-price {
      text-align: right;
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 1.54px;
    }

    &-desc {
      font-size: 14px;
      font-weight: normal;
      letter-spacing: 0.2px;
    }
  }

  &-actions {
    margin: 24px 0 16px;

    .di-button {
      width: 195px;
      height: 42px;
      justify-content: space-evenly;

      .active-plan-iw {
        display: flex;
        align-items: center;
        text-align: center;
        justify-content: center;
        background: #15b34e;
        border-radius: 50%;
        padding: 4px;
        > i {
          color: var(--accent-text-color);
        }
      }

      .title {
        width: unset;
      }

      &.active {
        cursor: default !important;
      }
    }
  }

  &-features {
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    text-align: left;

    li:before {
      font-family: data-insider-icon !important;
      content: '\e931';
      display: inline-block;
      width: 14px;
      height: 14px;
      margin-right: 12px;
    }
  }

  &-icon {
    width: 114px;
    height: 99px;
    object-fit: contain;
    position: absolute;
    right: 16px;
    bottom: 16px;
  }
}
</style>
