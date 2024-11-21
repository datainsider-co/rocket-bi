<template>
  <div :class="scrollClass" v-if="isVirtualScroll">
    <StatusWidget :status="initStatus" :error="errorMsg" @retry.stop="$emit('retry')">
      <slot></slot>
      <!--      <StatusWidget :status="loadMoreStatus"></StatusWidget>-->
    </StatusWidget>
  </div>
  <vuescroll @handle-scroll="handleScroll" v-else>
    <div :class="scrollClass">
      <StatusWidget :status="initStatus" :error="errorMsg" @retry.stop="$emit('retry')">
        <slot></slot>
        <StatusWidget :status="loadMoreStatus"></StatusWidget>
      </StatusWidget>
    </div>
  </vuescroll>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import { Status } from '../enums';
import StatusWidget from '@/shared/components/StatusWidget.vue';

@Component({
  components: {
    StatusWidget
  }
})
export default class DILoadMore extends Vue {
  @Prop({ type: String, default: '' })
  scrollClass!: string;

  @Prop({ type: Boolean, default: false })
  isVirtualScroll!: boolean;

  @Prop({ default: 0.8, type: Number })
  private positionLoadMore!: number;

  @Prop({ required: false, default: Status.Loading })
  private initStatus!: Status;

  @Prop({ required: true, type: Boolean, default: true })
  private canLoadMore!: boolean;

  @PropSync('isLoadMore', { required: false, type: Boolean, default: false })
  private isLoadMoreProp!: boolean;

  @Prop({ required: false, type: String, default: '' })
  private readonly errorMsg!: string;

  private get loadMoreStatus(): Status {
    return this.isLoadMoreProp ? Status.Loading : Status.Loaded;
  }

  handleScroll(vertical: { process: number }) {
    if (this.canLoadMore && !this.isLoadMoreProp) {
      const { process } = vertical;
      if (process > this.positionLoadMore) {
        this.isLoadMoreProp = true;
        this.$emit('onLoadMore');
      }
    }
  }
}
</script>
