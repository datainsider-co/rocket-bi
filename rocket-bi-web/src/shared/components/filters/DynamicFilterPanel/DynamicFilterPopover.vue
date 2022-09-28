<template>
  <BPopover
    :show.sync="isShowPopoverSynced"
    :target="btnId"
    :custom-class="{
      'filter-popover-area': true,
      'filter-popover-area-default-style': isDefaultStyle
    }"
    :placement="placement"
    ref="popover"
    triggers="manual"
    :boundary="boundaryOption"
  >
    <div v-click-outside="hidePopover">
      <div class="d-flex flex-row align-items-center filter-popover-header">
        <div class="popover-title">Filter {{ filterName }}</div>
        <DiDropdown
          :id="genDropdownId('dynamic-filter')"
          v-show="isShowOptionRangeFilter"
          v-model="filterModeSelected"
          :data="options"
          class="ml-auto dropdown-border"
          labelProps="displayName"
          valueProps="id"
        />
      </div>
      <div class="filter-popover-body">
        <component
          :is="toComponent"
          v-if="toComponent"
          ref="filterRef"
          :defaultOptionSelected="currentOptionSelected"
          :defaultValues="currentValues"
          :profileField="profileField"
          :selectOptions="selectOptions"
          :controlOptions="dashboardControls"
          :control.sync="currentFilter.control"
          :enableControlConfig="enableControlConfig"
        ></component>
        <div v-else>Filter unsupported</div>
      </div>
      <div class="d-flex flex-row align-items-center filter-popover-footer">
        <div :id="genBtnId('dynamic-filter-popover-delete')" class="btn-ghost mr-auto" @click.prevent="handleDeleteFilter">
          <i class="fas di-icon-delete"></i>
        </div>
        <div class="d-flex flex-row button-bar">
          <DiButton :id="genBtnId('dynamic-filter-popover-cancel')" class="mr-2" @click.prevent="hidePopover" title="Cancel" border-accent></DiButton>
          <DiButton :id="genBtnId('dynamic-filter-popover-apply')" @click.prevent="handleApplyFilter" title="Apply" primary></DiButton>
        </div>
      </div>
    </div>
  </BPopover>
</template>

<script lang="ts" src="./DynamicFilterPopover.ts"></script>
<style lang="scss" scoped src="./dynamic-filter-popover.scss"></style>
