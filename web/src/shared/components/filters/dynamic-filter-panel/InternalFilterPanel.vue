<template>
  <div class="dynamic-filter-panel">
    <div class="d-flex flex-row view-panel" :style="viewPanelStyle" :id="id">
      <div class="d-flex flex-row align-items-center display-group" :class="{ disabled: isDisable }">
        <slot name="conditionName">
          <div class="display-name">{{ filterName }}</div>
        </slot>
        <div class="mx-1 display-filter-type text-nowrap">{{ displayConditionType }}</div>
        <div class="listing-filter-area">
          <slot name="filter-value">
            <ChipListing
              v-if="isShowTagListing"
              :listChipData="chipDataList"
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
    <InternalFilterPopover
      :targetId="id"
      :container-id="containerId"
      :internal-filter="internalFilter"
      :isShowPopover.sync="isShowPopover"
      :placement="placement"
      :boundaryOption="boundary"
      :enableControlConfig="enableControlConfig"
      :isDefaultStyle="isDefaultStyle"
      :chartControls="chartControls"
      @onApplyFilter="handleApplyFilter"
      @onRemove="handleDeleteFilter"
    >
    </InternalFilterPopover>
  </div>
</template>

<script lang="ts" src="./InternalFilterPanel.ts"></script>
<style lang="scss" src="./InternalFilterPanel.scss" scoped />
