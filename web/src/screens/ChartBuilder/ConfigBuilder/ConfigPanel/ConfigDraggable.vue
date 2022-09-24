<template>
  <DropArea
    :allowDrop="canDrop"
    :isDragging="hasDragging"
    :isOptional="config.isOptional"
    :placeholder="config.placeholder"
    :showHelpIcon="showHelpIcon"
    :showPlaceHolder="isShowPlaceHolder"
    :showTitle="showTitle"
    :title="config.title"
    @onClickTooltip="handleClickTooltip(dbFieldContext, $event)"
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
        @add="handleDropFromOtherSection"
        @end="handleFunctionChanged"
        @start="handleDragItem"
      >
        <DropItem
          v-for="(node, index) in currentFunctions"
          :key="node.id"
          :canInsert="canDrop"
          :can-replace="canReplace"
          :index="index"
          :isItemDragging="isItemDragging"
          class="drag-item"
          @onInsert="handleInsertFunction"
          @onReplace="handleReplaceFunction"
          @onInsertDynamic="handleInsertFunction"
          @onReplaceDynamic="handleReplaceFunction"
        >
          <template #default="{ opacity }">
            <DraggableItem
              :configType="configType"
              :node="node"
              :opacity="opacity"
              @clickFuncFamily="openContext(fnFamilyContext, $event, { node: node, i: index })"
              @clickFuncType="openContext(fnTypeContext, $event, { node: node, i: index })"
              @clickMore="openContext(menu, $event, { node: node, i: index })"
              @clickName="handleClickField(fieldContext, $event, { node: node, i: index })"
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
            <a href="#" style="cursor: pointer;" @click="handleClickTooltip(dbFieldContext, $event)">click here</a>
          </div>
        </div>
      </template>
      <template>
        <ConfigModal
          :configType="configType"
          :functions="functionOfTreeNode(editingNode)"
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
        <vue-context ref="fieldContext">
          <template v-if="child.data" slot-scope="child">
            <StatusWidget :error="errorMessage" :status="fieldContextStatus">
              <div class="context field-context">
                <div v-for="(profileField, i) in profileFields" :key="i" class="active" @click.prevent="handleChangeField(child, profileField)">
                  <li>
                    <a href="#" style="cursor: pointer">{{ profileField.displayName }}</a>
                    <span v-if="child.data.node.displayName === profileField.displayName">&#10003;</span>
                  </li>
                </div>
              </div>
            </StatusWidget>
          </template>
        </vue-context>
        <vue-context ref="fnFamilyContext">
          <template v-if="child.data" slot-scope="child">
            <div class="context">
              <div v-for="(func, i) in functionOfTreeNode(child.data.node)" :key="i" class="active" @click.prevent="handleFunctionFamilyChanged(func, child)">
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
        <vue-context ref="dbFieldContext">
          <template>
            <StatusWidget :error="errorMessage" :status="fieldContextStatus">
              <div class="context field-context">
                <template v-if="fieldOptions.length === 0">
                  <div class="d-flex align-items-center justify-content-center" style="height:  316px;width:250px">
                    <EmptyDirectory :is-hide-create-hint="true" title="Database empty" />
                  </div>
                </template>
                <template v-for="(table, tableIndex) in fieldOptions" v-else>
                  <li :key="`table_${tableIndex}`" class="p-2">
                    <b href="#">{{ table.displayName }}</b>
                  </li>
                  <template v-for="(field, i) in table.options">
                    <div :key="`table_${tableIndex}_${i}`" class="active p-2" @click="handleSelectColumn(field)">
                      <li class="px-2 overflow-hidden" style="white-space: nowrap; text-overflow: ellipsis">
                        <a href="#" style="cursor: pointer">{{ field.displayName }}</a>
                      </li>
                    </div>
                  </template>
                </template>
              </div>
            </StatusWidget>
          </template>
        </vue-context>
        <CalculatedFieldModal ref="calculatedFieldModal" @updated="handleUpdateTableSchema" />
      </template>
    </template>
  </DropArea>
</template>

<script lang="ts" src="./ConfigDraggable.ts"></script>

<style lang="scss" src="./config-draggable.scss"></style>
