<template>
  <LayoutContent class="plan-and-billing-layout-content">
    <LayoutHeader title="Plan Detail & Billing" icon="di-icon-dollar"></LayoutHeader>
    <div class="layout-content-panel">
      <div v-if="!inited || loading" class="plan-and-billing-content">
        <div class="d-flex justify-content-center align-items-center w-100 h-100">
          <DiLoading></DiLoading>
        </div>
      </div>
      <PlanDetailComponent
        v-else-if="subscriptionInfo && subscriptionInfo.isPaidPlan"
        :subscriptionInfo="subscriptionInfo"
        @cancelPlan="onCancelPlan"
        @modifyPlan="onModifyPlan"
        @clickRedeemCode="onClickRedeemCode"
      ></PlanDetailComponent>
      <template v-else :ops="scrollOptions">
        <div class="plan-and-billing-content">
          <div class="org-settings-content-header">
            <div class="org-settings-content-header-title">
              <div v-if="countdown > 0">You can try this product for {{ dateLeft }} days.</div>
              <div v-else>Your trial has expired for 30 days.</div>
              <div class="org-settings-content-header-desc">
                This plan gives you access to free product trials, tutorials, and more. When you’re ready to upgrade, choose the plan that fits your needs.
              </div>
            </div>
            <div v-if="currentTime > 0" class="org-settings-content-header-actions">
              <div :class="{ expired: countdown <= 0 }" class="date-countdown">
                <div class="date-countdown-item">
                  <span class="date-countdown-item-value">{{ dateLeft }}</span>
                  <span class="date-countdown-item-label">Day</span>
                </div>
                <div class="date-countdown-item">
                  <span class="date-countdown-item-value">{{ hourLeft }}</span>
                  <span class="date-countdown-item-label">Hour</span>
                </div>
                <div class="date-countdown-item">
                  <span class="date-countdown-item-value">{{ minuteLeft }}</span>
                  <span class="date-countdown-item-label">Min</span>
                </div>
                <div class="date-countdown-item">
                  <span class="date-countdown-item-value">{{ secondLeft }}</span>
                  <span class="date-countdown-item-label">Sec</span>
                </div>
              </div>
            </div>
          </div>
          <div class="org-settings-content-body">
            <div class="plan-and-billing">
              <div class="plan-and-billing-header">
                <div class="plan-and-billing-header-title">
                  A plan for every product
                </div>
                <DiButton title="Use Redeem Code" border @click.prevent="onClickRedeemCode" />
                <!--                <div class="plan-and-billing-header-actions">-->
                <!--                  <a href="#">View plan details</a>-->
                <!--                </div>-->
              </div>
              <div class="plan-and-billing-body">
                <PlanTypeItem
                  v-for="planType in planTypes"
                  :key="planType"
                  :active="isActivePlan(planType)"
                  :planType="planType"
                  @buyNow="onBuyNow"
                  @contactUs="onContactUs"
                ></PlanTypeItem>
              </div>
            </div>
          </div>
        </div>
      </template>
      <ModifyPlan ref="modify" @buyNow="onRevisePlan" @contactUs="onContactUs"></ModifyPlan>
      <ContactUsModal ref="contactUsModal"></ContactUsModal>
      <DiRenameModal ref="redeemCodeModal" title="Redeem Code Submission" placeholder="Enter redeem code" label="Redeem code" action-name="Submit" />
    </div>
  </LayoutContent>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { VerticalScrollConfigs } from '@/shared';
import PlanDetailComponent from '../../components/plan-detail/PlanDetailComponent.vue';
import DiLoading from '@/shared/components/DiLoading.vue';
import { Log } from '@core/utils';
import ModifyPlan from '@/screens/organization-settings/components/modify-plan/ModifyPlan.vue';
import { PlanDisplayNames, PlanType } from '@core/organization/domain/Plan/PlanType';
import PlanTypeItem from '@/screens/organization-settings/components/PlanTypeItem.vue';
import Swal from 'sweetalert2';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { PaymentStatus, PaypalPaymentInfo, ProductSubscriptionInfo } from '@core/billing';
import { PlanAndBillingModule } from '@/screens/organization-settings/stores/PlanAndBillingStore';
import ContactUsModal from '@/screens/organization-settings/components/ContactUsModal.vue';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { DIException } from '@core/common/domain';
import { PopupUtils, TimeoutUtils } from '@/utils';
import { AtomicAction } from '@core/common/misc';

@Component({
  components: { ContactUsModal, PlanDetailComponent, DiLoading, ModifyPlan, PlanTypeItem, LayoutContent, LayoutHeader, DiRenameModal }
})
export default class PlanAndBilling extends Vue {
  private error: string | null = null;
  private inited = false;
  private loading = false;
  private planTypes: PlanType[] = [PlanType.Startup, PlanType.Business, PlanType.Cooperate, PlanType.OnPremise];
  private currentTime = 0;
  private countdownInterval: number | undefined = undefined;
  private $alert: typeof Swal = Swal;
  private readonly scrollOptions = VerticalScrollConfigs;
  private fetchPlanInterval = 0;

  @Ref()
  private readonly modify?: ModifyPlan;

  @Ref()
  private readonly contactUsModal?: ContactUsModal;

  @Ref()
  protected readonly redeemCodeModal?: DiRenameModal;

  protected get subscriptionInfo(): ProductSubscriptionInfo | null {
    return PlanAndBillingModule.planDetail;
  }

  get dateLeft() {
    if (this.countdown > 0) {
      return Math.floor(this.countdown / 864e5);
    }
    return 0;
  }

  get hourLeft() {
    if (this.countdown > 0) {
      return Math.floor((this.countdown % 864e5) / 36e5);
    }
    return this.countdown;
  }

  get minuteLeft() {
    if (this.countdown > 0) {
      return Math.floor(((this.countdown % 864e5) % 36e5) / 6e4);
    }
    return this.countdown;
  }

  get secondLeft() {
    if (this.countdown > 0) {
      Log.info((((this.countdown % 864e5) % 36e5) % 6e4) / 1000);
      return Math.ceil((((this.countdown % 864e5) % 36e5) % 6e4) / 1000) - 1;
    }
    return this.countdown;
  }

  get countdown() {
    if (this.subscriptionInfo && this.currentTime > 0 && this.subscriptionInfo.endTime > this.currentTime) {
      return this.subscriptionInfo.endTime - this.currentTime;
    } else {
      return 0;
    }
  }

  startCountdown() {
    this.countdownInterval = setTimeout(() => {
      if (!this.subscriptionInfo) this.stopCountdown();
      this.currentTime = new Date().valueOf();
      if (this.subscriptionInfo && this.currentTime < this.subscriptionInfo.endTime) {
        this.startCountdown();
      } else {
        this.stopCountdown();
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.countdownInterval !== null) {
      clearTimeout(this.countdownInterval);
    }
  }

  async mounted() {
    this.inited = true;
    if (PlanAndBillingModule.isInitLoading) {
      this.loading = true;
    }
    await this.handleLoadListPlan();
  }

  destroyed() {
    this.stopCountdown();
    clearInterval(this.fetchPlanInterval);
  }

  private get isInitLoading() {
    return PlanAndBillingModule.isInitLoading;
  }

  private get paymentStatus() {
    return PlanAndBillingModule.paymentStatus;
  }

  @Watch('isInitLoading', { immediate: true })
  handleInitLoadingChanged(isLoading: boolean) {
    Log.debug('PlanAndBilling::handleInitLoadingChanged::isLoading::', isLoading);
    if (isLoading) {
      this.loading = true;
    } else {
      this.startCountdown();
      this.verifyPayment(this.subscriptionInfo);
      if (PlanAndBillingModule.initError) {
        this.error = PlanAndBillingModule.initError;
      }
      this.loading = false;
    }
  }

  @Watch('paymentStatus', { immediate: true })
  onPaymentStatusChanged(status: PaymentStatus) {
    clearInterval(this.fetchPlanInterval);
    if (status === PaymentStatus.BillingApproval || status === PaymentStatus.UpdateApproval) {
      this.fetchPlanInterval = setInterval(async () => {
        await PlanAndBillingModule.handleReloadPlanning();
        if (PlanAndBillingModule.paymentStatus !== PaymentStatus.BillingApproval && PlanAndBillingModule.paymentStatus !== PaymentStatus.UpdateApproval) {
          clearInterval(this.fetchPlanInterval);
        }
      }, 3000);
    }
  }

  private async handleLoadListPlan() {
    try {
      this.loading = true;
      await PlanAndBillingModule.getListPlan();
    } catch (e) {
      Log.error('PlanAndBilling::handleLoadListPlan::error::', e);
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }

  private verifyPayment(subscriptionInfo: ProductSubscriptionInfo | null) {
    if (subscriptionInfo && PaypalPaymentInfo.isPaypalPaymentInfo(subscriptionInfo.payment) && subscriptionInfo.payment.approvalLink) {
      const approvalLink = subscriptionInfo.payment.approvalLink;
      this.$alert
        .fire({
          title: 'Your payment was not successful!',
          html: `<div>Please try again to complete payment.<br>Skip this message if you are already paid.</div>`,
          // html: `<p>Please <a href="${this.data.payPalApprovalUrl}" target="_blank">click here</a> to complete your payment!</p>`,
          confirmButtonText: 'Try again',
          showCancelButton: true,
          // showConfirmButton: false,
          cancelButtonText: 'Skip'
        })
        .then(result => {
          if (result.isConfirmed) {
            window.open(approvalLink);
          }
        });
    }
  }

  private isActivePlan(planType: PlanType) {
    return this.subscriptionInfo?.planType === planType;
  }

  private get planDisplayName(): string {
    return PlanDisplayNames[this.subscriptionInfo?.planType ?? PlanType.NoPlan];
  }

  private async onCancelPlan() {
    if (!this.subscriptionInfo) return;
    const { isConfirmed } = await this.$alert.fire({
      icon: 'warning',
      title: 'Cancel Plan',
      html: `Are you sure you want to <br>cancel your <strong>${this.planDisplayName} plan</strong>?`,
      confirmButtonText: 'Yes',
      showCancelButton: true,
      cancelButtonText: 'No'
    });
    if (isConfirmed) {
      this.$alert.fire({
        icon: 'info',
        title: 'Cancel Plan',
        html: 'Wait a minute...',
        showConfirmButton: false,
        didOpen: () => {
          this.$alert.showLoading();
        }
      });
      PlanAndBillingModule.cancelPlan()
        .then(() => {
          this.$alert.hideLoading();
          this.$alert.fire({
            icon: 'success',
            title: 'Cancel plan success',
            confirmButtonText: 'OK',
            timer: 2000
          });
        })
        .catch(e => {
          Log.info(e);
          this.$alert.hideLoading();
          this.$alert.fire({
            icon: 'error',
            title: 'Cancel plan fail',
            html: e.message,
            confirmButtonText: 'OK'
          });
        });
    }
  }

  private onModifyPlan(): void {
    this.modify?.show(this.subscriptionInfo?.planType);
  }

  @AtomicAction()
  protected onClickRedeemCode(): void {
    if (this.redeemCodeModal) {
      const redeemModal = this.redeemCodeModal!;
      redeemModal.show('', async newCode => {
        try {
          redeemModal.setLoading(true);
          Log.debug('PlanAndBilling::onClickRedeemCode::newCode::', newCode);
          await PlanAndBillingModule.redeem(newCode);
          redeemModal.hide();
          // avoid stuck ui
          await TimeoutUtils.sleep(500);
          PopupUtils.showSuccess('Redeem code success');
          await PlanAndBillingModule.handleReloadPlanning();
        } catch (error) {
          const ex = DIException.fromObject(error);
          Log.error('PlanAndBilling::onClickRedeemCode::error::', ex);
          redeemModal.setError(ex.getPrettyMessage());
        } finally {
          redeemModal.setLoading(false);
        }
        //
      });
    }
  }

  private async onContactUs() {
    this.modify?.hide();
    this.contactUsModal?.show();
  }

  private async onBuyNow(planType: PlanType) {
    // if (this.data && this.data.payPalApprovalUrl) {
    //   this.verifyPayment(this.data);
    // } else {
    this.$alert.fire({
      icon: 'info',
      title: 'Subscribe plan',
      html: 'Wait a minute...',
      showConfirmButton: false,
      didOpen: () => {
        this.$alert.showLoading();
      }
    });
    try {
      const resp = await PlanAndBillingModule.buyPlan(planType);
      Log.info(resp);
      this.$alert.hideLoading();
      this.$alert.fire({
        icon: 'success',
        title: 'Subscribe plan success',
        html: '<div>Please complete your payment to finished setup.</div>',
        confirmButtonText: 'OK'
        // timer: 2000
      });
      if (this.subscriptionInfo && PaypalPaymentInfo.isPaypalPaymentInfo(this.subscriptionInfo.payment) && this.subscriptionInfo.payment.approvalLink) {
        window.open(this.subscriptionInfo.payment.approvalLink);
      }
    } catch (e) {
      Log.info(e);
      this.$alert.hideLoading();
      this.$alert.fire({
        icon: 'error',
        title: 'Subscribe plan fail',
        html: e.message,
        confirmButtonText: 'OK'
      });
    }
    // }
  }

  private async onRevisePlan(planType: PlanType) {
    this.$alert.fire({
      icon: 'info',
      title: 'Modify plan',
      html: 'Wait a minute...',
      showConfirmButton: false,
      didOpen: () => {
        this.$alert.showLoading();
      }
    });
    try {
      const resp = await PlanAndBillingModule.buyPlan(planType);
      this.modify?.hide();
      Log.info(resp);
      this.$alert.hideLoading();
      this.$alert.fire({
        icon: 'success',
        title: `Subscribe plan success.`,
        html: `If you are sure that you want to modify your plan, please make the payment for the <b>${PlanDisplayNames[planType]}</b>. After that, refresh page by manual`,
        confirmButtonText: 'OK'
        // timer: 2000
      });
      if (this.subscriptionInfo && PaypalPaymentInfo.isPaypalPaymentInfo(this.subscriptionInfo.payment) && this.subscriptionInfo.payment.approvalLink) {
        window.open(this.subscriptionInfo.payment.approvalLink);
      }
    } catch (e) {
      Log.info(e);
      this.$alert.hideLoading();
      this.$alert.fire({
        icon: 'error',
        title: 'Subscribe plan fail',
        html: e.message,
        confirmButtonText: 'OK'
      });
    }
    // this.orgService
    //   .revisePlan(planType)
    //   .then(resp => {
    //     Log.info(resp);
    //     this.$alert.hideLoading();
    //     this.$alert.fire({
    //       icon: 'success',
    //       title: 'Modify plan success',
    //       confirmButtonText: 'OK',
    //       timer: 2000
    //     });
    //   })
    //   .catch(e => {
    //     Log.info(e);
    //     debugger;
    //     this.$alert.hideLoading();
    //     this.$alert.fire({
    //       icon: 'error',
    //       title: 'Modify plan fail',
    //       html: e.message,
    //       confirmButtonText: 'OK'
    //     });
    //   });
    // this.$alert.fire({
    //   icon: 'info',
    //   title: 'Contact us',
    //   confirmButtonText: 'OK'
    // });
  }
}
</script>
<style lang="scss" src="./PlanAndBilling.scss"></style>
