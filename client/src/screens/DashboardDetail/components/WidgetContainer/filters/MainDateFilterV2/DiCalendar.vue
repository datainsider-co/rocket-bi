<template>
  <a-popover :getPopupContainer="container" :placement="placement" :visible="isShowDatePicker" trigger="click" @visibleChange="showDatePicker">
    <template slot="content">
      <div :class="`${calendarClass} ${customClass}`" :style="timePresetHeight">
        <div class="calendar-container">
          <div class="compare-container">
            <DiDropdown
              :id="`${id}-date-mode`"
              v-model="currentCalendarData.filterMode"
              :data="listTimePresetOptions"
              labelProps="label"
              valueProps="value"
              @change="timePresetOptionsSelected"
            >
            </DiDropdown>
          </div>
          <div class="calendar-container-body">
            <div class="calendar-container-body-left">
              <div class="title-container">
                <div class="style"></div>
                <span class="title">Start Date</span>
              </div>
              <v-calendar
                ref="datePicker"
                :attributes="startDatePickerAttributes"
                :from-date="startDate"
                :max-date="endDate"
                :locale="locale"
                class="calendar-picker"
                color="blue"
                is-expanded
                is-inline
                isDark
                @dayclick="handleSelectStartTime"
              >
              </v-calendar>

              <div class="left-panel-action">
                <DiButton v-if="canEditCalendar" :id="genBtnId('remove-main-date-filter')" class="mr-1" title="Remove" @click="remove">
                  <i class="di-icon-delete"></i>
                </DiButton>

                <DiButton v-if="canEditCalendar" :id="genBtnId('reset-main-date-filter')" title="Edit Main Date" @click="handleResetMainDateFilter">
                  <i class="di-icon-setting"></i>
                </DiButton>
              </div>
            </div>
            <div class="calendar-container-body-right">
              <div class="title-container">
                <div class="style"></div>
                <span class="title">End Date</span>
              </div>
              <v-calendar
                ref="datePicker"
                :attributes="endDatePickerAttributes"
                :from-date="endDate"
                :min-date="startDate"
                :locale="locale"
                class="calendar-picker"
                color="blue"
                is-expanded
                is-inline
                isDark
                mode="date"
                @dayclick="handleSelectEndTime"
              >
              </v-calendar>
            </div>
          </div>
          <div class="calendar-container-footer" :class="{ 'have-reset-main-date': canEditCalendar }">
            <div class="calendar-container-footer-left fix-height-for-small-size">
              <p v-if="errorMessage" class="error-message">
                {{ errorMessage }}
              </p>
            </div>
            <div class="calendar-container-footer-right d-flex">
              <b-button :id="genBtnId('di-calender-cancel')" class="calendar-button cancel" variant="secondary" @click="cancel">
                Cancel
              </b-button>
              <b-button
                :id="genBtnId('di-calender-apply')"
                :disabled="isDisabledApplyButton"
                class="calendar-button calendar-button-right"
                variant="primary"
                @click="apply"
              >
                {{ applyTextButton }}
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div class="di-calendar-input-container">
      <slot name="icon" v-if="isShowIconDate">
        <div class="icon-title" style="line-height: normal">
          <i class="di-icon-calendar"></i>
        </div>
      </slot>
      <v-date-picker
        ref="datePickerInput"
        v-model="submittedPresetDateRange"
        :inputDebounce="1000"
        :locale="locale"
        :masks="{ input: [dateFormatPattern] }"
        :maxDate="maxDate"
        :minDate="minDate"
        :popover="{
          visibility: 'hidden'
        }"
        :updateOnInput="true"
        isDark
        mode="range"
        @input="submittedDateRangeChanged"
      >
        <input
          id="date"
          v-if="!$slots.content"
          slot-scope="{ inputProps, inputEvents }"
          v-bind="inputProps"
          v-on="inputEvents"
          autocomplete="off"
          class="input-calendar"
          placeholder="All Time"
          style="cursor: pointer"
        />
        <slot v-else name="content"></slot>
      </v-date-picker>
    </div>
  </a-popover>
</template>

<script lang="ts" src="./DiCalendar.ts" />

<style lang="scss" scoped>
@import '~@/themes/scss/calendar/new-di-calender.scss';
@import '~bootstrap/scss/bootstrap-grid.scss';

.disable-compare {
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
}

.calendar-container {
  border-radius: 4px;
}
</style>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~bootstrap/scss/bootstrap-grid';

.ant-popover {
  z-index: 2000;
}

.ant-popover-inner {
  background-color: var(--calendar-bg);
  border-radius: 4px;
  box-shadow: var(--menu-shadow);
  border: var(--menu-border);
}

.ant-popover-placement-bottom,
.ant-popover-placement-bottomLeft,
.ant-popover-placement-bottomRight {
  padding-top: 5px;
}

.ant-popover-arrow {
  display: none;
}

.ant-popover-inner-content {
  padding: 0px;
}

.di-calendar-input-container {
  align-items: center;
  display: flex;
  flex-direction: row;
  padding-right: 8px;

  > div.icon-title {
    margin: 0 8px;
    order: 0;
  }

  &:hover {
    > div.icon-title {
      cursor: pointer;
    }
  }

  .input-calendar {
    @include regular-text;
    background-color: transparent;
    border: transparent;
    color: var(--text-color);
    font-size: 14px;
    height: 37px;
    letter-spacing: 0.2px;
    margin-left: 8px;
    opacity: initial;
    order: 1;
    text-align: center;
    width: 180px;
  }

  input::placeholder {
    color: var(--text-color) !important;
  }
}

.left-panel-action {
  bottom: 13px;
  left: 10px;
  position: absolute;
  display: flex;
  align-items: center;

  @include media-breakpoint-down(md) {
    bottom: 44px;
  }
}

.btn-reset-main-date {
  color: var(--text-color);

  &:hover {
    color: var(--text-color);
  }
}
</style>
