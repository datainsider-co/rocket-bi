<template>
  <BModal id="view-properties-modal" ref="modal" centered hide-footer size="sm" static @bv::modal::hidden="handleOnHidden">
    <template #modal-header="{close}">
      <h6 class="modal-title">File properties</h6>
      <div @click="close">
        <CloseIcon class="icon-close btn-icon-border"></CloseIcon>
      </div>
    </template>
    <template #default>
      <StatusWidget :error="msg" :status="status" @retry="handleLoadProperties(path)">
        <template #default>
          <div class="properties-content">
            <vuescroll>
              <div class="file-property">
                <label>File Name</label>
                <p>{{ fileInfo.name }}</p>
              </div>
              <div class="file-property">
                <label>File size</label>
                <p>{{ displayByteFormat(fileInfo.sizeInByte) }}</p>
              </div>
              <div class="file-property">
                <label>Last Modify</label>
                <p>{{ lastModify(fileInfo.date) }}</p>
              </div>
              <div class="file-property">
                <label>Group</label>
                <p>{{ fileInfo.group }}</p>
              </div>
              <div class="file-property">
                <label>Permission</label>
                <p>{{ fileInfo.permission }}</p>
              </div>
              <div class="file-property">
                <label>Creator</label>
                <p>{{ fileInfo.creator }}</p>
              </div>
              <div class="file-property">
                <label>Location</label>
                <p>{{ path }}</p>
              </div>
            </vuescroll>
          </div>
        </template>
      </StatusWidget>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { BModal } from 'bootstrap-vue';
import { Log } from '@core/utils';
import { FileInfo } from '@core/LakeHouse/Domain';
import { Status } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { FileBrowserService } from '@core/LakeHouse/Service';
import { Inject } from 'typescript-ioc';
import { DateUtils, DateTimeFormatter } from '@/utils';
import { StringUtils } from '@/utils/string.utils';

@Component({
  components: { StatusWidget }
})
export default class ViewPropertiesModal extends Vue {
  private path: string | null = null;
  private fileInfo: FileInfo | null = null;
  private status = Status.Loading;
  private msg: string | null = null;
  @Ref()
  private readonly modal!: BModal;

  @Inject
  private readonly fileBrowserService!: FileBrowserService;

  private lastModify(date: any) {
    return DateTimeFormatter.formatAsMMMDDYYYHHmmss(date);
  }

  private displayByteFormat(bytes: number): string {
    return StringUtils.formatByteToDisplay(bytes);
  }

  show(path: string) {
    this.handleLoadProperties(path);
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }

  private handleOnHidden() {
    this.path = null;
    this.fileInfo = null;
    this.status = Status.Loading;
    this.msg = null;
  }

  private async handleLoadProperties(path: string): Promise<void> {
    try {
      this.status = Status.Loading;
      this.path = path;
      this.fileInfo = await this.loadFileInfo(path);
      this.status = Status.Loaded;
    } catch (ex) {
      Log.error('Load properties failed case', ex.message);
      this.status = Status.Error;
      this.msg = ex.message;
    }
  }

  private async loadFileInfo(path: string): Promise<FileInfo> {
    const response = await this.fileBrowserService.getPathFullInfo(path);
    return response.data;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

#view-properties-modal {
  .modal-sm {
    max-width: 382px;
    width: 382px;
  }

  .modal-content {
    background: var(--primary) !important;
  }

  .icon-close {
    height: 24px;
    padding: 2px;
    width: 24px;
  }

  .modal-title {
    color: var(--secondary-text-color);
    cursor: default;
    font-size: 24px;
    letter-spacing: 0.2px;
    line-height: 1.17;
  }

  .modal-body {
    height: 450px;

    .status-loading {
      background: var(--secondary);
    }

    .properties-content {
      background: var(--secondary);
      border-radius: 4px;
      height: 100%;
      padding: 16px;
      text-align: left;

      .file-property {
        label {
          @include medium-text(14px, 0.23px, var(--text-color));
          line-height: 1.1;
        }

        p {
          color: var(--text-color);
          font-size: 14px;
          letter-spacing: 0.23px;
          line-height: 1;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .file-property + .file-property {
        margin-top: 16px;
      }
    }
  }
}
</style>
