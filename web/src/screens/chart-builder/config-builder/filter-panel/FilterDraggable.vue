<template>
  <div class="filter-draggable-area">
    <DropArea
      :key="draggableConfig.key"
      :is-optional="draggableConfig.isOptional"
      :isDragging="hasDragging"
      :disabled="disabled"
      :show-title="showTitle"
      :title="draggableConfig.title"
      @onDrop="dropToOrGroup"
    >
      <template #drop-area>
        <draggable
          :animation="100"
          :emptyInsertThreshold="100"
          :group="orGroupConfig"
          :value="[]"
          draggable=".filter-content-area .items"
          @add="handleClickNewGroup"
          @input="handleAddNewGroupFromOtherSection"
        >
          <div class="filter-content-area">
            <div v-for="(andGroup, groupIndex) in conditions" :key="groupIndex" class="filter-group">
              <div :class="{ 'over-and': hasDragging && !disabled }" class="items">
                <draggable
                  :animation="100"
                  :componentData="{ group: andGroup, groupIndex: groupIndex }"
                  :emptyInsertThreshold="100"
                  :group="andGroupConfig"
                  :value="[]"
                  @add="handleNewConditionFromFilterSection(andGroup, groupIndex, ...arguments)"
                  @change="handleChangeCondition(andGroup, groupIndex, ...arguments)"
                  @end="emitItemDragging(false)"
                  @start="emitItemDragging(true)"
                >
                  <DropItem
                    v-for="(node, nodeIndex) in andGroup"
                    :key="node.id"
                    :can-replace="false"
                    :index="nodeIndex"
                    :isItemDragging="isItemDragging"
                    @onInsert="handleInsertCondition(andGroup, true, ...arguments)"
                    @onReplace="handleReplaceCondition(andGroup, ...arguments)"
                  >
                    <template #default="{ opacity }">
                      <FilterItem
                        ref="filterItems"
                        :filterId="getFilterConfigId(node.groupId, node.id)"
                        :andGroup="andGroup"
                        :conditionTreeNode="node"
                        :group-index="groupIndex"
                        :node-index="nodeIndex"
                        :opacity="opacity"
                        :is-read-only="isReadOnly"
                        :showChartControlConfig="showChartControlConfig"
                        @onClickFilter="setupFilterValue"
                        @delete="handleDeleteFilter"
                        @onChangedFilter="updateConditionNode"
                        @onOpenMenu="handleOpenMenu"
                      >
                      </FilterItem>
                    </template>
                  </DropItem>
                </draggable>
                <CollapseTransition>
                  <Drop v-if="hasDragging" class="gap-or pb-2" @drop="handleDropAndGroup(andGroup, ...arguments)">
                    Add filter
                  </Drop>
                </CollapseTransition>
                <label class="drop-and-label">AND</label>
              </div>
              <div class="gap-or">Or</div>
            </div>
            <div v-if="hasDragging && !disabled" class="gap-or"></div>
          </div>
          <template #footer>
            <div v-if="canShowPlaceHolder" class="tutorial-drop">
              <div v-once class="unselectable">
                <img alt="drag" v-if="!isReadOnly" src="@/assets/icon/ic-drag.svg" />
                {{ draggableConfig.placeholder }} or
                <a href="#" style="cursor: pointer;" @click="handleClickTooltip" :id="clickHereId">click here</a>
              </div>
            </div>
          </template>
        </draggable>
        <SelectFieldContext ref="selectFieldContext" @select-column="handleSelectColumn"></SelectFieldContext>
      </template>
    </DropArea>
    <vue-context ref="menu">
      <template v-if="child.data" slot-scope="child">
        <li>
          <a href="#" @click="handleConfigFilter(child.data)">Config</a>
        </li>
        <li>
          <a href="#" @click.prevent="handleDeleteFilter(child.data.i, child.data.j)">Remove</a>
        </li>
      </template>
    </vue-context>
  </div>
</template>

<script lang="ts" src="./FilterDraggable.ts"></script>

<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';
@import '~@/themes/scss/mixin.scss';

.filter-draggable-area {
  color: var(--text-color);

  .filter-content-area {
    .gap-or {
      color: var(--secondary-text-color);
      font-size: 14px;
      margin-right: 20px;
      text-align: center;
    }

    // disable last child have OR
    .filter-group:last-child .gap-or {
      display: none;
    }

    .filter-group {
      margin: 8px;
    }

    .items {
      background-color: var(--hover-color);
      border-radius: 4px;

      margin: 8px 0;
      padding: 0;
      position: relative;
      width: 100%;

      .drop-and-label {
        background-color: var(--accent);
        color: var(--accent-text-color);
        border-radius: 0 4px;
        display: none;
        font-size: 14px;
        font-weight: lighter;
        padding: 6px 8px;
        position: absolute;
        right: 0;
        top: 0;
      }

      .item-name {
        margin-right: 0.5em;
      }

      .display-name {
        @include bold-text();
        font-size: 14px;
        margin: 0;
        padding: 0 4px;
        text-decoration: underline;
      }
    }

    .over-and {
      border-color: var(--accent);

      .drop-and-label {
        display: block;
      }
    }

    label,
    a {
      color: var(--text-color);
      font-size: 14px;
      letter-spacing: 0.2px;
    }

    .menu-options {
      background-color: var(--primary);
      border-radius: 5px;
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
      color: var(--text-color);
      font-size: 14px;
      letter-spacing: 0.2px;
      padding: 5px 15px;
      position: absolute;
      right: 50px;
      width: 80px;

      .menu-item div {
        line-height: 2.5;
      }
    }

    .item-name {
      font-weight: bold;
    }
  }
}

.drop-or {
  height: calc(100% - 35px);
}

p {
  color: var(--text-color);
  font-weight: bold;
}
</style>
