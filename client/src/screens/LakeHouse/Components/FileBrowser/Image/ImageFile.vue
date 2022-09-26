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
    <div class="h-100 w-100 d-flex align-items-center justify-content-center">
      <img :src="imageUrl" :alt="fileInfo.name" class="img-fluid mh-100 mw-100" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { FileInfo } from '@core/LakeHouse';
import { UrlUtils } from '@core/utils';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { ContextMenuItem } from '@/shared';

@Component({ components: { ContextMenu } })
export default class ImageFile extends Vue {
  @Prop({ required: true, type: Object })
  private readonly fileInfo!: FileInfo;
  @Prop({ required: true, type: String })
  private readonly path!: string;

  @Ref()
  private readonly contextMenu!: ContextMenu;

  private get imageUrl() {
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

<style lang="scss" src="../file_detail.scss" />
