<template>
  <modal v-if="editingNode" :show.sync="isOpenModalSynced" class="modal-config" id="configModal" :centered="false" :show-close="true">
    <span slot="header">
      Config filter
      <span class="header-title">
        {{ editingNode.parent.title + '.' + editingNode.title }}
      </span>
    </span>
    <!--    <div><span class="input-title">FILTER TYPE</span></div>-->
    <!--    <swm-select :data="filterTypes" v-model="editingNode.filterFamily" @change="handleFilterFamilyChanged(editingNode, ...arguments)" boundary="viewport" />-->
    <div v-if="conditions"><span class="input-title">CONDITION</span></div>
    <DiDropdown :id="genDropdownId('conditions')" :data="conditions" v-model="editingNode.filterType" boundary="viewport" />
    <div v-if="canShowFirstInput(editingNode.filterType)">
      <div>
        <span class="input-title">{{ getFirstNameInput }}</span>
      </div>
      <input
        type="text"
        class="form-control"
        id="firstInput"
        placeholder="Type value"
        v-model="editingNode.firstValue"
        autocomplete="off"
        v-on:keydown.enter="save"
      />
      <div class="error pl-1" v-if="$v.editingNode.firstValue.$error">
        <span v-if="!$v.editingNode.firstValue.required">Field is required.</span>
      </div>
    </div>
    <div v-if="canShowSecondInput(editingNode.filterType)">
      <div>
        <span class="input-title">{{ getSecondNameInput }}</span>
      </div>
      <input
        type="text"
        class="form-control"
        id="secondInput"
        placeholder="Type value"
        v-model="editingNode.secondValue"
        autocomplete="off"
        v-on:keydown.enter="save"
      />
      <div class="error pl-1" v-if="$v.editingNode.secondValue.$error">
        <span v-if="!$v.editingNode.secondValue.required">Field is required.</span>
      </div>
    </div>
    <template v-slot:footer>
      <button
        class="btn-ghost"
        @click="
          $v.$reset();
          $emit('close');
        "
      >
        Cancel
      </button>
      <button class="btn-primary" @click="save">Save</button>
    </template>
  </modal>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import { DataBuilderConstants, DateHistogramConditionTypes, StringConditionTypes, ConditionTreeNode } from '@/shared';
import { ChartUtils } from '@/utils';
import { isArray } from 'highcharts';
import Modal from '@/shared/components/builder/Modal.vue';
import { required } from 'vuelidate/lib/validators';

@Component({
  components: {
    Modal
  },
  validations: {
    editingNode: {
      firstValue: { required },
      secondValue: { required }
    }
  }
})
export default class FilterModal extends Vue {
  @Prop({ required: true })
  editingNode!: ConditionTreeNode;

  @PropSync('isOpenModal', { required: true, type: Boolean, default: false })
  isOpenModalSynced!: boolean;

  private readonly filterTypes = DataBuilderConstants.FILTER_NODES;
  private readonly listHaveSecondInputs: Set<string> = new Set<string>([
    DateHistogramConditionTypes.betweenNAndMMinutesBeforeNow,
    DateHistogramConditionTypes.betweenNAndMHoursBeforeNow,
    DateHistogramConditionTypes.betweenNAndMDaysBeforeNow,
    DateHistogramConditionTypes.betweenNAndMWeeksBeforeNow,
    DateHistogramConditionTypes.betweenNAndMMonthsBeforeNow,
    DateHistogramConditionTypes.betweenNAndMYearsBeforeNow,
    DateHistogramConditionTypes.between,
    DateHistogramConditionTypes.betweenAndIncluding
  ]);

  private readonly conditionPassCheckInputValue: Set<string> = new Set<string>([
    StringConditionTypes.isnull,
    StringConditionTypes.notNull,
    DateHistogramConditionTypes.currentDay,
    DateHistogramConditionTypes.currentMonth,
    DateHistogramConditionTypes.currentQuarter,
    DateHistogramConditionTypes.currentWeek,
    DateHistogramConditionTypes.currentYear
  ]);

  handleFilterFamilyChanged(currentNode: ConditionTreeNode, currentFilterFamily: string) {
    currentNode.filterType = ChartUtils.getFilterType(currentFilterFamily);
  }

  get conditions() {
    const conditions = this.editingNode?.filterFamily
      ? this.filterTypes.find(filterType => filterType.label === this.editingNode?.filterFamily)?.conditions
      : null;
    return conditions && isArray(conditions) ? conditions : null;
  }

  private canShowSecondInput(currentFilterType: string): boolean {
    return !!currentFilterType && this.listHaveSecondInputs.has(currentFilterType);
  }

  private canShowFirstInput(currentFilterFamily: string): boolean {
    return !this.conditionPassCheckInputValue.has(currentFilterFamily);
  }

  private save() {
    this.$v.$touch();
    const haveTwoValue = this.canShowSecondInput(this.editingNode.filterType);
    const showFirstInput = this.canShowFirstInput(this.editingNode.filterType);

    if (showFirstInput) {
      if (haveTwoValue) {
        if (!this.$v.$invalid) {
          this.submitData();
        }
      } else {
        if (!this.$v.editingNode.firstValue?.$error) {
          this.submitData();
        }
      }
    } else {
      this.submitData();
    }
  }

  private submitData() {
    this.$emit('ok', this.editingNode);
    this.$v.$reset();
  }

  private get getFirstNameInput(): string {
    if (this.canShowSecondInput(this.editingNode.filterType)) {
      return 'Min';
    } else {
      return 'Value';
    }
  }

  private get getSecondNameInput(): string {
    if (this.canShowSecondInput(this.editingNode.filterType)) {
      return 'Max';
    } else {
      return '';
    }
  }
}
</script>
