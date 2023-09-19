<template>
  <div class="modify-plan">
    <Modal ref="modal" size="xl" hide-footer header-class="modify-plan-header">
      <template #header>
        <span class="modal-header-title">
          A plan for every product
          <!--          <a href="#">View details plan</a>-->
        </span>
      </template>
      <div class="plan-type-item-container">
        <PlanTypeItem
          v-for="planType in planTypes"
          @contactUs="contactUs"
          @buyNow="buyNow"
          :planType="planType"
          :key="planType"
          :active="isActivePlan(planType)"
        ></PlanTypeItem>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import Modal from '@/shared/components/common/Modal.vue';
import PlanTypeItem from '@/screens/organization-settings/components/PlanTypeItem.vue';
import { PlanType } from '@core/organization/domain/Plan/PlanType';

@Component({
  components: { Modal, PlanTypeItem }
})
export default class ModifyPlan extends Vue {
  private selectedPlanType: PlanType | null = null;
  private planTypes: PlanType[] = [PlanType.Startup, PlanType.Business, PlanType.Cooperate, PlanType.OnPremise];

  @Ref()
  private modal?: typeof Modal;

  show(currentPlanType?: PlanType) {
    this.selectedPlanType = currentPlanType ?? null;
    // @ts-ignore
    this.modal?.show();
  }

  hide() {
    // @ts-ignore
    this.modal?.hide();
  }

  private isActivePlan(planType: PlanType) {
    return this.selectedPlanType === planType;
  }

  private contactUs(planType: PlanType) {
    // this.$refs.modal.hide();
    this.$emit('contactUs', planType);
  }

  private buyNow(planType: PlanType) {
    // this.$refs.modal.hide();
    this.$emit('buyNow', planType);
  }
}
</script>
<style lang="scss">
.modify-plan-header {
  padding: 24px 24px 0 !important;
}
.modify-plan {
  .modal-header-title {
    font-size: 24px;
    font-weight: normal;

    a {
      font-size: 16px;
      font-weight: 600;
      margin-left: 20px;
    }
  }
  .plan-type-item-container {
    display: flex;
    flex-wrap: wrap;
    text-align: left;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
}
</style>
