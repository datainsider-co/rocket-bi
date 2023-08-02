<template>
  <div class="h-100 w-100" style="background-color: var(--chart-background-color);">
    <EmptyWidget v-if="widget.isEmpty" />
    <ErrorWidget v-else-if="isLoadImageError" hide-retry error="Something went wrong"></ErrorWidget>
    <div v-show="!isLoadImageError && !widget.isEmpty" class="image-view rounded">
      <img :src="getImage" @error="handleOnError" @load="handleOnLoad" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ImageWidget } from '@core/common/domain/model';
import ErrorWidget from '@/shared/components/ErrorWidget.vue';
import EmptyWidget from '@/screens/dashboard-detail/components/widget-container/charts/error-display/EmptyWidget.vue';

@Component({
  components: {
    EmptyWidget,
    ErrorWidget
  }
})
export default class ImageViewer extends Vue {
  isLoadImageError = false;

  @Prop({ required: true })
  widget!: ImageWidget;

  get getImage(): string {
    return this.widget.url;
  }

  private handleOnLoad() {
    this.isLoadImageError = false;
  }

  private handleOnError() {
    this.isLoadImageError = true;
  }
}
</script>

<style lang="scss" scoped>
.image-view {
  width: 100%;
  height: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background-size: cover;
  }
}
</style>
