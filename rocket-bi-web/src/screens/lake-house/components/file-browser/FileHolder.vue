<template>
  <div class="h-100 w-100">
    <template v-if="isPdfFile">
      <PdfFile :path="path" @onClickDelete="emitDelete" @onClickProperties="emitProperties" @onClickRename="emitRename" @onClickDownload="emitDownload" />
    </template>
    <template v-else-if="isImageFile">
      <ImageFile
        :file-info="fileInfo"
        :path="path"
        @onClickDelete="emitDelete"
        @onClickProperties="emitProperties"
        @onClickRename="emitRename"
        @onClickDownload="emitDownload"
      />
    </template>
    <template v-else-if="isVideo">
      <VideoFile
        :file-info="fileInfo"
        :path="path"
        @onClickDelete="emitDelete"
        @onClickProperties="emitProperties"
        @onClickRename="emitRename"
        @onClickDownload="emitDownload"
      />
    </template>
    <template v-else-if="isParquetFile">
      <ParquetFile
        :path="path"
        @onClickDelete="emitDelete"
        @onClickProperties="emitProperties"
        @onClickRename="emitRename"
        @onError="emitError"
        @onLoaded="emitLoaded"
        @onLoading="emitLoading"
        @onUpdating="emitUpdating"
        @onClickDownload="emitDownload"
      />
    </template>
    <template v-else>
      <TextFile
        :path="path"
        @onClickDelete="emitDelete"
        @onClickProperties="emitProperties"
        @onClickRename="emitRename"
        @onError="emitError"
        @onLoaded="emitLoaded"
        @onLoading="emitLoading"
        @onUpdating="emitUpdating"
        @onClickDownload="emitDownload"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { FileInfo } from '@core/lake-house';
import ParquetFile from '@/screens/lake-house/components/file-browser/parquet/ParquetFile.vue';
import TextFile from '@/screens/lake-house/components/file-browser/text/TextFile.vue';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import ImageFile from '@/screens/lake-house/components/file-browser/image/ImageFile.vue';
import PdfFile from '@/screens/lake-house/components/file-browser/pdf/PdfFile.vue';
import VideoFile from '@/screens/lake-house/components/file-browser/video/VideoFile.vue';

@Component({ components: { ParquetFile, TextFile, ImageFile, PdfFile, VideoFile } })
export default class FileHolder extends Vue {
  @Prop({ required: true, type: Object })
  private fileInfo!: FileInfo;

  @Prop({ required: true, type: String })
  private readonly path!: string;

  private get isParquetFile() {
    return this.fileInfo?.isParquet ?? false;
  }

  private get isPdfFile() {
    return this.fileInfo?.isPdf ?? false;
  }

  private get isImageFile() {
    return this.fileInfo?.isImage ?? false;
  }
  private get isVideo() {
    return this.fileInfo?.isVideo ?? false;
  }

  private emitUpdating() {
    this.$emit('onUpdating');
  }

  private emitLoading() {
    Log.debug('emitLoading');
    this.$emit('onLoading');
  }

  private emitLoaded() {
    Log.debug('emitLoaded');
    this.$emit('onLoaded');
  }

  private emitError(exception: DIException) {
    this.$emit('onError', exception);
  }

  private emitDelete() {
    this.$emit('onClickDelete');
  }

  private emitProperties() {
    this.$emit('onClickProperties');
  }

  private emitRename() {
    this.$emit('onClickRename');
  }

  private emitDownload() {
    this.$emit('onClickDownload');
  }
}
</script>

<style lang="scss" scoped></style>
