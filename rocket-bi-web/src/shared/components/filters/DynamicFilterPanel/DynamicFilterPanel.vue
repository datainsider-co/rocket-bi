<template>
  <div class="dynamic-filter-panel">
    <div class="d-flex flex-row view-panel" :style="viewPanelStyle" :id="btnId">
      <div class="d-flex flex-row align-items-center display-group" :class="{ disabled: isDisable }">
        <slot name="conditionName">
          <div class="display-name">{{ filterName }}</div>
        </slot>
        <div class="mx-1 display-filter-type text-nowrap">{{ displayFilterType }}</div>
        <div class="listing-filter-area">
          <slot name="filter-value">
            <ChipListing
              v-if="isShowTagListing"
              :listChipData="listChipData"
              @removeAt="handleRemoveChipAt"
              @onChipClicked="showPopover"
              :maxChipShowing="maxChipShowing"
            ></ChipListing>
            <div class="btn-filter unselectable text-nowrap" @click="showPopover" v-else>
              Click to filter
            </div>
          </slot>
        </div>
      </div>
      <div class="d-flex flex-row align-items-center icon-group cursor-pointer" @click.prevent="toggleEnableFilter" v-if="isShowDisable">
        <i class="di-icon-eye" key="open" v-if="isEnable"></i>
        <i class="di-icon-eye-close" key="close" v-else></i>
      </div>
    </div>
    <DynamicFilterPopover
      :btnId="btnId"
      :dynamicFilter="dynamicFilter"
      :isShowPopover.sync="isShowPopover"
      @onApplyFilter="handleApplyFilter"
      @onRemove="handleDeleteFilter"
      :placement="placement"
      :boundaryOption="boundary"
      :enableControlConfig="enableControlConfig"
      :isDefaultStyle="isDefaultStyle"
    >
    </DynamicFilterPopover>
  </div>
</template>

<script lang="ts" src="./DynamicFilterPanel.ts"></script>
<style lang="scss" src="./dynamic-filter-panel.scss" scoped />
