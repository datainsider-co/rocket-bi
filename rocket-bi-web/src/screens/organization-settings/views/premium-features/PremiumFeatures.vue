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
      <div class="premium-features-content">
        <StatusWidget
          class="premium-features-body-features-status position-relative"
          :status="loadFeatureStatus"
          :error="loadFeaturesErrorMessage"
          @retry="handleLoadFeatures(true)"
        >
          <vuescroll ref="vuescroll" :ops="verticalScrollConfig">
            <div class="premium-features-body ">
              <div class="premium-features-body-subscription">
                <div class="premium-features-body-subscription-status" v-if="listSubscriptionInfo">
                  <div class="premium-features-body-subscription-plan">Free plan</div>
                  <div class="premium-features-body-subscription-plan-subtitle">
                    This plan gives you access to free product trials, tutorials, and more. When you’re ready to upgrade, choose the plan that fits your needs.
                  </div>
                  <div class="premium-features-body-subscription-details">
                    <div class="premium-features-body-subscription-details-last-invoice">
                      <div class="title">Last invoice total</div>
                      <div class="data">{{ lastInvoice }}$/month</div>
                    </div>
                    <!--                <div class="premium-features-body-subscription-details-email">-->
                    <!--                  <div class="title">Billing email</div>-->
                    <!--                  <div class="data">-->
                    <!--                    &lt;!&ndash;                    {{ subscriptions.email }}&ndash;&gt;-->
                    <!--                    test@gmail.com-->
                    <!--                  </div>-->
                    <!--                </div>-->
                    <div class="premium-features-body-subscription-details-status">
                      <div class="title">Payment status</div>
                      <div class="data">
                        {{ paymentStatus }}
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
              </div>

              <div class=" premium-features-body-features">
                <div class="premium-features-body-features-title">
                  <div class="title">ADD MORE PLAN</div>
                  <div class="subtitle">Select more features below to add to your plan if needed.</div>
                </div>
                <div class="premium-features-body-features-scroll">
                  <div>
                    <template v-for="product in allFeatures">
                      <PremiumFeature
                        :key="product.id"
                        :feature="product"
                        :product-subscription-info="productSubscriptionInfo(product.id)"
                        @updateSubscription="handleUpdateSubscription"
                        @removeSubscription="removeSubscription"
                      ></PremiumFeature>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </vuescroll>
        </StatusWidget>
      </div>
    </div>
  </LayoutContent>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { Status, VerticalScrollConfigs } from '@/shared';
import { DIException } from '@core/common/domain';
import { StringUtils, ListUtils } from '@/utils';
import { Log } from '@core/utils/Log';
import PremiumFeature from '@/screens/organization-settings/views/premium-features/PremiumFeature.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Inject } from 'typescript-ioc';
import { BillingService, PaymentStatus, ProductInfo, ProductSubscriptionInfo } from '@core/billing';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';
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
  private loadFeatureStatus: Status = Status.Loaded;
  private loadFeatureErrorMessage = '';
  private loadFeaturesErrorMessage = '';
  private allFeatures: ProductInfo[] = [];
  private listSubscriptionInfo: ProductSubscriptionInfo[] = [];

  @Inject
  private billingService!: BillingService;

  @Ref()
  private readonly vuescroll?: any;

  private productSubscriptionInfo(productId: string): ProductSubscriptionInfo | null {
    const subscription = this.listSubscriptionInfo.find(item => item.subscription.productId === productId);
    return subscription ? subscription : null;
  }

  private get paymentStatus(): string {
    if (ListUtils.isEmpty(this.listSubscriptionInfo)) {
      return 'Unsubscribed';
    }
    const billingApprovalProducts: ProductSubscriptionInfo[] = this.listSubscriptionInfo.filter(item => item.payment.status === PaymentStatus.BillingApproval);
    if (ListUtils.isNotEmpty(billingApprovalProducts)) {
      return `${billingApprovalProducts.length} Waiting Payment`;
    }
    return 'Subscribed';
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

  private showFeaturesError(ex: DIException) {
    this.loadFeatureStatus = Status.Error;
    this.loadFeaturesErrorMessage = ex.getPrettyMessage();
  }

  private get licenseKey() {
    return Di.get(DataManager).getUserInfo()?.organization.licenceKey ?? '';
  }

  private get lastInvoice(): number {
    let lastInvoice = 0;
    this.listSubscriptionInfo.forEach(subscriptionInfo => {
      if (subscriptionInfo.payment.isSubscribed || subscriptionInfo.payment.isCanceled) {
        lastInvoice += 9;
      }
    });
    return lastInvoice;
  }

  async mounted() {
    await this.handleLoadFeatures(true);
    // await this.handleLoadSubscriptionInfo();
  }

  private async loadSubscriptionInfos(): Promise<void> {
    this.listSubscriptionInfo = await this.billingService.getSubscriptionInfos(this.licenseKey);
  }

  private async refresh() {
    await this.handleLoadFeatures(false);
  }

  private async handleLoadFeatures(force = false) {
    try {
      force ? this.showFeatureLoading() : this.showFeatureUpdating();
      this.allFeatures = (await this.billingService.getProducts()).data;
      await this.loadSubscriptionInfos();
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

  private async handleUpdateSubscription(subscription: ProductSubscriptionInfo) {
    const foundSubscriptionIndex = this.listSubscriptionInfo.findIndex(item => item.subscription.productId === subscription.subscription.productId);
    if (foundSubscriptionIndex >= 0) {
      this.$set(this.listSubscriptionInfo, foundSubscriptionIndex, subscription);
    } else {
      this.listSubscriptionInfo.push(subscription);
    }
    if (subscription.payment.isSubscribed || subscription.payment.isCanceled) {
      await OrganizationPermissionModule.init();
    }
    this.$forceUpdate();
  }

  private removeSubscription(subscription: ProductSubscriptionInfo) {
    const foundSubscriptionIndex = this.listSubscriptionInfo.findIndex(item => item.subscription.productId === subscription.subscription.productId);
    if (foundSubscriptionIndex >= 0) {
      this.listSubscriptionInfo.splice(foundSubscriptionIndex, 1);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.premium-features {
  background: var(--secondary);
  height: calc(100% - 54px);
  border-radius: 4px;
  padding: 16px 14px 16px 24px;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  position: relative;

  &-content {
    height: calc(100% - 38px);
    overflow: hidden;
  }

  &-header {
    margin-bottom: 8px;
    position: sticky;
    top: 0;
    left: 0;
    margin-right: 10px;
    background: #fff;

    .premium-features-title {
      @include regular-text(0.6, var(--text-color));
      line-height: 19px;
      text-align: left;
    }
  }

  &-body {
    height: calc(100%) !important;
    margin-right: 10px;

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
        //height: calc(100% - 46px) !important;
        //> div {
        //  height: 100%;
        //}
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
