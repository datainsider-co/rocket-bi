<template>
  <div class="right-panel">
    <div class="org-settings-content">
      <div class="org-settings-content-header">
        <div class="org-settings-content-header-title">
          <div>Plan Details</div>
        </div>
      </div>
      <div class="plan-detail">
        <div class="plan-detail-title">
          Professional
        </div>
        <div class="plan-detail-desc">
          Jul 1, 2021 - Jul 31, 2021
        </div>
        <div class="plan-detail-body">
          <div class="plan-detail-body-content">
            <div class="plan-detail-body-content-item">
              <label>Last invoice total</label>
              <div>$800/mo</div>
            </div>
            <div class="plan-detail-body-content-item">
              <label>Monthly editor seats</label>
              <div>30</div>
            </div>
            <div class="plan-detail-body-content-item">
              <label>Billing email</label>
              <div>abc@gmail.com</div>
            </div>
            <div class="plan-detail-body-content-item">
              <label>Payment method</label>
              <div>Paypal</div>
            </div>
          </div>
        </div>
        <img class="plan-detail-icon" src="@/assets/icon/airplane.svg" />
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
            <button class="btn btn-primary">Upgrade or Modify</button>
          </div>
        </div>
        <div class="org-overview-item">
          <div class="org-overview-item-label">Cancel Plan</div>
          <div class="org-overview-item-content">
            Submit a request to cancel your plan and switch to Professional
          </div>
          <div class="org-overview-item-action">
            <button class="btn btn-primary">Cancel</button>
          </div>
        </div>
      </div>
      <!--      <div class="org-settings-content-body">-->
      <!--        <div class="plan-detail">-->
      <!--          <div class="plan-detail-title">-->
      <!--            Professional-->
      <!--          </div>-->
      <!--          <div class="plan-detail-desc">-->
      <!--            Jul 1, 2021 - Jul 31, 2021-->
      <!--          </div>-->
      <!--          <div class="plan-detail-body">-->
      <!--            <div class="plan-detail-body-content">-->
      <!--              <div class="plan-detail-body-content-item">-->
      <!--                <label>Last invoice total</label>-->
      <!--                <div>$800/mo</div>-->
      <!--              </div>-->
      <!--              <div class="plan-detail-body-content-item">-->
      <!--                <label>Monthly editor seats</label>-->
      <!--                <div>30</div>-->
      <!--              </div>-->
      <!--              <div class="plan-detail-body-content-item">-->
      <!--                <label>Billing email</label>-->
      <!--                <div>abc@gmail.com</div>-->
      <!--              </div>-->
      <!--              <div class="plan-detail-body-content-item">-->
      <!--                <label>Payment method</label>-->
      <!--                <div>Paypal</div>-->
      <!--              </div>-->
      <!--            </div>-->
      <!--          </div>-->
      <!--          <img class="plan-detail-icon" src="@/assets/icon/airplane.svg" />-->
      <!--        </div>-->
      <!--        <div class="org-settings-content-header">-->
      <!--          <div class="org-settings-content-header-title">-->
      <!--            <div>Plan Details</div>-->
      <!--          </div>-->
      <!--        </div>-->
      <!--      </div>-->
    </div>
  </div>
</template>
<style lang="scss" scoped>
@import 'src/screens/OrganizationSettings/views/Overview/organization-overview.style';

.plan-detail {
  border-radius: 12px;
  padding: 24px;
  background-image: linear-gradient(118deg, #5950dc80, #2d27b680);
  text-align: left;
  position: relative;
  margin-bottom: 10px;

  &-title {
    font-size: 24px;
    font-weight: 600;
    line-height: 1;
    margin-bottom: 10px;
  }

  &-desc {
    color: var(--text-color-button);
    margin-bottom: 16px;
  }

  &-icon {
    position: absolute;
    right: 24px;
    top: 24px;
    width: 135px;
    height: 97px;
    object-fit: contain;
    object-position: right;
  }

  &-body {
    &-content {
      display: flex;
      flex-direction: row;

      &-item {
        padding: 16px;
        border: 1px solid var(--grid-line-color);
        border-left-width: 0;

        &:first-child {
          border-left-width: 1px;
        }

        label {
          line-height: 1;
          margin-bottom: 8px;
        }

        & > div {
          font-size: 24px;
          font-weight: 600;
        }
      }
    }
  }
}

.org-overview {
  &-item {
    &-label {
      width: 180px;
    }

    &-action {
      width: 190px;
      display: flex;

      .btn {
        width: 100%;
        font-weight: 600 !important;
      }
    }
  }
}
</style>
