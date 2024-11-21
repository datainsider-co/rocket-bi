<template>
  <div class="image-viewer">
    <EmptyWidget v-if="widget.isEmpty" />
    <ErrorWidget v-else-if="isLoadImageError" hide-retry error="Something went wrong"></ErrorWidget>
    <div v-show="!isLoadImageError && !widget.isEmpty" class="image-viewer--preview" v-loading="isLoading">
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
  isLoading = true;

  @Prop({ required: true })
  protected readonly widget!: ImageWidget;

  get getImage(): string {
    return this.widget.url;
  }

  private handleOnLoad() {
    this.isLoadImageError = false;
    this.isLoading = false;
  }

  private handleOnError() {
    this.isLoadImageError = true;
    this.isLoading = false;
  }
}
</script>

<style lang="scss">
.image-viewer {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;

  &--preview {
    width: 100%;
    height: 100%;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-size: cover;
    }
  }
}
</style>
