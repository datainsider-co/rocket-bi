<template>
  <div class="detail-file">
    <header>
      <span
        >Show <strong>{{ actualSize }}</strong> of {{ maxSize }} bytes</span
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

    <div class="detail-file--text">
      <vuescroll>
        <div class="file-content">
          <template v-for="(text, index) in tableData">
            <p :key="index">
              <samp>{{ text }}</samp>
            </p>
          </template>
        </div>
      </vuescroll>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { FileBrowserService, FileInfo, ReadFileResponse } from '@core/LakeHouse';
import { ContextMenuItem, DefaultPaging } from '@/shared';
import LakeSQLQueryComponent from '@/screens/LakeHouse/Components/QueryBuilder/LakeSQLQueryComponent';
import { Inject } from 'typescript-ioc';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import { Pagination } from '@/shared/models';
import { Log } from '@core/utils';
import { DIException } from '@core/domain';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import ContextMenu from '@/shared/components/ContextMenu.vue';

@Component({ components: { ListingFooter, ContextMenu } })
export default class TextFile extends Vue {
  @Prop({ required: true, type: String })
  private readonly path!: string;

  private response: ReadFileResponse | null = null;

  private size = this.calculatedSize(DefaultPaging.DefaultLakePageSize);

  private readonly DEFAULT_PAGING_SIZE = DefaultPaging.DefaultLakePageSize;
  @Inject
  private readonly fileBrowserService!: FileBrowserService;
  @Ref()
  private readonly contextMenu!: ContextMenu;

  @Ref()
  private readonly footer?: ListingFooter;
  private get actualSize() {
    if (this.size < this.maxSize) {
      return this.size;
    } else {
      return this.maxSize;
    }
  }

  private get maxSize() {
    return this.response?.total ?? 2048;
  }

  private get total(): number {
    return this.maxSize / LakeSQLQueryComponent.BytesPerRow;
  }

  private get enablePagination(): boolean {
    return this.actualSize <= this.maxSize;
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

  private get tableData() {
    Log.debug('data::', this.response);
    return this.response?.data ?? [];
  }

  async readFile(path: string, from: number, size: number) {
    Log.debug('readFile::', path, from, size);
    this.response = await this.fileBrowserService.viewFile(path, from, size);
    Log.debug('readFile::', this.response);
  }

  async handleLoadFile(path: string) {
    try {
      this.showUpdating();
      this.size = this.calculatedSize(DefaultPaging.DefaultLakePageSize);
      await this.readFile(path, 0, this.size);
      this.showLoadSuccess();
    } catch (ex) {
      Log.error('handleLoadFile::', ex);
      const exception = DIException.fromObject(ex);
      this.showError(exception);
    }
  }

  mounted() {
    this.handleLoadFile(this.path);
  }

  private calculatedSize(size: number) {
    return LakeSQLQueryComponent.BytesPerRow * size; // byte per read
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showUpdating();
      this.size = this.calculatedSize(pagination.size);
      const from = (pagination.page - 1) * this.size;
      await this.readFile(this.path, from, this.size);
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

  private handleClickMore(event: MouseEvent) {
    const newEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'detail-file-see-more', 16, 8);
    this.contextMenu.show(newEvent, this.seeMoreOptions);
  }

  private showUpdating() {
    this.$emit('onUpdating');
  }

  private showLoading() {
    this.$emit('onLoading');
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
