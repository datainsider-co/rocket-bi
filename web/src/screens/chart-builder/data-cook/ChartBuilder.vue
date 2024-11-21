<template>
  <div class="h-100 w-100 d-inline-block">
    <div class="data-builder">
      <div class="d-flex flex-row data-builder-body">
        <DatabaseListing :isDragging.sync="isDragging" class="col-3 database-panel" :showSelectDatabase="true" :mode="DatabaseListingMode.None">
          <template #database-selector>
            <label class="database-listing-title text-left unselectable d-flex align-items-center">
              Table & Field
            </label>
          </template>
          <template #header-bar>
            <div class="mt-2"></div>
          </template>
        </DatabaseListing>
        <div class="col-4">
          <div class="config-filter-area h-100">
            <ConfigBuilder
              ref="configBuilder"
              :isDragging="isDragging"
              :showHeader="false"
              class="col-12 config-panel"
              @onQuerySettingChanged="onQuerySettingChanged"
            />
          </div>
        </div>
        <VizPanel ref="vizPanel" class="col-5 visualization-panel" :show-setting="false"></VizPanel>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ChartBuilder.ts"></script>
<style lang="scss" scoped src="./ChartBuilder.scss"></style>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

body,
html,
#app {
  height: 100% !important;
}

.data-builder {
  .data-builder-body {
    .database-listing {
      .database-selector {
        justify-content: space-between;

        .database-listing-title {
          @include medium-text();
          font-weight: var(--builder-font-weight);
          margin: 0;
          height: 34px;
        }
      }
    }
  }
}
</style>
