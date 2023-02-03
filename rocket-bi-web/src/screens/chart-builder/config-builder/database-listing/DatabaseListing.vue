<template>
  <div class="p-0 d-flex flex-column">
    <slot
      name="header"
      :submitKeywordChanged="submitKeywordChanged"
      :keyword="keyword"
      :enableSearch="enableSearch"
      :blur="handleUnFocus"
      :toggleSearch="toggleSearch"
    >
      <slot name="header-bar">
        <div class="header-bar d-flex justify-content-between align-items-center">
          <div v-if="showSelectTabControl" class="d-flex flex-row h-100 w-100 align-items-center">
            <div
              class="cursor-pointer source-item"
              :class="{ 'di-active': displayListing === DisplayListings.Database }"
              @click="setDisplayListing(DisplayListings.Database)"
            >
              <i class="di-icon-database icon-title" />
              <label class="cursor-pointer">
                <slot name="database-title">Database</slot>
              </label>
            </div>
            <div
              class="cursor-pointer source-item"
              :class="{ 'di-active': displayListing === DisplayListings.TabControl }"
              @click="setDisplayListing(DisplayListings.TabControl)"
            >
              <i class="di-icon-filter-control icon-title" />
              <label class="cursor-pointer">
                Chart Control
              </label>
            </div>
          </div>
          <div v-else class="source-item">
            <i class="di-icon-database icon-title"></i>
            <label class="unselectable">
              Database
            </label>
          </div>
        </div>
      </slot>
    </slot>
    <div class="d-flex flex-column database-listing">
      <slot
        name="database-header"
        :submitKeywordChanged="submitKeywordChanged"
        :keyword="keyword"
        :enableSearch="enableSearch"
        :blur="handleUnFocus"
        :toggleSearch="toggleSearch"
      >
        <div class="database-selector" v-if="displayListing === DisplayListings.Database">
          <slot name="database-selector" v-if="!enableSearch && showSelectDatabase">
            <DiDropdown
              canHideOtherPopup
              class="selector mr-2"
              :id="genDropdownId('databases')"
              v-model="databaseSelected"
              :data="databaseInfos"
              labelProps="displayName"
              placeholder="Select database"
              valueProps="name"
            >
            </DiDropdown>
          </slot>
          <DiSearchInput
            v-if="enableSearch || !showSelectDatabase"
            class="w-100"
            placeholder="Search tables & columns..."
            :border="true"
            v-model="keyword"
            @blur="handleUnFocus"
            @change="handleUnFocus"
          />
          <div v-else class="ml-auto icon-button cursor-pointer" @click="toggleSearch">
            <img src="@/assets/icon/ic_search.svg" alt="" />
          </div>
        </div>
      </slot>
      <StatusWidget :status="status" :error="error" :hide-retry="hideRetry" class="overflow-hidden pt-2">
        <vuescroll v-if="!isLoading && !isError && !isEmptyTableSchema" :ops="options" class="schema-listing" ref="treeNodeScroller">
          <div class="nav-scroll">
            <ul class="nav">
              <SlVueTree
                v-if="displayListing === DisplayListings.Database"
                :value="tableSchemas"
                draggable="false"
                @onDragEndItem="handleDragEnd"
                @onDragstartitem="handleDragStart"
                @onRightClick="handleRightClickNode"
                @nodeclick="handleNodeClick"
                @clickField="handleClickField"
              >
                <template #title="{node}">
                  <div class="table-header-toggle">
                    <i class="di-icon-table"></i>
                    <div class="table-header-toggle-title">{{ node.title }}</div>
                    <template v-if="!node.isLeaf && !hideTableAction">
                      <div
                        class="icon-create-field btn-icon btn-icon-border"
                        v-if="mode === DatabaseEditionMode.Query"
                        @click.prevent.stop="handleClickTable(node)"
                      >
                        <i class="di-icon-double-arrow"></i>
                      </div>
                      <div
                        v-else-if="mode === DatabaseEditionMode.Editing"
                        class="icon-create-field btn-icon btn-icon-border"
                        @click="showMoreOption(node, ...arguments)"
                      >
                        <i class="di-icon-three-dot"></i>
                      </div>
                    </template>
                  </div>
                </template>
              </SlVueTree>
              <SlVueTree
                v-else-if="displayListing === DisplayListings.TabControl"
                :value="tabControls"
                :draggable="true"
                @onDragEndItem="handleDragEnd"
                @onDragstartitem="handleDragStart"
                @onRightClick="handleRightClickNode"
                @nodeclick="handleNodeClick"
                @clickField="handleClickField"
              >
              </SlVueTree>
            </ul>
          </div>
        </vuescroll>
        <div v-if="isLoaded && !isError && isEmptyTableSchema" class="h-100 w-100 d-flex flex-column align-items-center justify-content-center">
          <template v-if="isActiveSearch">
            <img src="@/assets/icon/directory-empty.svg" alt="empty" />
            <template v-if="displayListing === DisplayListings.Database">
              <div class="justify-content-center pt-3">No found tables & columns</div>
            </template>
            <template v-else>
              <div class="justify-content-center pt-3">No found tab controls</div>
            </template>
          </template>
          <template v-else>
            <EmptyDirectory v-if="displayListing === DisplayListings.Database" title="Database empty" :is-hide-create-hint="true" />
            <EmptyDirectory v-else title="Chart control empty" :is-hide-create-hint="true" />
          </template>
        </div>
      </StatusWidget>
      <CalculatedFieldModal ref="calculatedFieldModal" @created="createTable" @updated="updateTable" />
      <UpdateTableByQueryModal ref="updateTableByQueryModal"></UpdateTableByQueryModal>
      <VueContext ref="tableMenu">
        <template slot-scope="{ data }">
          <template v-if="data && data.tableSchema">
            <DataListing class="my-2" :records="finalTableActions(data.tableSchema)" @onClick="handleConfigTable(data.tableSchema, ...arguments)"></DataListing>
          </template>
        </template>
      </VueContext>
      <VueContext ref="columnMenu">
        <template slot-scope="{ data }">
          <DataListing class="my-2" :records="fieldOptions" @onClick="handleConfigColumn(data.tableSchema, data.column, ...arguments)"></DataListing>
        </template>
      </VueContext>
      <VueContext ref="expressionColumnMenu" id="expression-config">
        <template slot-scope="{ data }">
          <DataListing class="my-2" :records="expressionFieldOptions" @onClick="handleConfigColumn(data.tableSchema, data.column, ...arguments)"></DataListing>
        </template>
      </VueContext>
    </div>
  </div>
</template>

<script lang="ts" src="./DatabaseListing.ts"></script>
<style lang="scss" scoped src="./DatabaseListing.scss"></style>
<style lang="scss">
.table-header-toggle {
  display: flex;
  align-items: center;
  justify-content: left;

  > * + * {
    margin-left: 4px;
  }

  .table-header-toggle-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .icon-create-field {
    padding: 2px;
    opacity: 1;
  }
}
</style>
