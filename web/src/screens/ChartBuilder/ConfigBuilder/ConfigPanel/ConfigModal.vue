<template>
  <modal v-if="node" id="configModal" :centered="false" :show-close="true" :show.sync="isModalOpen" class="modal-config">
    <span slot="header">
      Config
      <span class="header-title">Data</span>
    </span>
    <span>
      Source
      <span class="source-title">{{ node.parent.title + '.' }}</span>
      <span class="font-weight-bold">{{ node.title }}</span>
    </span>
    <div>
      <span class="input-title">COLUMN DISPLAY NAME</span>
    </div>
    <input id="inlineFormInputGroup" v-model="node.displayName" class="form-control" type="text" @keydown.enter="saveConfig(node)" />
    <div v-if="$v.node.displayName.$error" class="error pl-1">
      <span v-if="!$v.node.displayName.required">Field is required.</span>
    </div>
    <div>
      <span class="input-title">FUNCTIONS</span>
    </div>
    <DiDropdown
      :id="genDropdownId('function')"
      v-model="node.functionFamily"
      :data="functions"
      boundary="viewport"
      @change="handleFunctionFamilyChanged(node, ...arguments)"
    />
    <DiDropdown v-if="subFunctions" :id="genDropdownId('sub-function')" v-model="node.functionType" :data="subFunctions" boundary="viewport" />
    <template v-if="enableSorting">
      <div>
        <span class="input-title">SORTING</span>
      </div>
      <DiDropdown :id="genDropdownId('sorting')" v-model="node.sorting" :data="sorts" boundary="viewport" />
      <div class="d-flex align-items-center btn-ghost p-2" @click.prevent="toggleTopElement">
        <div class="input-title my-0 pl-0 mr-auto text-uppercase">Display top N elements</div>
        <div class="custom-control custom-control-right custom-switch my-0">
          <input id="top-element" v-model="node.isShowNElements" class="custom-control-input" type="checkbox" />
          <label class="custom-control-label" for="top-element"> </label>
        </div>
      </div>
      <div v-if="$v.node.numElemsShown.$error" class="error pl-1">
        <span v-if="!$v.node.numElemsShown.minValue">Field must be positive.</span>
      </div>
      <input
        id="nElement"
        v-model="node.numElemsShown"
        :disabled="!node.isShowNElements"
        autocomplete="off"
        class="form-control"
        placeholder="N element shown"
        type="text"
        @keydown.enter="saveConfig(node)"
      />
    </template>
    <div v-if="enableDisplayAsAColumn" class="d-flex align-items-center btn-ghost p-2" @click.prevent="toggleDisplayAsColumn">
      <div class="input-title my-0 pl-0 mr-auto text-uppercase">Display as a column</div>
      <div class="custom-control custom-control-right custom-switch my-0">
        <input id="switch-markdown" v-model="displayAsColumn" class="custom-control-input" type="checkbox" />
        <label class="custom-control-label" for="switch-markdown"> </label>
      </div>
    </div>
    <template v-slot:footer>
      <button class="btn-ghost" @click="closeModal">Cancel</button>
      <button class="btn-primary" @click="saveConfig(node)">Save</button>
    </template>
  </modal>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import { minValue, required } from 'vuelidate/lib/validators';
import Modal from '@/shared/components/builder/Modal.vue';
import { FunctionNode, FunctionTreeNode, LabelNode } from '@/shared/interfaces';
import { ChartUtils } from '@/utils';
import { ConfigType, DataBuilderConstants } from '@/shared/constants';
import { FunctionFamilyTypes } from '@/shared';
import { Log } from '@core/utils';
import { DataType } from '@core/schema/service/FieldFilter';

@Component({
  components: {
    Modal
  },
  validations: {
    node: {
      displayName: { required },
      numElemsShown: { minValue: minValue(1) }
    }
  }
})
export default class ConfigModal extends Vue {
  private readonly sorts: LabelNode[] = DataBuilderConstants.SORTS_NODES;

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

  private get enableSorting(): boolean {
    return this.configType == ConfigType.sorting || this.node.functionFamily == FunctionFamilyTypes.aggregation;
  }

  private get displayAsColumn() {
    return this.node?.displayAsColumn || false;
  }

  private set displayAsColumn(newValue: boolean) {
    if (this.node) {
      this.node.displayAsColumn = newValue;
    }
  }

  private get isDisplayColumn() {
    return ChartUtils.isDisplayColumn(this.node?.functionFamily);
  }

  private get enableDisplayAsAColumn(): boolean {
    return false;
    // return this.isDisplayColumn && this.configType != ConfigType.sorting;
  }

  private handleFunctionFamilyChanged(currentNode: FunctionTreeNode, newFamily: string) {
    currentNode.functionType = ChartUtils.getDefaultFnType(newFamily);
  }

  private toggleDisplayAsColumn() {
    this.displayAsColumn = !this.displayAsColumn;
  }

  private toggleTopElement() {
    this.node.isShowNElements = !this.node.isShowNElements;
  }

  private saveConfig(data: FunctionTreeNode) {
    this.$v.$touch();
    if (!this.$v.$error) {
      this.$emit('onSaveConfig', data);
      this.$v.$reset();
    }
  }

  private closeModal() {
    this.isModalOpen = false;
  }
}
</script>
