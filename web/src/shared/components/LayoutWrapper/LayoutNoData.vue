<template>
  <div class="layout-nodata">
    <slot name="icon">
      <i class="layout-nodata-icon" :class="icon"></i>
    </slot>
    <div class="layout-nodata-msg">
      <slot>Nodata found!</slot>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'LayoutNoData'
})
export default class LayoutNoData extends Vue {
  @Prop({ type: String, default: '' })
  private readonly icon!: string;
}
</script>
