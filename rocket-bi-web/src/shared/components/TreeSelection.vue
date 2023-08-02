<template>
  <Tree
    class="di-tree-view"
    :class="{ 'single-tree': isSingleChoice }"
    :checkable="!isSingleChoice"
    :multiple="!isSingleChoice"
    :show-icon="isSingleChoice"
    :tree-data="treeData"
    :selected-keys="selectedKeys"
    :expanded-keys="expandedKeys"
    @check="onCheck"
    @expand="onExpand"
    style="text-align: initial"
    @select="onSelect"
    :style="treeStyle"
  >
    <template #single-choice="{selected}">
      <div>
        <ActiveSingleChoiceIcon v-if="selected" color="var(--activeColor, #57F)" />
        <DeactivateSingleChoiceIcon v-else color="var(--deActiveColor, #9799AC)" />
      </div>
    </template>
  </Tree>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { Icon, Tree } from 'ant-design-vue';
import { Log } from '@core/utils';
import DeactivateSingleChoiceIcon from '@/shared/components/Icon/DeactivateSingleChoiceIcon.vue';
import ActiveSingleChoiceIcon from '@/shared/components/Icon/ActiveSingleChoiceIcon.vue';
import { StyleSetting, TextSetting } from '@core/common/domain';

@Component({
  components: { DeactivateSingleChoiceIcon, ActiveSingleChoiceIcon, Tree, Icon }
})
export default class TreeSelection extends Vue {
  @Prop({ type: String, default: 'tree-filter-selection' })
  id!: string;

  @Prop({ type: Array, default: () => [], required: false })
  private readonly treeData!: any[];

  @Prop({ required: false, type: Array, default: () => [] })
  private selectedKeys!: string[];

  @Prop({ required: false, type: Array, default: () => [] })
  private expandedKeys!: string[];

  @Prop({ required: false, type: Boolean, default: false })
  private isSingleChoice!: boolean;

  @Prop({ required: false })
  private options?: {
    deActiveColor?: string;
    borderColor?: string;
    activeColor?: string;
    textSetting?: StyleSetting;
    switchColor?: string;
  };

  private get treeStyle(): any {
    return {
      '--deActiveColor': this.options?.deActiveColor,
      '--borderColor': this.options?.borderColor,
      '--activeColor': this.options?.activeColor,
      '--switchColor': this.options?.switchColor,
      '--item-size': this.options?.textSetting?.fontSize,
      '--item-color': this.options?.textSetting?.color,
      '--item-font': this.options?.textSetting?.fontSize
    };
  }

  @Emit('check')
  onCheck(selectedKeys: string[]) {
    return selectedKeys;
  }

  onSelect(selectedKeys: string[], info: any) {
    this.$emit('select', selectedKeys, info.selected);
  }

  onExpand(expandedKeys: string[], info: any) {
    Log.debug('info::', info);
    this.$emit('expand', expandedKeys, info.expanded);
  }
}
</script>

<style lang="scss">
.di-tree-view {
  li ul {
    padding: 0 0 0 26px;
  }

  .ant-tree-switcher {
    color: var(--switchColor);
  }

  .ant-tree-title {
    color: var(--item-color);
    font: var(--item-font);
    font-size: var(--item-size);
  }

  li .ant-tree-node-content-wrapper {
    &:hover {
      background-color: unset;
    }
  }

  .ant-tree-checkbox-inner {
    background-color: transparent;
  }

  .ant-tree-switcher-icon {
    position: absolute;
    top: 25%;
    left: 10%;
  }

  .ant-tree-checkbox-indeterminate {
    .ant-tree-checkbox-inner:after {
      display: none;
    }
  }

  .ant-tree-node-selected {
    background-color: unset !important;
  }

  .ant-tree-checkbox:hover {
    border: unset !important;
  }

  .ant-tree-checkbox {
    &.ant-tree-checkbox-checked {
      .ant-tree-checkbox-inner {
        background-color: var(--activeColor);
        border: unset !important;
      }
    }

    .ant-tree-checkbox-inner {
      border: 1px solid var(--deActiveColor);

      &:hover {
        border: 1px solid var(--deActiveColor);
      }
    }
  }
}

.single-tree {
  .ant-tree-switcher-icon {
    left: 50%;
  }

  &.di-tree-view {
    li ul {
      padding: 0 0 0 20px;
    }
  }
}
</style>
