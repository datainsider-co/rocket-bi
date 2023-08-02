<template>
  <BModal
    id="source-selection"
    centered
    class="rounded"
    size="xl"
    cancel-disabled
    :no-close-on-backdrop="!allowClickBackDrop"
    :no-close-on-esc="!allowClickBackDrop"
    hide-footer
    hide-header
    v-model="isShow"
  >
    <template #default>
      <div class="header">
        <div class="title">Setup <span>DataSource</span></div>
        <div class="sub-title">
          To get started, you need to give us access to your DataSource.<br />
          Follow the simple steps to complete your setup.
        </div>
      </div>
      <div class="body">
        <div class="data-source-item" @click="handleClickSource(DataSourceTypes.Bigquery)">
          <img src="@/assets/icon/data_ingestion/datasource/source_selection_modal/bigquery_source.svg" alt="" height="74" width="231" />
        </div>
        <div class="data-source-item" @click="handleClickSource(DataSourceTypes.Clickhouse)">
          <img src="@/assets/icon/data_ingestion/datasource/source_selection_modal/clickhouse_source.svg" alt="" />
        </div>
        <div class="data-source-item" @click="handleClickSource(DataSourceTypes.MySQL)">
          <img src="@/assets/icon/data_ingestion/datasource/source_selection_modal/mysql_source.svg" alt="" height="94" width="231" />
        </div>
        <div class="data-source-item" @click="handleClickSource(DataSourceTypes.Vertica)">
          <img src="@/assets/icon/data_ingestion/datasource/source_selection_modal/vertica_source.svg" alt="" height="94" width="231" />
        </div>
      </div>
    </template>
  </BModal>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import VisualizationItem from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizationItem.vue';
import { DataSource, DataSourceType } from '@core/clickhouse-config';
import { Log } from '@core/utils';

@Component({
  components: { VisualizationItem }
})
export default class SourceSelectionModal extends Vue {
  private readonly DataSourceTypes = DataSourceType;
  private isShow = false;
  private allowClickBackDrop = false;
  private callback: ((source: DataSource) => void) | null = null;

  show(onClick: (source: DataSource) => void, allowClickBackDrop?: boolean) {
    this.reset();
    this.init(onClick);
    this.allowClickBackDrop = allowClickBackDrop || false;
    this.isShow = true;
  }

  hide() {
    this.isShow = false;
    this.reset();
  }

  private reset() {
    this.callback = null;
    this.allowClickBackDrop = false;
  }

  private init(onClick: (source: DataSource) => void) {
    this.callback = onClick;
  }

  private handleClickSource(type: DataSourceType) {
    const defaultSource = DataSource.default(type);
    Log.debug('handleClickSource', defaultSource);
    this.callback ? this.callback(defaultSource) : null;
    this.hide();
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

#source-selection {
  .modal-body {
    padding: 82px 63px;
    background-color: #e5f4ff;
    border-radius: 4px;
  }

  .header {
    @include regular-text();
    letter-spacing: 0.2px;
    text-align: center;

    .title {
      font-size: 36px;
      font-weight: 400;
      line-height: 47.52px;

      span {
        color: var(--accent);
      }
    }

    .sub-title {
      font-size: 18px;
      color: var(--secondary-text-color);
    }

    .title + .sub-title {
      margin-top: 8px;
    }
  }

  .header + .body {
    margin-top: 34px;
  }

  .body {
    display: grid;
    padding: 56px 28px;
    grid-template-columns: auto;
    gap: 37px;
    border-radius: 4px;
    background-color: var(--white);
    box-shadow: 7.33624px 7.33624px 36.6812px rgba(0, 50, 125, 0.15);

    @media screen and (min-width: 1000px) {
      grid-template-columns: auto auto;
      .data-source-item {
        width: 282px;
      }
    }

    .data-source-item {
      width: 100%;
      height: 184px;
      background-color: #f2f5f8;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      border-radius: 4px;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      img {
        object-fit: cover;
      }

      &:hover {
        background: #e5f4ff;
        //border: 1px solid #e3edff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
        border-radius: 4px;
      }
    }
  }
}
</style>
