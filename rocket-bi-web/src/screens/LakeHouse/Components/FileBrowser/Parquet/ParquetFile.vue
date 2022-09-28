<template>
  <div class="detail-file">
    <header>
      <span
        >Show <strong>{{ actualSize }}</strong> of {{ total }} rows</span
      >
      <div class="detail-file--header-right">
        <ListingFooter
          v-if="enablePagination"
          ref="footer"
          :default-row-per-page="DEFAULT_PAGING_SIZE"
          :hide-total="true"
          :total-rows="total"
          class="di-table-footer"
          @onPageChange="handlePageChange"
        ></ListingFooter>
        <div class="detail-file--header-right-icon-bar">
          <i class="di-icon-reset btn-icon-border icon-button" @click="handleRefresh"></i>
          <i id="detail-file-see-more" class="di-icon-three-dot-horizontal btn-icon-border icon-button" @click="handleClickMore"></i>
        </div>
        <ContextMenu
          id="detail-properties-context"
          ref="contextMenu"
          :ignore-outside-class="['di-icon-three-dot-horizontal']"
          minWidth="168px"
          textColor="var(--text-color)"
        />
      </div>
    </header>
    <ParquetTable :response="response" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { FileBrowserService, ParquetTableResponse } from '@core/LakeHouse';
import { ContextMenuItem, DefaultPaging } from '@/shared';
import ParquetTable from '@/screens/LakeHouse/Components/FileBrowser/Parquet/ParquetTable.vue';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { Pagination } from '@/shared/models';
import { Log } from '@core/utils';
import { DIException } from '@core/domain';
import { Inject } from 'typescript-ioc';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';

@Component({ components: { ListingFooter, ParquetTable, ContextMenu } })
export default class ParquetFile extends Vue {
  @Prop({ required: true, type: String })
  private readonly path!: string;

  private response: ParquetTableResponse | null = null;

  private size = DefaultPaging.DefaultLakePageSize;

  private readonly DEFAULT_PAGING_SIZE = DefaultPaging.DefaultLakePageSize;

  @Inject
  private readonly fileBrowserService!: FileBrowserService;

  @Ref()
  private readonly contextMenu!: ContextMenu;

  @Ref()
  private readonly footer?: ListingFooter;

  private get actualSize() {
    if (this.size < this.total) {
      return this.size;
    } else {
      return this.total;
    }
  }

  private get total() {
    return this.response?.total ?? 0;
  }

  private get enablePagination(): boolean {
    return this.actualSize <= this.total;
  }

  private get seeMoreOptions(): ContextMenuItem[] {
    return [
      {
        text: 'Rename',
        click: () => {
          this.contextMenu.hide();
          this.$emit('onClickRename');
        }
      },
      {
        text: 'Properties',
        click: () => {
          this.contextMenu.hide();
          this.$emit('onClickProperties');
        }
      },
      {
        text: 'Download',
        click: () => {
          this.contextMenu.hide();
          this.$emit('onClickDownload');
        }
      },
      {
        text: 'Delete',
        click: () => {
          this.contextMenu.hide();
          this.$emit('onClickDelete');
        }
      }
    ];
  }

  mounted() {
    this.handleLoadFile(this.path);
  }

  async readFile(path: string, from: number, size: number) {
    this.response = await this.fileBrowserService.viewParquetFile(path, from, size);
  }

  async handleLoadFile(path: string) {
    try {
      this.showUpdating();
      this.size = DefaultPaging.DefaultLakePageSize;
      await this.readFile(path, 0, this.size);
      this.showLoadSuccess();
    } catch (ex) {
      Log.error('handleLoadFile::', ex);
      const exception = DIException.fromObject(ex);
      this.showError(exception);
    }
  }

  private handleRefresh() {
    try {
      this.footer?.onPageChanged(0);
    } catch (ex) {
      Log.error('handleLoadFile::', ex);
      const exception = DIException.fromObject(ex);
      this.showError(exception);
    }
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showUpdating();
      this.size = pagination.size;
      const from = (pagination.page - 1) * this.size;
      await this.readFile(this.path, from, this.size);
      this.showLoadSuccess();
    } catch (ex) {
      Log.error('handleLoadFile::', ex);
      const exception = DIException.fromObject(ex);
      this.showError(exception);
    }
  }

  private handleClickMore(event: MouseEvent) {
    const newEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'detail-file-see-more', 16, 8);
    this.contextMenu.show(newEvent, this.seeMoreOptions);
  }

  private showUpdating() {
    this.$emit('onUpdating');
  }

  private showLoadSuccess() {
    this.$emit('onLoaded');
  }

  private showError(exception: DIException) {
    this.$emit('onError', exception);
  }
}
</script>

<style lang="scss" src="../file_detail.scss"></style>
