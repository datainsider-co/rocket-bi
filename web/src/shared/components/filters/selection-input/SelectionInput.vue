<template>
  <div class="d-flex flex-column select-input-area w-100 p-0" :id="selectionPanelInputId">
    <DiDropdown
      :data="options"
      v-model="optionSelectedProp"
      class="p-0 mr-2 w-100"
      value-props="id"
      label-props="displayName"
      boundary="viewport"
      :container-id="selectionPanelInputId"
    ></DiDropdown>
    <div class="d-flex flex-row align-items-start mt-1" v-if="enableControlConfig">
      <SingleChoiceItem class="mr-3" :item="ValueTypeOptions[0]" :isSelected="isManualInput" @onSelectItem="(_, event) => changeManualInput(event, true)" />
      <SingleChoiceItem :item="ValueTypeOptions[1]" :isSelected="!isManualInput" @onSelectItem="(_, event) => changeManualInput(event, false)" />
    </div>
    <div class="chart-control-section" v-if="!isManualInput && enableControlConfig">
      <DiDropdown
        class="w-100 mt-2"
        :data="chartControlDataList"
        placeholder="Select a control"
        value-props="id"
        label-props="displayName"
        :value="selectedControlId"
        @change="id => selectChartControl(id)"
        boundary="window"
      >
        <template #option-item="{item, isSelected, getLabel}">
          <div>
            <img v-if="item.chartType" :src="getChartControlIconSrc(item)" class="unselectable ic-16" alt="chart" />
            <span class="block truncate unselectable" v-bind:class="{ 'font-normal': !isSelected(item), 'font-semibold': isSelected(item) }">
              {{ getLabel(item) }}
            </span>
          </div>
        </template>
      </DiDropdown>
      <div :id="selectionInputId" class="chart-control-input-filter" v-if="selectedControlId && selectedWidgetControl">
        <template v-if="inputType === InputTypes.Text || inputType === InputTypes.Date">
          <div class="chart-control-input-filter--single">
            <label>Value</label>
            <DiDropdown
              :data="supportedControlValues"
              v-model="singleValue"
              class="w-100"
              placeholder="Select value to filter"
              value-props="type"
              label-props="displayName"
              boundary="window"
              :container-id="selectionInputId"
            />
          </div>
        </template>
        <template v-if="inputType === InputTypes.DateRange || inputType === InputTypes.NumberRange">
          <div class="chart-control-input-filter--range">
            <div>
              <label>Start value</label>
              <DiDropdown
                :data="supportedControlValues"
                v-model="valuesProp[0]"
                placeholder="Select start value"
                value-props="type"
                label-props="displayName"
                boundary="viewport"
                :container-id="selectionInputId"
              />
            </div>
            <div>
              <label>End value</label>
              <DiDropdown
                :data="supportedControlValues"
                v-model="valuesProp[1]"
                placeholder="Select end value"
                value-props="type"
                label-props="displayName"
                boundary="viewport"
                :container-id="selectionInputId"
              />
            </div>
          </div>
        </template>
        <template v-if="inputType === InputTypes.MultiSelect">
          <div class="chart-control-input-filter--multi-select">
            <label>Values</label>
            <MultiSelection
              :model="valuesProp"
              :options="supportedControlValues"
              key-field="type"
              key-label="displayName"
              @selectedColumnsChanged="newValues => (valuesProp = newValues)"
            />
          </div>
        </template>
      </div>
    </div>
    <div v-else-if="currentSelected" class="input-container mt-2">
      <template v-if="inputType === InputTypes.Text">
        <DiInputComponent autofocus border label="Value" v-model="singleValue" class="input-form" placeholder="Input Value Filter" @enter="applyFilter" />
      </template>
      <template v-if="inputType === InputTypes.Date">
        <label>Value</label>
        <DiDatePicker :date.sync="selectedDate" placeholder="ex: 01/15/2023" @change="applyFilter" :isShowIconDate="false" />
      </template>
      <template v-if="inputType === InputTypes.DateRange">
        <label>Value</label>
        <DiCalendar
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
        />
      </template>
      <template v-if="inputType === InputTypes.NumberRange">
        <div class="number-range-input">
          <DiInputComponent
            border
            label="Min value"
            autofocus
            type="number"
            v-model="valuesProp[0]"
            class="input-form"
            placeholder="ex: 0"
            @enter="applyFilter"
          />
          <DiInputComponent border label="Max value" type="number" v-model="valuesProp[1]" class="input-form" placeholder="ex: 1000" @enter="applyFilter" />
        </div>
      </template>
    </div>
    <slot name="footer" :isManualInput="isManualInput"></slot>
  </div>
</template>

<script lang="ts" src="./SelectionInput.ts"></script>
<style lang="scss" scoped src="./SelectionInput.scss"></style>

<style lang="scss">
.input-container .number-range-input {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  width: 100%;

  .input-form + .input-form {
    margin-left: 8px;
  }
}

.chart-control-input-filter {
  margin-top: 8px;
  font-size: 14px;

  &--single {
  }

  &--range {
    display: flex;
    flex-direction: row;
    overflow: hidden;
    width: 100%;

    > div {
      width: 50%;
    }
    > div + div {
      margin-left: 8px;
    }
  }

  &--multi-select {
    label {
      margin-bottom: 0;
    }
  }
}
</style>
