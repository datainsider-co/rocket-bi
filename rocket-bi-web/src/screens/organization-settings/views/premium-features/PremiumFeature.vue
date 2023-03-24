<template>
  <div class="premium-feature position-relative">
    <StatusWidget :status="status">
      <div class="d-flex align-items-center">
        <div class="text-left text-truncate">
          <div class="d-flex align-items-center">
            <img v-if="isSubscribed" class="premium-feature-icon" src="@/assets/icon/ic_activate.svg" alt="subscribed" />
            <img v-else-if="isBillingApproval" class="premium-feature-icon" src="@/assets/icon/ic_rotate.svg" alt="waiting payment" />
            <img v-else class="premium-feature-icon" src="@/assets/icon/ic_inactivate.svg" alt="unsubscribed" />
            <div class="premium-feature-name text-truncate">{{ feature.name }}</div>
          </div>
          <div class="premium-feature-description">
            <div class="premium-feature-description-text text-truncate">{{ feature.description }}</div>
            <div v-if="productSubscriptionInfo && !productSubscriptionInfo.payment.isUnknownStatus" class="premium-feature-description-status text-truncate">
              <div class="premium-feature-description-status-title">Status:</div>
              <div class="premium-feature-description-status-value">
                <div v-if="isSubscribed" style="color: var(--success)">Active</div>
                <div v-if="isBillingApproval" style="color: var(--warning)">Waiting Payment</div>
                <div v-if="isCanceled" style="color: var(--disable-opacity)">Unsubscribed</div>
              </div>
              <div class="premium-feature-description-status-divider">|</div>
              <div class="premium-feature-description-status-title">Start date:</div>
              <div class="premium-feature-description-status-date">{{ formatDate(productSubscriptionInfo.subscription.startTime) }}</div>
              <div class="premium-feature-description-status-divider">|</div>
              <div class="premium-feature-description-status-title">End date:</div>
              <div class="premium-feature-description-status-date">{{ formatDate(productSubscriptionInfo.subscription.endTime) }}</div>
            </div>
            <div v-if="isSubscribed && feature.id === '2'" class="premium-feature-description-contact-us">
              <div class="d-flex align-items-center">
                <div class="premium-feature-description-status-title">Token:</div>
                <div class="mr-2">{{ licenseKey }}</div>
                <CopyButton id="license-key" :text="licenseKey">
                  <template #default="{copy}">
                    <i class="di-icon-copy btn-icon-border p-1" @click="copy(licenseKey)"></i>
                  </template>
                </CopyButton>
              </div>
              <div style="font-weight: 400">This is your support token . Please include this token in your support request via Email/ Chat/ GitHub report.</div>
            </div>
          </div>
        </div>
        <div class="premium-feature-price">
          <div>{{ feature.price }}$/month |</div>
          <template v-if="productSubscriptionInfo">
            <DiButton v-if="isSubscribed" class="mr-2" title="Unsubscribe" @click="showCancelSubscriptionConfirm(productSubscriptionInfo)"></DiButton>
            <DiButton v-else-if="isCanceled" class="mr-2" title="Subscribe" @click="handleSubscribe(feature)"></DiButton>
            <DiButton
              v-else-if="isBillingApproval"
              class="mr-2"
              title="Proceed payment"
              @click="redirectToApprovalLink(productSubscriptionInfo.payment.approvalLink)"
            ></DiButton>
          </template>
          <template v-else>
            <DiButton v-if="!productSubscriptionInfo" class="mr-2" title="Subscribe" @click="handleSubscribe(feature)"></DiButton>
          </template>
        </div>
      </div>
    </StatusWidget>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { BillingService, ProductInfo, ProductSubscriptionInfo } from '@core/billing';
import MultiChoiceItem from '@/shared/components/filters/MultiChoiceItem.vue';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import { DateTimeFormatter, Modals, PopupUtils } from '@/utils';
import { Inject } from 'typescript-ioc';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Status } from '@/shared';
import CopyButton from '@/shared/components/common/di-share-modal/components/CopyButton.vue';

@Component({
  components: { CopyButton, StatusWidget, MultiChoiceItem }
})
export default class PremiumFeature extends Vue {
  private status: Status = Status.Loaded;
  private refreshInterval = 0;

  @Inject
  private billingService!: BillingService;

  @Prop()
  private feature!: ProductInfo;

  @Prop()
  private productSubscriptionInfo!: ProductSubscriptionInfo | null;

  private formatDate(timestamp: number): string {
    return DateTimeFormatter.formatAsDDMMYYYY(timestamp);
  }

  private get contactUsUrl() {
    return 'https://docs.google.com/forms/d/1R0DXAB8Ot0gcaXB5ZrH7SR7ee3lOLZCwMNOnsGPK9bA/edit';
  }

  private get isSubscribed() {
    return this.productSubscriptionInfo?.payment.isSubscribed ?? false;
  }

  private get isBillingApproval() {
    return this.productSubscriptionInfo?.payment.isBillingApprovalStatus ?? false;
  }

  private get isCanceled() {
    return this.productSubscriptionInfo?.payment.isCanceled ?? false;
  }

  private get licenseKey() {
    return Di.get(DataManager).getUserInfo()?.organization.licenceKey ?? '';
  }

  private showCancelSubscriptionConfirm(productSubscriptionInfo: ProductSubscriptionInfo) {
    Modals.showConfirmationModal(`Are you sure that you want to unsubscribe ${this.feature.name} subscription`, {
      onOk: () => this.handleCancelSubscription(productSubscriptionInfo)
    });
  }

  private showUpdating() {
    this.status = Status.Updating;
  }

  private showLoaded() {
    this.status = Status.Loaded;
  }

  private async handleCancelSubscription(productSubscriptionInfo: ProductSubscriptionInfo) {
    try {
      Log.debug('PremiumFeature::handleCancelSubscription::productSubscriptionInfo::', productSubscriptionInfo);
      this.showUpdating();
      const newSubscription = await this.billingService.cancelSubscription(
        productSubscriptionInfo.subscription.licenseKey,
        productSubscriptionInfo.subscription.productId
      );
      Log.debug('PremiumFeature::handleCancelSubscription::newSubscription::', newSubscription);

      this.$emit('updateSubscription', newSubscription);
    } catch (e) {
      const ex = DIException.fromObject(e);
      Log.error(`PremiumFeatures::cancelFeature::error::`, e);
      PopupUtils.showError(ex.getPrettyMessage());
    } finally {
      this.showLoaded();
    }
  }

  private async handleSubscribe(feature: ProductInfo) {
    try {
      this.showUpdating();
      const newSubscription: ProductSubscriptionInfo = await this.billingService.subscribeProducts(this.licenseKey, feature.id);
      Log.debug('PremiumFeature::handleSubscribe::newSubscription::', newSubscription);
      this.redirectToApprovalLink(newSubscription.payment.approvalLink ?? '');
      this.$emit('updateSubscription', newSubscription);
    } catch (e) {
      const ex = DIException.fromObject(e);
      Log.error(`PremiumFeatures::handleSubscribe::error::`, e);
      PopupUtils.showError(ex.getPrettyMessage());
    } finally {
      this.showLoaded();
    }
  }

  @Watch('productSubscriptionInfo', { immediate: true })
  private autoRefresh(productSubscriptionInfo: ProductSubscriptionInfo | null) {
    Log.debug('PremiumFeatures::autoRefresh::productSubscriptionInfo::', productSubscriptionInfo);
    if (productSubscriptionInfo) {
      if (productSubscriptionInfo?.payment.isBillingApprovalStatus) {
        this.refreshInterval = setInterval(async () => {
          const subscription = await this.billingService.getSubscriptionInfo(this.licenseKey, this.feature.id);
          if (
            this.productSubscriptionInfo?.payment.status !== subscription.payment.status &&
            !subscription.payment.isBillingApprovalStatus &&
            !subscription.payment.isUnknownStatus
          ) {
            Log.debug('PremiumFeatures::autoRefresh::clearInterval');
            this.$emit('updateSubscription', subscription);
            clearInterval(this.refreshInterval);
          }
        }, 5000);
      }
    }
  }

  private redirectToApprovalLink(link: string) {
    window.open(link, '_blank');
  }

  beforeDestroy() {
    clearInterval(this.refreshInterval);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.premium-feature {
  display: flex;
  align-items: center;

  background: rgba(250, 250, 251, 1);
  border-radius: 12px;
  padding: 16px 0 16px 16px;

  &-icon {
    margin-right: 12px;
  }

  &-name {
    @include regular-text();
    line-height: 28.13px;
    font-size: 24px;
    font-weight: 500;
  }

  &-description {
    margin-top: 4px;
    margin-left: 36px;

    &-contact-us {
      margin-top: 4px;
      @include regular-text();
      font-size: 16px;
      font-weight: 500;
      line-height: 19px;

      a:hover {
        text-decoration: none;
      }
    }

    &-text {
      @include regular-text();
      line-height: 19px;
      font-size: 16px;
    }

    &-status {
      display: flex;
      align-items: center;
      margin-top: 4px;

      &-title {
        @include regular-text();
        font-size: 16px;
        font-weight: 700;
        margin-right: 8px;
        line-height: 19px;
      }

      &-value,
      &-date {
        @include regular-text();
        line-height: 19px;
        font-size: 16px;
        font-weight: 500;
      }

      &-divider {
        margin-left: 8px;
        margin-right: 8px;
        @include regular-text();
        line-height: 19px;
        font-size: 16px;
        font-weight: 500;
      }
    }
  }

  &-price {
    margin-left: auto;
    @include regular-text();
    line-height: 19px;
    font-size: 16px;
    font-weight: 500;

    display: flex;
    align-items: center;

    .di-button {
      color: var(--accent) !important;
    }
  }
}
</style>
