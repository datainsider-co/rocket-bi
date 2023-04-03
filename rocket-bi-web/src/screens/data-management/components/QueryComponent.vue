<template>
  <Split :gutterSize="24" direction="vertical" @onDragEnd="resizeChart" class="query-component">
    <SplitArea :size="45" :minSize="150">
      <div class="query-input-container">
        <div class="d-flex row query-header">
          <div class="query-title">Build Query</div>
          <slot name="header"></slot>
          <input id="input-query" v-if="isTestAccount" v-model="query" style="z-index: -1" />
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <div class="formula-completion-input">
            <div class="padding-top"></div>
            <FormulaCompletionInput
              v-if="formulaController"
              ref="formulaCompletionInput"
              v-model="query"
              :formulaController="formulaController"
              :editorController="editorController"
              :fixedOverflowWidgets="true"
              :isReadOnly="isReadOnly"
              class="query-input"
              placeholder="select * from..."
              @onExecute="handleQuery"
              @onSave="handleSave"
              @input="onQueryChanged"
            />
          </div>
        </div>
        <div style="max-height: 10vh" v-if="showParameter">
          <vuescroll>
            <div class="param-listing">
              <ParamItem v-for="(param, key) in parameters" :key="key" :param="param" @change="updateParamValue" @edit="onConfigParam" />
              <DiButton
                border
                :is-disable="isReadOnly"
                id="button-query-param"
                class="btn-ghost default-button"
                title="Add Param"
                tabindex="-1"
                @click="onAddParam(getLengthOfParams())"
              >
                <i class="di-icon-add"></i>
              </DiButton>
            </div>
          </vuescroll>
        </div>

        <div class="row-limit-container d-flex align-items-center" ref="actionRow">
          <div v-if="showAdHocAnalysis" class="d-flex w-100 align-items-center">
            <template v-if="listAdhocInfo.length > 0">
              <div class="list-viz-item">
                <vuescroll ref="viewAllScroll" :ops="horizontalScroll">
                  <div class="viz-item-scroll-body d-flex flex-row">
                    <template v-for="(item, index) in listAdhocInfo">
                      <div :key="index" class="d-flex">
                        <VisualizationItem
                          :key="index"
                          :id="'viz-item-' + index"
                          :isSelected="index === currentAdHocIndex"
                          :item="getVizItem(item.vizItem.type)"
                          class="viz-item mr-1"
                          type="mini"
                          @onClickItem="handleSelectChart(index)"
                        />
                      </div>
                    </template>
                  </div>
                </vuescroll>
              </div>
            </template>
            <DiButton
              ref="addChartButton"
              border
              v-if="showAddChartButton"
              :is-disable="isReadOnly"
              id="add-new-table-display"
              class="btn-ghost default-button add-chart-button"
              title="Add Chart"
              @click="handleNewChart"
            >
              <i v-if="isAddChartLoading" class="fa fa-spin fa-spinner"></i>
              <i v-else class="di-icon-add"></i>
            </DiButton>
          </div>
          <div class="d-flex align-items-center ml-auto right-group">
            <i v-if="isSavingAdhocChart" class="fa fa-spin fa-spinner mr-2"></i>
            <DiButton
              border
              v-if="showAdHocAnalysis && showSaveQueryButton && !isMobile()"
              :disabled="listAdhocInfo.length === 0"
              id="button-save-adhoc"
              class="btn-ghost default-button mr-2"
              :title="titleSaveAnalysis"
              :is-disable="isReadOnly"
              tabindex="-1"
              @click="handleClickSaveAnalysis"
            >
            </DiButton>
            <DiButton
              border
              v-if="mode === queryModes.EditTable"
              :disabled="listAdhocInfo.length === 0"
              id="button-save-table"
              class="btn-ghost default-button mr-2"
              title="Update Table"
              :is-disable="isReadOnly"
              tabindex="-1"
              @click="emitUpdateTable"
            >
            </DiButton>
            <DiButton
              v-if="showAdHocAnalysis && !isMobile()"
              border
              id="button-action"
              class="btn-ghost default-button action-button"
              title="Actions"
              :is-disable="isReadOnly"
              tabindex="-1"
              @click="showSaveOptions"
            ></DiButton>

            <DiButton
              primary
              :disabled="queryStatus === Statuses.Loading"
              :id="genBtnId('query')"
              class="btn-query flex-fill btn-primary"
              title="Execute"
              @click="handleQuery"
            >
              <i v-if="queryStatus === Statuses.Loading" class="fa fa-spin fa-spinner"></i>
            </DiButton>
          </div>
        </div>
      </div>
    </SplitArea>
    <SplitArea :size="55">
      <!--        :style="{ height: `calc(100% - ${charHolderContainerHeight()}px)` }"-->
      <div v-if="errorMsg" class="query-result d-flex align-items-center h-100 p-3 text-danger text-center">
        <vuescroll class="query-result--error">
          <pre>{{ errorMsg }}</pre>
        </vuescroll>
      </div>
      <LoadingComponent v-else-if="queryStatus === Statuses.Loading" class="query-result d-flex align-items-center h-100 justify-content-center" />
      <div v-else-if="currentAdhocAnalysis" class="query-result d-flex flex-column text-left h-100">
        <div class="table-container flex-grow-1 table-container-padding-15">
          <ChartHolder
            :isPreview="true"
            v-if="currentAdhocAnalysis"
            ref="chartHolder"
            :disablePagination="disablePagination"
            :meta-data="currentAdhocAnalysis.chartInfo"
            class="result-table position-relative"
            disableSort
            :disableEmptyChart="currentAdHocIndex === 0"
          ></ChartHolder>
          <div v-if="currentAdHocIndex !== 0" style="z-index: 2; background: transparent" class="chart-action">
            <i class="di-icon-edit p-2 btn-icon-border mr-2" :class="{ disabled: isReadOnly }" @click="handleClickEditChart"></i>
            <i class="di-icon-delete p-2 btn-icon-border" :class="{ disabled: isReadOnly }" @click="handleDeleteAdhocAnalysis(currentAdHocIndex)"></i>
          </div>
        </div>
      </div>
      <div id="query-result-empty" v-else class="query-result d-flex align-items-center h-100 justify-content-center" style="font-weight: 500; padding: 8px">
        Write your SQL query above and then click Execute.<br />The results from your query will show up here.
      </div>
      <ChartBuilderComponent ref="chartBuilderComponent"></ChartBuilderComponent>
    </SplitArea>
    <ContextMenu id="save-query-menu" ref="contextMenu" :ignoreOutsideClass="['action-button']" minWidth="200px" textColor="#fff" z-index="2" />
    <ParameterModal ref="paramModal" />
  </Split>
</template>

<script lang="ts" src="./QueryComponent.ts" />
<style lang="scss" src="./query-component.scss" />
