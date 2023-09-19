<template>
  <div :class="tabContainerClass" class="tab-selection-container">
    <template v-if="toComponent && !isDropdown">
      <component
        :is="toComponent"
        v-for="(item, index) in selectOptions"
        :key="index"
        :class="`${directionClass} ${displayClass}`"
        :isSelected="isSelected(item)"
        :item="item"
        @onSelectItem="handleSelectItem"
      >
      </component>
    </template>
    <template v-else-if="isDropdown">
      <DiDropdown
        class="dropdown-item"
        :value="selected[0]"
        :append-at-root="true"
        :data="selectOptions"
        boundary="window"
        label-props="displayName"
        value-props="id"
        @selected="handleSelectItem"
      >
      </DiDropdown>
    </template>
    <template v-else>
      <div>Display filter is not displayed!</div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import NormalTabItem from '@/shared/components/filters/NormalTabItem.vue';
import { Direction, SelectOption, TabFilterDisplay } from '@/shared';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import MultiChoiceItem from '@/shared/components/filters/MultiChoiceItem.vue';
import { Log } from '@core/utils';

@Component({
  components: { NormalTabItem, SingleChoiceItem, MultiChoiceItem }
})
export default class TabSelection extends Vue {
  static readonly componentsWithDisplay: Map<TabFilterDisplay, string> = new Map<TabFilterDisplay, string>([
    [TabFilterDisplay.Normal, 'NormalTabItem'],
    [TabFilterDisplay.MultiChoice, 'MultiChoiceItem'],
    [TabFilterDisplay.SingleChoice, 'SingleChoiceItem']
  ]);
  static readonly OPTION_SHOW_ALL = {
    displayName: 'All',
    id: 'showAll'
  };

  @Prop({ type: String, default: 'tab-selection' })
  id!: string;

  @Prop({ type: Array, default: [], required: false })
  selectOptions!: SelectOption[];

  @Prop({ type: String, default: TabFilterDisplay.Normal })
  displayAs!: TabFilterDisplay;

  @Prop({ type: String, default: Direction.row })
  direction!: Direction;

  @Prop({ type: Array, default: [], required: false })
  selected!: any[];

  @Prop({ type: Boolean, default: true, required: false })
  allowScroll!: boolean;

  private get toComponent(): string | undefined {
    return TabSelection.componentsWithDisplay.get(this.displayAs);
  }

  private get isDropdown(): boolean {
    return this.displayAs == TabFilterDisplay.DropDown;
  }

  private get tabContainerClass(): string {
    switch (this.direction) {
      case Direction.row:
        return 'tab-selection-fit-content flex-row align-items-center horizontal-scroll';
      case Direction.column:
        return 'tab-selection flex-column align-items-start vertical-scroll';
      default:
        return '';
    }
  }

  private get directionClass(): string {
    switch (this.direction) {
      case Direction.row:
        return 'horizontal';
      case Direction.column:
        return 'vertical';
      default:
        return '';
    }
  }

  private get displayClass(): string {
    switch (this.displayAs) {
      case TabFilterDisplay.Normal:
        return '';
      case TabFilterDisplay.SingleChoice:
      case TabFilterDisplay.MultiChoice:
        return 'choice';
      case TabFilterDisplay.DropDown:
        return 'dropdown-item';
      default:
        return '';
    }
  }

  private isSelected(item: SelectOption): boolean {
    const { id } = item;
    return this.selected.includes(id);
  }

  private handleSelectItem(item: SelectOption): void {
    Log.debug('handleSelectItem', item);
    this.$emit('selected', item);
    this.$forceUpdate();
  }
}
</script>

<style lang="scss" scoped src="./TabSelection.scss"></style>
