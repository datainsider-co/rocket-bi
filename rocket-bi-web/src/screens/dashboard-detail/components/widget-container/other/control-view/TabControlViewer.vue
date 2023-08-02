<template>
  <vuescroll>
    <div :class="containerClass">
      <div :class="infoClass" style="width: max-content">
        <div v-if="enableTitle" class="filter-chart single-line" :style="titleStyle">
          {{ widget.getTitle() }}
        </div>
        <img class="ml-1" v-if="enableSubTitle" :src="require('@/assets/icon/ic_help.svg')" alt="subtitle" :title="widget.getSubtitle()" />
      </div>
      <TabSelection
        :selectOptions="selectOptions"
        :id="tabControlId"
        :class="filterClass"
        :displayAs="displayAs"
        :direction="direction"
        :appendAtRoot="true"
        style="overflow: unset"
        :selected="Array.from(this.selected.values())"
        @selected="handleFilterChanged"
      />
    </div>
  </vuescroll>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import TabSelection from '@/shared/components/TabSelection.vue';
import { DynamicFunctionWidget, TableColumn } from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import { Direction, SelectOption, TabFilterDisplay } from '@/shared';
import { ListUtils } from '@/utils';
import { cloneDeep, isEqual, isString, toNumber } from 'lodash';
import { DashboardControllerModule } from '@/screens/dashboard-detail/stores';
import { Log } from '@core/utils';
import { IdGenerator } from '@/utils/IdGenerator';

@Component({ components: { TabSelection } })
export default class TabControlViewer extends Vue {
  @Prop({ required: true })
  private readonly widget!: DynamicFunctionWidget;

  @Prop({ required: false, default: false })
  private readonly showEditComponent!: boolean;
  private selected: Set<any> = this.getSelected();

  private get enableTitle(): boolean {
    return this.widget.options?.title?.enabled ?? false;
  }

  private get enableSubTitle(): boolean {
    return (this.widget.options?.subtitle?.enabled ?? false) && StringUtils.isNotEmpty(this.widget.getSubtitle());
  }

  private get direction(): Direction {
    return this.widget.options?.direction ?? Direction.row;
  }

  get displayAs(): TabFilterDisplay {
    return this.widget.options.displayAs ?? TabFilterDisplay.normal;
  }

  private get infoClass(): string {
    switch (this.direction) {
      case Direction.row:
        return 'd-flex row align-items-center mr-1 pl-3';
      case Direction.column:
        return 'd-flex row align-items-center w-100 pl-3';
      default:
        return '';
    }
  }

  private get containerClass(): string {
    return `tab-filter-container ${this.directionClass} mt-2`;
  }

  private get directionClass(): string {
    switch (this.direction) {
      case Direction.row:
        return 'flex-row tab-display-row';
      case Direction.column:
        return 'flex-column h-100 overflow-auto';
      default:
        return '';
    }
  }

  get titleStyle() {
    return this.widget.options.title.style;
  }

  get filterClass(): string {
    const margin = this.direction === Direction.column ? 'mt-3' : '';
    return this.showEditComponent ? `disable ml-1 ${margin}` : `ml-1 ${margin}`;
  }

  get selectOptionAsMap(): Map<string, SelectOption> {
    return new Map(
      this.widget.values.map((value, index) => {
        const id = this.buildId(value, index);
        return [
          id,
          {
            displayName: value.name,
            id: id
          }
        ];
      })
    );
  }

  get selectOptions(): SelectOption[] {
    return Array.from(this.selectOptionAsMap.values());
  }

  private getSelected(): Set<string> {
    const isUsingSetting = this.widget.options.default?.dynamicFunction?.values != null;
    const valuesInSetting = (this.widget.options.default?.dynamicFunction?.values as Array<number>).map(index =>
      this.buildId(this.widget.values[index], index)
    );
    const valuesDefault = ListUtils.isNotEmpty(this.widget.values) ? [this.buildId(this.widget.values[0]!, 0)] : [];
    return new Set<string>(isUsingSetting ? valuesInSetting : valuesDefault);
  }

  private buildId(colum: TableColumn, index: number): string {
    return `${colum.normalizeName}_${index}`;
  }

  private getIndex(key: string): number {
    return toNumber(ListUtils.getLast(key.split('_')));
  }

  handleFilterChanged(option: string | SelectOption) {
    const oldIndexes = cloneDeep(this.selected);
    this.updateSelected(option);
    if (!isEqual(oldIndexes, this.selected)) {
      const indexes = Array.from(this.selected).map(value => this.getIndex(value));
      const tblColumnSelected = indexes.map(index => this.widget.values[index]);
      DashboardControllerModule.replaceDynamicFunction({ widget: this.widget, selected: tblColumnSelected, apply: true });
    }
  }

  private updateSelected(option: string | SelectOption) {
    const isMultiChoice = this.displayAs === TabFilterDisplay.multiChoice;
    const id = isString(option) ? option : `${(option as SelectOption).id}`;
    isMultiChoice ? this.handleMultiChoiceSelect(id) : this.handleSingleChoiceSelect(id);
    ///Reactive
    this.selected = new Set(this.selected);
    Log.debug('updateSelected::', this.selected);
  }

  private handleMultiChoiceSelect(id: string) {
    const isSelected = this.selected.has(id);
    if (isSelected) {
      if (this.selected.size !== 1) {
        this.selected.delete(id);
      }
    } else {
      this.selected.add(id);
    }
  }

  private handleSingleChoiceSelect(id: string) {
    this.selected.clear();
    this.selected.add(id);
  }

  private get tabControlId(): string {
    return IdGenerator.generateKey(['dynamic-function', `${this.widget.id}`]);
  }
}
</script>

<style lang="scss" scoped></style>
