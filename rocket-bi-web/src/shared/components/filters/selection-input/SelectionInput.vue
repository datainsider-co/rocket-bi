<template>
  <div class="d-flex flex-column select-input-area w-100 p-0">
    <DiDropdown
      :id="genDropdownId('filter')"
      class="p-0 mr-2 w-100"
      :data="options"
      value-props="id"
      label-props="displayName"
      v-model="optionSelectedProp"
      boundary="viewport"
    ></DiDropdown>
    <div class="d-flex flex-row align-items-start mt-1" v-if="enableControlConfig">
      <SingleChoiceItem class="mr-3" :item="ValueTypeOptions[0]" :isSelected="isManualInput" @onSelectItem="handleValueTypeChanged(true, ...arguments)" />
      <SingleChoiceItem :item="ValueTypeOptions[1]" :isSelected="!isManualInput" @onSelectItem="handleValueTypeChanged(false, ...arguments)" />
    </div>
    <DiDropdown
      v-if="!isManualInput && enableControlConfig"
      :id="genDropdownId('dashboard-controls')"
      class="w-100 mt-2"
      :data="controlOptions"
      placeholder="Select a control"
      value-props="id"
      label-props="displayName"
      v-model="controlId"
      boundary="viewport"
    >
      <template #option-item="{item, isSelected, getLabel}">
        <div>
          <img v-if="item.chartType" :src="require(`@/assets/icon/charts/${getControlIcon(item)}`)" class="unselectable ic-16" alt="chart" />
          <span class="block truncate unselectable" v-bind:class="{ 'font-normal': !isSelected(item), 'font-semibold': isSelected(item) }">
            {{ getLabel(item) }}
          </span>
        </div>
      </template>
    </DiDropdown>
    <div v-else-if="currentSelected" class="input-container mt-2">
      <BInput
        autofocus
        :id="genInputId('filter-value')"
        v-model="valueProp"
        v-if="isText"
        class="input-form"
        placeholder="Input Value Filter"
        @keydown.enter="applyFilter"
      ></BInput>
      <DiDatePicker v-if="isDate" :date.sync="selectedDate" @change="handleApplyFilter" :isShowIconDate="false" />
      <DiCalendar
        v-if="isDateRange"
        :isHiddenCompareToSection="true"
        :container="parentElement"
        :isShowResetFilterButton="false"
        :mainDateFilterMode="mainDateFilterMode"
        :defaultDateRange="defaultDateRange"
        :mode-options="MainDateModeOptions"
        :get-date-range-by-mode="getDateRangeByMode"
        applyTextButton="Ok"
        placement="bottomLeft"
        @onCalendarSelected="handleCalendarSelected"
      >
      </DiCalendar>
      <div class="w-100 d-flex flex-row" v-if="isNumberRange">
        <BInput
          autofocus
          type="number"
          :id="genInputId('min-value')"
          v-model="valuesProp[0]"
          class="input-form mr-2"
          placeholder="Input Start Value Filter"
          @keydown.enter="applyFilter"
        />
        <BInput
          type="number"
          :id="genInputId('max-value')"
          v-model="valuesProp[1]"
          class="input-form"
          placeholder="Input End Value Filter"
          @keydown.enter="applyFilter"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./SelectionInput.ts"></script>
<style lang="scss" scoped src="./SelectionInput.scss"></style>
