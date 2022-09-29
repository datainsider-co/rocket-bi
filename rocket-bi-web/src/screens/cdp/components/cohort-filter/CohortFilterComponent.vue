<template>
  <div class="event-filters-container">
    <div
      v-for="(group, groupIndex) in value"
      :key="groupIndex"
      :id="`filter-group-${groupIndex}`"
      class="event-filter-group"
      :class="[group.isAndWithNext ? 'event-filter-group-and' : 'event-filter-group-or']"
    >
      <div v-for="(cohort, cohortIndex) in group.cohorts" :key="cohortIndex" class="event-filter-item">
        <div class="event-filters-item">
          <span class="efi-group">
            <button v-if="!cohortIndex" disabled>where</button>
            <button v-else-if="group.isAndCohorts" @click.prevent="toggleGroupCohortOperator(group)">and</button>
            <button v-else @click.prevent="toggleGroupCohortOperator(group)">or</button>
          </span>
          <button @click.prevent="e => changeCohort(group, cohort, e)" class="efi-item">
            <span class="efi-item-text"> Users in {{ cohort.name }} </span>
          </button>
          <a @click.prevent="removeCohort(group, cohort)" href="#" class="efi-action efi-action-danger">
            <i class="di-icon-delete"></i>
          </a>
        </div>
      </div>
      <div v-for="(cohortFilter, idx) in group.filters" :key="idx" class="event-filter-item">
        <div class="event-filters-item">
          <span class="efi-group">
            <button v-if="!idx" disabled>who</button>
            <button v-else-if="group.isAndFilters" @click.prevent="toggleGroupFilterOperator(group)">
              and
            </button>
            <button v-else @click.prevent="toggleGroupFilterOperator(group)">or</button>
          </span>
          <div class="efi-content">
            <div class="dropdown">
              <a href="#" class="efi-item" data-toggle="dropdown">
                <span class="efi-item-text">
                  {{ MapEventOperatorType[cohortFilter.eventOperator] }}
                </span>
                <span class="di-icon-arrow"></span>
              </a>
              <div class="dropdown-menu">
                <a @click.prevent="cohortFilter.eventOperator = operator" v-for="operator in eventOperatorTypes" :key="operator" href="#" class="dropdown-item">
                  {{ MapEventOperatorType[operator] }}
                </a>
              </div>
            </div>
            <button @click.prevent="e => changeEvent(group, cohortFilter, e)" class="efi-item" type="button">
              <i class="efi-item-icon di-icon-click"></i>
              <span class="efi-item-text">
                {{ cohortFilter.eventName }}
              </span>
            </button>
            <div class="dropdown">
              <button class="efi-item dropdown-toggle" data-toggle="dropdown" type="button">
                <span class="efi-item-text">
                  <template v-if="cohortFilter.aggregationType">
                    {{ MapAggregationType[cohortFilter.aggregationType] }}
                  </template>
                  <template v-else>None</template>
                </span>
              </button>
              <div class="dropdown-menu">
                <vuescroll>
                  <div style="max-height: 300px">
                    <a @click.prevent="cohortFilter.aggregationType = agg" v-for="agg in aggregationTypes" :key="agg" href="#" class="dropdown-item">
                      {{ MapAggregationType[agg] }}
                    </a>
                  </div>
                </vuescroll>
              </div>
            </div>
            <div class="dropdown">
              <DiDropdown
                class="dropdown-operator"
                labelProps="displayName"
                valueProps="id"
                :appendAtRoot="true"
                :id="`${id}-${groupIndex}-${idx}-operator`"
                :data="operatorOptions"
                v-model="cohortFilter.operator"
              />
            </div>
            <span v-if="isSingleValue(cohortFilter)" class="efi-item">
              <input v-model="cohortFilter.value" type="text" class="efi-item-input" placeholder="value" />
            </span>
            <template v-else-if="isRangeValue(cohortFilter)">
              <span class="efi-item">
                <input v-model="cohortFilter.rangeValue.from" type="text" class="efi-item-input" />
              </span>
              <span class="efi-item">
                <span class="text-muted">and</span>
              </span>
              <span class="efi-item">
                <input v-model="cohortFilter.rangeValue.to" type="text" class="efi-item-input" />
              </span>
            </template>
            <span class="efi-item">
              <DiCalendar
                @onCalendarSelected="v => onCalendarSelected(cohortFilter, v)"
                class="date-range-dropdown btn-ghost"
                :id="`di-calendar-${idx}`"
                :isShowResetFilterButton="false"
                :mainDateFilterMode="DateMode"
                :modeOptions="DateRangeOptions"
                :getDateRangeByMode="getDateRangeByMode"
                :defaultDateRange="cohortFilter.dateRange"
                dateFormatPattern="MMM D, YYYY"
              >
              </DiCalendar>
            </span>
          </div>
          <a @click.prevent="removeFilter(group, cohortFilter)" href="#" class="efi-action efi-action-danger">
            <i class="di-icon-delete"></i>
          </a>
        </div>
      </div>
      <div class="event-filters-item">
        <span v-if="group.cohorts.length + group.filters.length > 0" class="efi-group"></span>
        <DiButton @click.prevent="e => addFilter(e, group)" id="efc-add" title="Filter">
          <i class="di-icon-add"></i>
        </DiButton>
      </div>
      <div v-if="value[groupIndex + 1]" class="event-filter-group-action cursor-pointer" @click.prevent="toggleGroupNextOperator(group)">
        <a href="#">
          <template v-if="group.isAndWithNext">AND</template>
          <template v-else>OR</template>
        </a>
      </div>
    </div>
    <div class="event-filters-item mt-3 mb-1">
      <DiButton v-if="value.length > 0" @click.prevent="quickAddFilter" id="efc-add" title="Group Filter">
        <i class="di-icon-add"></i>
      </DiButton>
      <DiButton v-else @click.prevent="quickAddFilter" id="efc-add" title="Filter">
        <i class="di-icon-add"></i>
      </DiButton>
      <template v-if="!hideSaveActions && value.length">
        <button @click.prevent="clearAll" class="btn btn-secondary mr-2 ml-auto">
          Clear All
        </button>
        <button @click.prevent="save" class="btn btn-primary">
          Save
        </button>
      </template>
    </div>
    <SelectStepPopover ref="selectStepPopover"></SelectStepPopover>
  </div>
</template>
<script src="./CohortFilterComponent.ts" lang="ts"></script>
<style lang="scss" scoped>
//@import '~@/themes/scss/di-variables.scss';
$spacing: 6px;
$padding: 16px;
.input-group {
  //.form-control,
  .input-group-text {
    width: 30px;
    background-color: var(--input-background-color);
  }
}

.event-filters-container {
  display: flex;
  flex-direction: column;
  position: relative;

  &.disabled {
    opacity: 0.7;

    &::after {
      content: '';
      display: block;
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      z-index: 1;
      background: transparent;
    }
  }

  .event-filter-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
    align-items: flex-start;
    border-radius: 4px;
    border: solid 2px #d6d6d6;
    padding: 12px $padding;
    position: relative;

    .event-filter-group-action {
      display: flex;
      align-items: flex-start;
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translate(-50%, 50%);
      padding: 0 10px;
      border-radius: 4px;
      background: #000;
      color: #fff;
      z-index: 1;
      height: 22px;
      font-weight: 500;

      a {
        text-decoration: none;
        color: #fff;
      }
    }

    &.event-filter-group-and {
      margin-bottom: -2px;
    }

    &.event-filter-group-or {
      margin-bottom: 33px;

      .event-filter-group-action {
        bottom: -18px;
        background: var(--active-color);

        a {
          color: var(--text-color);
        }
      }
    }
  }

  .event-filters-item {
    display: flex;
    //flex-wrap: wrap;
    //margin-bottom: 8px;
    align-items: flex-start;

    .dropdown {
      display: inline-block;
    }

    & + .event-filters-item {
      margin-top: 8px;
    }
  }

  .efi {
    &-group,
    &-item,
    &-action {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      text-decoration: none;
      border: none;
      background: none;
      margin: 4px 10px 4px 0;
    }

    &-content {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      flex-wrap: wrap;

      .efi-item {
        white-space: nowrap;
      }
    }

    &-group {
      font-weight: 500;
      width: 70px;
      padding: 0 4px 0 0;
      justify-content: flex-end;
      cursor: default;

      button {
        border: none;
        background: none;
        padding: 4px 12px;
        border-radius: 4px;
        text-decoration: none;
        min-height: 30px;
        font-weight: 500;

        &:not(:disabled):hover {
          background: var(--active-color);
        }
      }
    }

    &-item {
      background-color: var(--active-color);
      padding: 4px 12px;
      border-radius: 4px;
      min-height: 30px;
      //margin-right: 8px;
      text-decoration: none;

      &-input {
        background: none;
        border: none;
        width: 60px;
        font-weight: 500;
      }
    }

    &-action {
      font-size: 18px;
      padding: 0 8px;
      color: var(--text-color);
      margin-right: 0;

      &:hover {
        background-color: #fafafb;
        border-radius: 4px;
      }

      &-danger {
        &:hover {
          color: var(--danger);
        }
      }
    }

    &-item-icon {
      margin-right: 8px;
    }

    &-event-icon {
      display: inline-block;
      width: 16px;
      height: 16px;
      opacity: 0.1;
      border-radius: 4px;
      background-color: var(--accent);
    }

    &-item-text {
      color: var(--text-color);
      font-weight: 500;
    }
  }

  ::v-deep .di-calendar-input-container .input-calendar {
    height: auto !important;
  }
}

.dropdown-menu-events {
  width: 320px;
  padding: 0;
}

.input-group-filter {
  padding: $padding $padding 0 $padding;
}

.list-events {
  list-style: none;
  padding: 0;
  margin-bottom: 16px !important;

  &.mb-0 {
    margin-bottom: 0px !important;
  }

  li {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 #{$padding/2};
    //margin-bottom: 12px;
  }

  &-item {
    display: flex;
    align-items: center;
    width: 100%;
    color: var(--text-color);
    text-decoration: none;
    padding: #{$padding/2};

    [class^='di-icon-'] {
      width: 16px;
      display: inline-block;
      font-size: 16px;
      margin-right: 8px;
    }

    //&:before {
    //  content: '';
    //  display: inline-block;
    //  width: 16px;
    //  height: 16px;
    //  opacity: 0.1;
    //  border-radius: 4px;
    //  background-color: var(--accent);
    //  margin-right: 8px;
    //}
    &:hover {
      background-color: var(--input-background-color);
      border-radius: 4px;
    }
  }

  &-title {
    font-weight: 500;
    text-transform: uppercase;
    padding: #{$padding/2} $padding !important;
    margin-top: $padding / 2;
    position: sticky;
    width: 100%;
    top: 0;
    background: var(--white);
  }
}

.event-tabs {
  display: flex;
  //width: calc(100% + #{$padding * 2});
  margin: $padding 0 0;

  &-item {
    min-height: 22px;
    flex: 1;
    display: flex;
    justify-content: center;
    border-bottom: 1px solid var(--grid-line-color);
    color: var(--text-color);
    font-weight: 500;
    text-decoration: none;

    &.active,
    &:hover {
      color: var(--accent);
      border-color: var(--accent);
    }
  }
}
</style>

<style lang="scss">
.dropdown {
  .dropdown-operator {
    margin-top: 0;
    margin-right: 8px;

    button {
      background: var(--active-color) !important;
      .dropdown-input-placeholder {
        font-weight: 500;
        color: var(--text-color);
      }
      //border: none !important;
      > div {
        height: 28px !important;
        width: 130px;
      }
    }
  }
}
</style>
