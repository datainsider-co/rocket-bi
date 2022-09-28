<template>
  <div class="detail-file">
    <header>
      <div class="detail-file--header-right">
        <div class="detail-file--header-right-icon-bar">
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
    <video class="detail-file--video" controls>
      <source :src="videoUrl" :type="fileInfo.contentType" />
      Your browser does not support the video.
    </video>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { FileInfo } from '@core/LakeHouse';
import { UrlUtils } from '@core/utils';
import { ContextMenuItem } from '@/shared';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import ContextMenu from '@/shared/components/ContextMenu.vue';

@Component({ components: { ContextMenu } })
export default class VideoFile extends Vue {
  @Prop({ required: true, type: Object })
  private readonly fileInfo!: FileInfo;

  @Prop({ required: true, type: String })
  private readonly path!: string;
  @Ref()
  private readonly contextMenu!: ContextMenu;

  private get videoUrl() {
    return UrlUtils.getFullMediaUrl(this.path);
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

  private handleClickMore(event: MouseEvent) {
    const newEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'detail-file-see-more', 16, 8);
    this.contextMenu.show(newEvent, this.seeMoreOptions);
  }
}
</script>

<style lang="scss" src="../file_detail.scss"></style>
