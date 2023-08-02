<template>
  <DiCustomModal hide-header-close ref="modal" @hidden="onHidden" size="md" @onClickOk="handleClickOk">
    <template #modal-header>
      <div class="config-modal-header">
        <div class="config-modal-header--title">Config <b>Data</b></div>
        <div class="config-modal-header--sub-title">
          Source
          <template v-if="isChartControl">
            <span :title="node.parent.title">from tab control&nbsp;</span>
            <span :title="node.title">
              <b>{{ node.title }}</b>
            </span>
          </template>
          <template v-else>
            <span :title="node.parent.title">{{ node.parent.title + '.' }}</span>
            <span :title="node.title">
              <b>{{ node.title }}</b>
            </span>
          </template>
        </div>
      </div>
    </template>
    <template #default>
      <DiInputComponent id="inlineFormInputGroup" label="Display name" v-model="node.displayName" @enter="saveConfig" placeholder="Column name...">
        <template #error>
          <div v-if="$v.node.displayName.$error" class="error">
            <span v-if="!$v.node.displayName.required">Field is required.</span>
          </div>
        </template>
      </DiInputComponent>
      <div class="config-modal-header--body--group" v-if="!isChartControl">
        <label>Functions</label>
        <DiDropdown
          :id="genDropdownId('function')"
          v-model="node.functionFamily"
          :data="functions"
          boundary="viewport"
          @change="handleFunctionFamilyChanged(node, ...arguments)"
        />
        <DiDropdown v-if="subFunctions" :id="genDropdownId('sub-function')" v-model="node.functionType" :data="subFunctions" boundary="viewport" />
      </div>
      <template v-if="enableSorting">
        <div class="config-modal-header--body--group">
          <label>Sorting</label>
          <DiDropdown :id="genDropdownId('sorting')" v-model="node.sorting" :data="sorts" boundary="viewport" />
          <template v-if="isShowTopN">
            <DiToggle class="w-100 mt-2 mb-1" :value.sync="node.isShowNElements" label="Display top N elements" label-at="left" is-fill></DiToggle>
            <DiInputComponent
              id="nElement"
              v-model="node.numElemsShown"
              :disabled="!node.isShowNElements"
              autocomplete="off"
              placeholder="N element shown"
              type="text"
              @enter="saveConfig"
            >
              <template #error>
                <div v-if="$v.node.numElemsShown.$error" class="error pl-1">
                  <span v-if="!$v.node.numElemsShown.minValue">Field must be positive.</span>
                  <span v-if="!$v.node.numElemsShown.mustBeRequired">Field is required.</span>
                </div>
              </template>
            </DiInputComponent>
          </template>
        </div>
      </template>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import { minValue, required } from 'vuelidate/lib/validators';
import Modal from '@/shared/components/builder/Modal.vue';
import { FunctionNode, FunctionTreeNode, LabelNode } from '@/shared/interfaces';
import { ChartUtils } from '@/utils';
import { ConfigType, DataBuilderConstants } from '@/shared/constants';
import { FunctionFamilyTypes, SortTypes } from '@/shared';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';
import { TabControlData } from '@core/common/domain';

@Component({
  components: {
    DiInputComponent,
    Modal
  },
  validations: {
    node: {
      displayName: { required },
      numElemsShown: {
        minValue: minValue(1),
        mustBeRequired: function(value: any) {
          // @ts-ignore
          if (this.node.isShowNElements && this.isShowTopN) {
            return !!value;
          } else {
            return true;
          }
        }
      }
    }
  }
})
export default class ConfigModal extends Vue {
  private readonly sorts: LabelNode[] = DataBuilderConstants.SortOptions;

  @Prop({ required: true })
  private node!: FunctionTreeNode;

  @Prop({ required: true })
  private subFunctions!: FunctionNode[];

  @Prop({ required: true, type: Array })
  private functions!: FunctionNode[];

  @PropSync('isOpen', { required: true })
  private isModalOpen!: boolean;

  @Prop({ required: true })
  private configType!: ConfigType;

  @Ref()
  private readonly modal!: DiCustomModal;

  private get isChartControl(): boolean {
    const dynamicFunction: TabControlData | undefined = ConfigDataUtils.getTabControlData(this.node);
    return !!dynamicFunction;
  }

  private get enableSorting(): boolean {
    return this.configType == ConfigType.sorting || this.node.functionFamily == FunctionFamilyTypes.aggregation;
  }

  private get isShowTopN(): boolean {
    return this.node.sorting !== SortTypes.Unsorted;
  }

  private handleFunctionFamilyChanged(currentNode: FunctionTreeNode, newFamily: string) {
    currentNode.functionType = ChartUtils.getDefaultFnType(newFamily);
  }

  private saveConfig() {
    this.$v.$reset();
    this.$v.$touch();
    if (!this.$v.$error) {
      this.$emit('onSaveConfig', this.node);
      this.$v.$reset();
    }
  }

  private handleClickOk(event: MouseEvent) {
    event.preventDefault();
    this.saveConfig();
  }

  private closeModal() {
    this.isModalOpen = false;
  }

  @Watch('isModalOpen')
  private onIsModalOpenChanged() {
    if (this.isModalOpen) {
      this.modal.show();
    } else {
      this.modal.hide();
    }
  }

  private onHidden() {
    this.isModalOpen = false;
  }
}
</script>

<style lang="scss">
.config-modal-header {
  display: flex;
  flex-direction: column;
  width: 100%;

  &--title {
    font-size: 16px;
    color: var(--text-color);
  }

  &--sub-title {
    font-size: 12px;
    color: var(--secondary-text-color);
    font-weight: normal;
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.config-modal-header--body--group {
  margin-top: 8px;
  > label {
    margin: 0;
  }
}
</style>
