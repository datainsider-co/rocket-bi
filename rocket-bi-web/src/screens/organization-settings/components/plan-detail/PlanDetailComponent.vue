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
        <span v-if="planDetail.endDate"> - {{ endDate }} </span>
      </div>
      <div class="plan-detail-body">
        <div class="plan-detail-body-content">
          <div class="plan-detail-body-content-item">
            <label>Last invoice total</label>
            <div>${{ planDetail.lastPaymentAmount }}/mo</div>
          </div>
          <div class="plan-detail-body-content-item">
            <label>Monthly editor seats</label>
            <div>{{ planDetail.editorSeats }}</div>
          </div>
          <div style="min-width: 200px;max-width: 460px" class="plan-detail-body-content-item">
            <label>Billing email</label>
            <div class="text-truncate">{{ planDetail.invoiceEmail }}</div>
          </div>
          <div class="plan-detail-body-content-item">
            <label>Payment method</label>
            <div>{{ planDetail.lastPaymentMethod }}</div>
          </div>
          <div class="plan-detail-body-content-item">
            <label>Payment status</label>
            <div>{{ planDetail.lastPaymentStatus }}</div>
          </div>
        </div>
      </div>
      <img class="plan-detail-icon" :src="require(`@/assets/icon/${planDetail.icon}`)" alt="" />
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
        <div class="org-overview-item-label">Cancel Plan</div>
        <div class="org-overview-item-content">
          Submit a request to cancel your plan and switch to Professional
        </div>
        <div class="org-overview-item-action">
          <DiButton :disabled="!planDetail.isSucceeded" @click.prevent="cancel" title="Cancel" primary></DiButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PlanDetail } from '@core/organization';
import { DateTimeFormatter } from '@/utils';
import { PlanDisplayNames, PlanType } from '@core/organization/domain/Plan/PlanType';

@Component({})
export default class PlanDetailComponent extends Vue {
  @Prop({ required: true, type: PlanDetail })
  private planDetail?: PlanDetail;

  private get startDate() {
    return DateTimeFormatter.formatDateDisplay(new Date(this.planDetail?.startDate ?? 0));
  }

  private get displayName(): string {
    return PlanDisplayNames[this.planDetail?.planType ?? PlanType.NoPlan];
  }

  private get endDate() {
    return DateTimeFormatter.formatDateDisplay(new Date(this.planDetail?.endDate ?? 0));
  }

  private cancel() {
    this.$emit('cancelPlan');
  }

  private modify() {
    this.$emit('modifyPlan');
  }

  private get computedStyles() {
    return `--plan-bg-from: ${this.planDetail?.bgColors[0]}; --plan-bg-to: ${this.planDetail?.bgColors[1]}`;
  }
}
</script>
<style lang="scss" src="./PlanDetailComponent.scss"></style>
