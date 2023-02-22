<template>
  <LayoutContent>
    <LayoutHeader title="Premium Features" icon="di-icon-dollar"></LayoutHeader>
    <div class="premium-features">
      <div class="premium-features-header d-flex align-items-center">
        <div class="premium-features-title">PREMIUM FEATURES</div>
        <DiButton class="ml-auto" @click="refresh" title="Refresh">
          <i class="di-icon-refresh"></i>
        </DiButton>
      </div>
      <div class="premium-features-body ">
        <div class="premium-features-body-subscription">
          <StatusWidget class="position-relative" :status="status" :error="errorMessage" @retry="handleLoadSubscriptionInfo(false)">
            <div class="premium-features-body-subscription-status" v-if="subscription">
              <div class="premium-features-body-subscription-plan">Free plan</div>
              <div class="premium-features-body-subscription-plan-subtitle">
                This plan gives you access to free product trials, tutorials, and more. When you’re ready to upgrade, choose the plan that fits your needs.
              </div>
              <div class="premium-features-body-subscription-details">
                <div class="premium-features-body-subscription-details-last-invoice">
                  <div class="title">Last invoice total</div>
                  <div class="data">{{ lastInvoice }}$/month</div>
                </div>
                <div class="premium-features-body-subscription-details-email">
                  <div class="title">Billing email</div>
                  <div class="data">
                    {{ subscription.email }}
                  </div>
                </div>
                <div class="premium-features-body-subscription-details-status">
                  <div class="title">Payment status</div>
                  <div class="data">
                    {{
                      subscription && subscription.paymentInfo && subscription.paymentInfo.status
                        ? formatStatus(subscription.paymentInfo.status)
                        : 'Unsubscribed'
                    }}
                  </div>
                </div>
                <div class="premium-features-body-subscription-details-payment-method">
                  <div class="title">Payment method</div>
                  <div class="data">
                    Paypal
                  </div>
                </div>
              </div>
            </div>
          </StatusWidget>
        </div>

        <div class=" premium-features-body-features">
          <div class="premium-features-body-features-title">
            <div class="title">ADD MORE PLAN</div>
            <div class="subtitle">Select more features below to add to your plan if needed.</div>
          </div>
          <StatusWidget
            class="premium-features-body-features-status position-relative"
            :status="loadFeatureStatus"
            :error="loadFeaturesErrorMessage"
            @retry="handleLoadFeatures(true)"
          >
            <div>
              <vuescroll ref="vuescroll" class="premium-features-body-features-scroll" :ops="verticalScrollConfig">
                <div>
                  <template v-for="product in allFeatures">
                    <PremiumFeature :key="product.id" :feature="product" @cancel="showCancelFeatureConfirm"></PremiumFeature>
                  </template>
                </div>
              </vuescroll>
            </div>
          </StatusWidget>
        </div>
      </div>

      <div class="premium-features-footer d-flex align-items-center">
        <div class="d-flex flex-column">
          <div class="mb-2">ADDING {{ amountOfSelectedFeatures }} FEATURE</div>
          <div>TOTAL PRICE: {{ selectedFeaturesPrice }}$</div>
        </div>
        <div class="premium-features-footer-actions ml-auto d-flex align-items-center">
          <DiButton
            v-if="subscription"
            :is-loading="cancelSubscriptionLoading"
            :disabled="cancelSubscriptionLoading || subscribedProductIds.length <= 0"
            class="mr-2"
            title="Cancel"
            @click="showCancelSubscriptionConfirm(subscription)"
          />
          <DiButton
            v-if="approvalLink && (isUpdateApproval || isSubscribeApproval)"
            primary
            title="Paypal Approval"
            @click="redirectToPaymentLink(approvalLink)"
          ></DiButton>
          <DiButton
            v-else-if="subscription && subscription.paymentInfo && !isCanceledStatus(subscription.paymentInfo.status)"
            :disabled="!haveSubscribeFeatures"
            :is-loading="isSubscribeButtonLoading"
            primary
            title="Subscribe"
            @click="handleUpdateFeatures(newSubscribedProductIds)"
          ></DiButton>
          <DiButton
            v-else
            :disabled="!haveSubscribeFeatures"
            :is-loading="isSubscribeButtonLoading"
            primary
            title="Subscribe"
            @click="handleSubscribeFeatures(newSubscribedProductIds)"
          ></DiButton>
        </div>
      </div>
    </div>
  </LayoutContent>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { Status, VerticalScrollConfigs } from '@/shared';
import { DIException } from '@core/common/domain';
import { ListUtils, Modals, PopupUtils, StringUtils } from '@/utils';
import { Log } from '@core/utils/Log';
import PremiumFeature from '@/screens/organization-settings/views/premium-features/PremiumFeature.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Inject } from 'typescript-ioc';
import { BillingService, PaymentStatus, ProductInfo, SubscriptionInfo } from '@core/billing';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import OrganizationPermissionModule from '@/store/modules/OrganizationPermissionStore';

@Component({
  components: {
    DiButton,
    PremiumFeature,
    LayoutContent,
    LayoutHeader,
    StatusWidget
  }
})
export default class PremiumFeatures extends Vue {
  private readonly verticalScrollConfig = VerticalScrollConfigs;
  private status: Status = Status.Loaded;
  private loadFeatureStatus: Status = Status.Loaded;
  private isSubscribeButtonLoading = false;
  private errorMessage = '';
  private loadFeatureErrorMessage = '';
  private loadFeaturesErrorMessage = '';
  private allFeatures: ProductInfo[] = [];
  private subscription: SubscriptionInfo | null = null;
  private cancelSubscriptionLoading = false;

  @Inject
  private billingService!: BillingService;

  @Ref()
  private readonly vuescroll?: any;

  private showLoading() {
    this.status = Status.Loading;
  }

  private showUpdating() {
    this.status = Status.Updating;
  }

  private showLoaded() {
    this.status = Status.Loaded;
  }

  private showError(ex: DIException) {
    this.status = Status.Error;
    this.errorMessage = ex.getPrettyMessage();
  }

  private showFeatureLoading() {
    this.loadFeatureStatus = Status.Loading;
  }

  private showFeatureUpdating() {
    this.loadFeatureStatus = Status.Updating;
  }

  private showFeatureLoaded() {
    this.loadFeatureStatus = Status.Loaded;
  }

  private showFeatureError(ex: DIException) {
    this.loadFeatureStatus = Status.Error;
    this.loadFeatureErrorMessage = ex.getPrettyMessage();
  }

  private showFeaturesLoading() {
    this.loadFeatureStatus = Status.Loading;
  }

  private showFeaturesUpdating() {
    this.loadFeatureStatus = Status.Updating;
  }

  private showFeaturesLoaded() {
    this.loadFeatureStatus = Status.Loaded;
  }

  private get isUpdateApproval() {
    //UpdateApproval SubscribeApproval
    return this.subscription?.paymentInfo?.status === PaymentStatus.UpdateApproval;
  }

  private get isSubscribeApproval() {
    return this.subscription?.paymentInfo?.status === PaymentStatus.SubscribeApproval;
  }

  private showFeaturesError(ex: DIException) {
    this.loadFeatureStatus = Status.Error;
    this.loadFeaturesErrorMessage = ex.getPrettyMessage();
  }

  private get amountOfSelectedFeatures(): number {
    return this.allFeatures.filter(feature => feature.isSelected).length;
  }

  private get selectedProductIds(): string[] {
    const selectedProductIds: string[] = [];
    this.allFeatures.forEach(feature => {
      if (feature.isSelected) {
        selectedProductIds.push(feature.id);
      }
    });
    return selectedProductIds;
  }

  private get newSubscribedProductIds(): string[] {
    const setProductIds = new Set<string>(this.selectedProductIds.concat(this.subscribedProductIds));
    return [...setProductIds];
  }

  private get approvalLink() {
    return this.subscription?.paymentInfo?.approvalLink ?? null;
  }

  private get selectedFeaturesPrice(): number {
    let result = 0;
    this.allFeatures.forEach(feature => {
      if (feature.isSelected) {
        result += feature.price;
      }
    });
    return result;
  }

  private get licenseKey() {
    return Di.get(DataManager).getUserInfo()?.organization.licenceKey ?? '';
  }

  private get haveSubscribeFeatures() {
    return this.amountOfSelectedFeatures > 0;
  }

  private get lastInvoice(): number {
    let lastInvoice = 0;
    this.allFeatures.forEach(product => {
      if (product.isSubscribed) {
        lastInvoice += product.price;
      }
    });
    return lastInvoice;
  }

  async mounted() {
    await this.handleLoadFeatures(true);
    await this.handleLoadSubscriptionInfo();
  }

  private async handleLoadSubscriptionInfo(force = true) {
    try {
      force ? this.showLoading() : this.showUpdating();
      this.subscription = await this.billingService.getSubscriptionInfo(this.licenseKey);
      this.renderSubscribedProduct(this.subscription.productIds);
      this.showLoaded();
    } catch (e) {
      const ex = DIException.fromObject(e);
      this.showError(ex);
      Log.error(`PremiumFeatures::handleLoadFeatures::error::`, e);
    }
  }

  private async refresh() {
    await this.handleLoadFeatures(true);
    await this.handleLoadSubscriptionInfo(false);
  }

  private isUpdateApprovalStatus(status?: PaymentStatus) {
    return status === PaymentStatus.UpdateApproval;
  }

  private isSubscribeApprovalStatus(status?: PaymentStatus) {
    return status === PaymentStatus.SubscribeApproval;
  }

  private isCanceledStatus(status?: PaymentStatus) {
    return status === PaymentStatus.Canceled;
  }

  @Watch('subscription.paymentInfo.status')
  private autoRefresh(status?: PaymentStatus) {
    let refreshInterval = 0;
    if (this.isUpdateApprovalStatus(status) || this.isSubscribeApprovalStatus(status)) {
      refreshInterval = setInterval(async () => {
        const allFeatures = (await this.billingService.getProducts()).data;
        const subscription = await this.billingService.getSubscriptionInfo(this.licenseKey);
        if (!this.isUpdateApprovalStatus(subscription?.paymentInfo?.status) && !this.isUpdateApprovalStatus(subscription?.paymentInfo?.status)) {
          Log.debug('PremiumFeatures::autoRefresh::clearInterval');
          OrganizationPermissionModule.init();
          this.allFeatures = allFeatures;
          this.subscription = subscription;
          this.renderSubscribedProduct(this.subscription.productIds);
          clearInterval(refreshInterval);
        }
      }, 5000);
    }
  }

  private renderSubscribedProduct(productIds: string[]) {
    this.allFeatures.forEach(item => {
      item.isSubscribed = false;
      item.isSelected = false;
    });
    productIds.forEach(productId => {
      const productInfo = this.allFeatures.find(product => productId === product.id);
      if (productInfo) {
        productInfo.isSubscribed = true;
      }
    });
  }

  private formatStatus(status?: PaymentStatus): string {
    return status ? StringUtils.camelToCapitalizedStr(status) : 'Not Found';
  }

  private async handleLoadFeatures(force = false) {
    try {
      force ? this.showFeatureLoading() : this.showFeatureUpdating();
      this.allFeatures = (await this.billingService.getProducts()).data;
      this.scrollToTop();
      this.showFeatureLoaded();
    } catch (e) {
      const ex = DIException.fromObject(e);
      this.showFeaturesError(ex);
      Log.error(`PremiumFeatures::handleLoadFeatures::error::`, e);
    }
  }

  private scrollToTop() {
    this.vuescroll?.scrollTo(
      {
        y: 0
      },
      500
    );
  }

  private showCancelFeatureConfirm(feature: ProductInfo) {
    const subscribedProductIds = ListUtils.remove(this.subscribedProductIds, productId => productId === feature.id);
    if (subscribedProductIds.length <= 0) {
      this.showCancelSubscriptionConfirm(this.subscription!);
    } else {
      Modals.showConfirmationModal(`Are you sure cancel feature ${feature.name}`, {
        onOk: () => this.handleUpdateFeatures(subscribedProductIds)
      });
    }
  }

  private get subscribedProductIds() {
    const subscribedFeature: string[] = [];
    this.allFeatures.forEach(product => {
      if (product.isSubscribed) {
        subscribedFeature.push(product.id);
      }
    });
    return subscribedFeature;
  }

  private showCancelSubscriptionConfirm(subscription: SubscriptionInfo) {
    Modals.showConfirmationModal(`Are you sure cancel this subscription`, {
      onOk: () => this.handleCancelSubscription(subscription)
    });
  }

  private async handleUpdateFeatures(productIds: string[]) {
    try {
      Log.debug('PremiumFeatures::handleUpdateFeatures::subscribedProductIds::', productIds);
      this.isSubscribeButtonLoading = true;
      this.subscription = await this.billingService.updateProducts(this.licenseKey, productIds);
      this.redirectToPaymentLink(this.approvalLink!);
    } catch (e) {
      const ex = DIException.fromObject(e);
      PopupUtils.showError(ex.getPrettyMessage());
      Log.error(`PremiumFeatures::handleCancelFeature::error::`, ex);
    } finally {
      this.isSubscribeButtonLoading = false;
    }
  }

  private async handleSubscribeFeatures(productIds: string[]) {
    try {
      this.isSubscribeButtonLoading = true;
      this.subscription = await this.billingService.subscribeProducts(this.licenseKey, productIds);
      this.resetProductStatus();
      this.renderSubscribedProduct(productIds);
      const approvalLink = this.subscription?.paymentInfo?.approvalLink;
      if (approvalLink) this.redirectToPaymentLink(approvalLink);
    } catch (e) {
      const ex = DIException.fromObject(e);
      PopupUtils.showError(ex.getPrettyMessage());
      Log.error('PremiumFeatures::handleSubscribeFeatures::error::', ex.message);
    } finally {
      this.isSubscribeButtonLoading = false;
    }
  }

  private resetProductStatus() {
    this.allFeatures.forEach(product => {
      product.isSelected = false;
      product.isSubscribed = false;
    });
  }

  private redirectToPaymentLink(approvalLink: string) {
    window.open(approvalLink, '_blank');
  }

  private async handleCancelSubscription(subscription: SubscriptionInfo) {
    try {
      this.cancelSubscriptionLoading = true;
      await this.billingService.cancelSubscription(subscription.licenseKey);
      await this.handleLoadSubscriptionInfo(false);
    } catch (e) {
      const ex = DIException.fromObject(e);
      Log.error(`PremiumFeatures::handleCancelSubscription::error::`, e);
      PopupUtils.showError(ex.getPrettyMessage());
    } finally {
      this.cancelSubscriptionLoading = false;
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.premium-features {
  background: var(--secondary);
  height: calc(100% - 53px);
  border-radius: 4px;
  padding: 16px 24px 78px;

  display: flex;
  flex-direction: column;

  position: relative;

  &-header {
    margin-bottom: 8px;

    .premium-features-title {
      @include regular-text(0.6, var(--text-color));
      line-height: 19px;
      text-align: left;
    }
  }

  &-body {
    height: calc(100% - 38px) !important;

    &-subscription {
      color: var(--white);
      margin-bottom: 24px;
      height: 192px;

      display: flex;
      flex-direction: column;
      text-align: left;

      &-status {
        background: linear-gradient(135deg, #597fff, #1944a0);
        border-radius: 12px;
        padding: 16px;
        height: 192px;
      }

      &-plan {
        font-size: 24px;
        line-height: 28px;
        font-weight: 500;
        margin-bottom: 9px;
      }

      &-plan-subtitle {
        font-size: 14px;
        line-height: 16px;
        opacity: 0.5;
        margin-bottom: 16px;
      }

      &-details {
        border: 1px solid #ffffff32;
        display: flex;
        align-items: flex-end;

        &-last-invoice,
        &-status,
        &-email,
        &-payment-method {
          padding: 16px 16px 23px;
          .title {
            font-size: 14px;
            line-height: 16px;
            margin-bottom: 10px;
          }

          .data {
            font-size: 24px;
            line-height: 28px;
            font-weight: 500;
          }
        }
        &-payment-method,
        &-status,
        &-email {
          border-left: 1px solid #ffffff32;
          height: 93px;
        }

        &-last-invoice {
          flex: 3;
        }

        &-email {
          flex: 4;
          width: max-content;
        }

        &-status {
          flex: 4;
        }

        &-payment-method {
          align-self: flex-end;
          flex: 3;
        }
      }
    }

    &-features {
      height: calc(100% - 192px - 24px) !important;

      &-status {
        height: calc(100% - 46px) !important;
        > div {
          height: 100%;
        }
      }
      &-title {
        margin-bottom: 16px;
        text-align: left;

        .title {
          line-height: 19px;
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .subtitle {
          line-height: 19px;
          font-size: 16px;
        }
      }
      &-scroll {
        max-height: calc(100% - 16px);

        .premium-feature + .premium-feature {
          margin-top: 12px;
        }
      }
    }
  }

  &-footer {
    position: absolute;
    height: 78px;
    z-index: 2;
    background: var(--white);
    bottom: 0;
    width: calc(100% - 48px);

    &-actions {
      .di-button {
        width: 200px;
        height: 42px;
      }
    }
  }
}
</style>
