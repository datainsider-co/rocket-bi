<template>
  <div class="org-settings-content" :style="computedStyles">
    <div class="org-settings-content-header">
      <div class="org-settings-content-header-title">
        <div>Plan Details</div>
      </div>
    </div>
    <div class="plan-detail">
      <div class="plan-detail-title">
        {{ displayName }}
      </div>
      <div class="plan-detail-desc">
        <span>{{ startDate }}</span>
        <span v-if="endDate"> - {{ endDate }} </span>
      </div>
      <div class="plan-detail-body">
        <div class="plan-detail-body-content">
          <div class="plan-detail-body-content-item" v-if="hasLastPayment">
            <label>Last invoice total</label>
            <div>${{ lastPaymentAmount }}/mo</div>
          </div>
          <div class="plan-detail-body-content-item">
            <label>Monthly editor seats</label>
            <div>{{ editorSeats }}</div>
          </div>
          <div style="min-width: 200px;max-width: 460px" class="plan-detail-body-content-item">
            <label>Billing email</label>
            <div class="text-truncate">{{ invoiceEmail || '--' }}</div>
          </div>
          <div class="plan-detail-body-content-item">
            <label>Payment method</label>
            <div>{{ lastPaymentMethod }}</div>
          </div>
          <div class="plan-detail-body-content-item">
            <label>Payment status</label>
            <div>{{ lastPaymentStatus }}</div>
          </div>
        </div>
      </div>
      <img class="plan-detail-icon" :src="require(`@/assets/icon/${icon}`)" alt="" />
    </div>
    <div class="org-settings-content-header">
      <div class="org-settings-content-header-title">
        <div>Modify plan</div>
      </div>
    </div>
    <div class="org-overview">
      <div class="org-overview-item">
        <div class="org-overview-item-label">Upgrade or Modify Plan</div>
        <div class="org-overview-item-content">
          Make changes to your plan
        </div>
        <div class="org-overview-item-action">
          <DiButton @click.prevent="modify" title="Upgrade or Modify" primary></DiButton>
        </div>
      </div>
      <div class="org-overview-item">
        <div class="org-overview-item-label">Redeem Code</div>
        <div class="org-overview-item-content">
          Redeem a code to upgrade your plan
        </div>
        <div class="org-overview-item-action">
          <DiButton @click.prevent="onClickRedeemCode" title="Redeem Code" border></DiButton>
        </div>
      </div>

      <div class="org-overview-item">
        <div class="org-overview-item-label">Cancel Plan</div>
        <div class="org-overview-item-content">
          Submit a request to cancel your plan and switch to Professional
        </div>
        <div class="org-overview-item-action">
          <DiButton :disabled="!isSucceeded" @click.prevent="cancel" title="Cancel" border></DiButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { DateTimeUtils } from '@/utils';
import { PlanDisplayNames, PlanType, PlanTypeBgColors, PlanTypeIcon } from '@core/organization/domain/Plan/PlanType';
import { PaymentInfo, PaymentMethod, PaypalPaymentInfo, ProductSubscription, ProductSubscriptionInfo, UnknownPaymentInfo } from '@core/billing';

@Component({})
export default class PlanDetailComponent extends Vue {
  @Prop({ type: Object, required: true })
  protected readonly subscriptionInfo!: ProductSubscriptionInfo;

  protected get isSucceeded() {
    return this.subscriptionInfo.isPaymentSucceeded();
  }

  protected get paymentInfo(): PaymentInfo {
    return this.subscriptionInfo.payment ?? UnknownPaymentInfo.default();
  }

  protected get startDate(): string {
    return DateTimeUtils.formatDateDisplay(new Date(this.subscriptionInfo.startTime));
  }

  protected get endDate(): string {
    return DateTimeUtils.formatDateDisplay(new Date(this.subscriptionInfo.endTime));
  }

  protected get planType(): PlanType {
    return this.subscriptionInfo.product.name;
  }

  protected get displayName(): string {
    return PlanDisplayNames[this.planType];
  }

  protected get lastPaymentAmount(): number {
    return this.subscriptionInfo.product.price;
  }

  protected get hasLastPayment(): boolean {
    return this.paymentInfo.className !== PaymentMethod.RedeemCode;
  }

  protected get editorSeats(): number {
    return this.subscriptionInfo.product.editorSeats;
  }

  protected get invoiceEmail(): string {
    if (PaypalPaymentInfo.isPaypalPaymentInfo(this.paymentInfo)) {
      return this.paymentInfo.billingEmail;
    } else {
      return '';
    }
  }

  protected get lastPaymentMethod(): string {
    switch (this.paymentInfo.className) {
      case PaymentMethod.RedeemCode:
        return 'Redeem';
      case PaymentMethod.Paypal:
        return 'Paypal';
      default:
        return '';
    }
  }

  protected get lastPaymentStatus(): string {
    return this.paymentInfo.status;
  }

  protected cancel() {
    this.$emit('cancelPlan');
  }

  protected modify() {
    this.$emit('modifyPlan');
  }

  protected onClickRedeemCode() {
    this.$emit('clickRedeemCode');
  }

  get icon() {
    return PlanTypeIcon[this.planType];
  }

  get bgColors() {
    return PlanTypeBgColors[this.planType];
  }

  protected get computedStyles() {
    return `--plan-bg-from: ${this.bgColors[0]}; --plan-bg-to: ${this.bgColors[1]}`;
  }
}
</script>
<style lang="scss" src="./PlanDetailComponent.scss"></style>
