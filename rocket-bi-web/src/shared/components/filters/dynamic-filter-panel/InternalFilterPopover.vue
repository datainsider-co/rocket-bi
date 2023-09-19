<template>
  <BPopover
    :show.sync="isShowPopoverSynced"
    :container="containerId"
    :target="targetId"
    :custom-class="customPopoverClass"
    :placement="placement"
    :boundary="boundaryOption"
    ref="popover"
    triggers="manual"
    tabindex="-1"
  >
    <!--  todo:  don't change class name here, cause it cannot focus in chart builder modal-->
    <div v-click-outside="hidePopover" class="internal-filter-popover">
      <div class="d-flex flex-row align-items-center filter-popover-header">
        <div class="popover-title">Filter {{ filterName }}</div>
        <DiDropdown
          :id="genDropdownId('dynamic-filter')"
          v-show="isSupportChangeFilterMode"
          :value="selectedFilterMode"
          :data="filterModeOptions"
          @change="handleSelectFilterMode"
          class="ml-auto dropdown-border"
          labelProps="displayName"
          valueProps="id"
        />
      </div>
      <div class="filter-popover-body">
        <component
          v-if="toComponent"
          :is="toComponent"
          ref="filterComponent"
          :defaultOptionSelected="currentOptionSelected"
          :defaultValues="currentValues"
          :profileField="profileField"
          :selectOptions="selectOptions"
          :selectedControlId.sync="currentFilter.controlId"
          :enableControlConfig="enableControlConfig"
          :chartControls="chartControls"
          @applyFilter="handleApplyFilter"
          @relocation="handleRelocation"
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

<script lang="ts" src="./InternalFilterPopover.ts"></script>
<style lang="scss" scoped src="./InternalFilterPopover.scss"></style>
