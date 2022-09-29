<template>
  <div class="image-view rounded" :style="{ backgroundImage: `url(${getImage}` }" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ImageWidget } from '@core/common/domain/model';
import { UrlUtils } from '@core/utils';

@Component
export default class ImageViewer extends Vue {
  @Prop({ required: true })
  widget!: ImageWidget;

  get getImage(): string {
    return UrlUtils.getFullUrl(this.widget.url);
  }
}
</script>

<style lang="scss" scoped>
.image-view {
  object-fit: cover;
  background-size: cover;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
}
</style>
