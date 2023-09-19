<template>
  <DropArea
    :disabled="disabled"
    :canDrop="canDrop"
    :isDragging="hasDragging"
    :isOptional="config.isOptional"
    :showHelpIcon="showHelpIcon"
    :showPlaceHolder="isShowPlaceHolder"
    :showTitle="showTitle"
    :title="config.title"
    @onDrop="handleDrop"
  >
    <template #drop-area>
      <draggable
        v-model="currentFunctions"
        :animation="100"
        :class="{
          placeholder: isShowPlaceHolder
        }"
        :componentData="config"
        :emptyInsertThreshold="100"
        :group="groupConfig"
        class="draggable"
        draggable=".drag-item"
        @add="handleDropFromOtherConfig"
        @end="handleFunctionChanged"
        @start="handleDragItem"
      >
        <DropItem
          v-for="(node, index) in currentFunctions"
          :key="node.id"
          :canInsert="canDrop"
          :canReplace="canReplace"
          :index="index"
          :isItemDragging="isItemDragging"
          class="drag-item"
          @onInsert="insertFunction"
          @onReplace="handleReplaceFunction"
        >
          <template #default="{ opacity }">
            <DraggableItem
              :configType="configType"
              :node="node"
              :opacity="opacity"
              @clickFuncFamily="openContext(fnFamilyContext, $event, { node: node, i: index })"
              @clickFuncType="openContext(fnTypeContext, $event, { node: node, i: index })"
              @clickMore="openContext(menu, $event, { node: node, i: index })"
              @clickName="handleClickChangeField($event, { node: node, i: index })"
              @clickSorting="openContext(sortingContext, $event, { node: node, i: index })"
            >
            </DraggableItem>
          </template>
        </DropItem>
      </draggable>
      <template v-if="isShowPlaceHolder">
        <div class="tutorial-drop">
          <div v-once class="unselectable">
            <img alt="drag" src="@/assets/icon/ic-drag.svg" /> {{ config.placeholder }} or
            <a href="#" style="cursor: pointer;" @click="handleClickHere" ref="clickHereButton">click here</a>
          </div>
        </div>
      </template>
      <template>
        <ConfigModal
          :configType="configType"
          :functions="listAcceptableFunctions(editingNode)"
          :isOpen.sync="isModalOpen"
          :node="editingNode"
          :subFunctions="subFunctions(editingNode)"
          @onSaveConfig="handleSaveConfig"
        >
        </ConfigModal>
        <vue-context ref="menu">
          <template v-if="child.data" slot-scope="child">
            <li v-if="isExpressionField(child.data.node)">
              <a href="#" @click.prevent="editExpression(child.data.node)">Edit Measure</a>
            </li>
            <li>
              <a href="#" @click.prevent="openModal(child.data.node)">Config</a>
            </li>
            <li>
              <a href="#" @click.prevent="removeItem(child.data.i)">Remove</a>
            </li>
          </template>
        </vue-context>
        <vue-context ref="fnFamilyContext">
          <template v-if="child.data" slot-scope="child">
            <div class="context">
              <div
                v-for="(func, i) in listAcceptableFunctions(child.data.node)"
                :key="i"
                class="active"
                @click.prevent="handleFunctionFamilyChanged(func, child)"
              >
                <li>
                  <a href="#" style="cursor: pointer">{{ func.label }}</a>
                  <span v-if="child.data.node.functionFamily === func.label">&#10003;</span>
                </li>
              </div>
            </div>
          </template>
        </vue-context>
        <vue-context ref="fnTypeContext">
          <template v-if="child.data" slot-scope="child">
            <div class="context">
              <div
                v-for="(subFunc, i) in subFunctionGroups(child.data.node)"
                :key="i"
                :class="{ active: subFunc.type !== 'group' }"
                @click.prevent="subFunc.type !== 'group' && handleFunctionTypeChanged(subFunc, child)"
              >
                <div v-if="subFunc.type === 'group'" class="context-menu-group">
                  <span>{{ subFunc.label }}</span>
                </div>
                <div v-else>
                  <div>
                    <li>
                      <a href="#" style="cursor: pointer">{{ subFunc.label }}</a>
                      <span v-if="child.data.node.functionType === subFunc.label">&#10003;</span>
                    </li>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </vue-context>
        <vue-context ref="sortingContext">
          <template v-if="child.data" slot-scope="child">
            <div class="context">
              <div v-for="(sort, index) in sorts" :key="index" class="active" @click.prevent="handleSortingChanged(sort, child)">
                <li>
                  <a href="#" style="cursor: pointer">{{ sort.label }}</a>
                  <span v-if="child.data.node.sorting === sort.label">&#10003;</span>
                </li>
              </div>
            </div>
          </template>
        </vue-context>
        <SelectFieldContext ref="selectFieldContext" @field-changed="handleChangeField" @select-column="handleSelectColumn"></SelectFieldContext>
        <CalculatedFieldModal ref="calculatedFieldModal" @updated="handleUpdateTableSchema" />
      </template>
    </template>
  </DropArea>
</template>

<script lang="ts" src="./ConfigDraggable.ts"></script>

<style lang="scss" src="./ConfigDraggable.scss"></style>
