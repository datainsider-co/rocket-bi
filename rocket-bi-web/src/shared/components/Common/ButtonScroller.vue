<template>
  <div class="btn-scroll-container">
    <BreadcrumbIcon class="icon-button btn-scroll" color="var(--accent)" />
    <BreadcrumbIcon class="icon-button btn-scroll" color="var(--accent)" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import BreadcrumbIcon from '@/shared/components/Icon/BreadcrumbIcon.vue';

@Component({ components: { BreadcrumbIcon } })
export default class ButtonScroller extends Vue {
  @Prop({ type: Boolean, default: true })
  showNext!: boolean;

  @Prop({ type: Boolean, default: true })
  showBack!: boolean;
}
</script>

<style lang="scss" scoped>
.btn-scroll-container {
  padding: 4px 10px;
  background: var(--white-half);
  display: flex;
  flex-direction: row;

  .btn-scroll {
    background: var(--white);
    padding: 3px;
    margin-right: 4px;
    transform: rotate(180deg);
    border: 1px solid var(--primary);
    cursor: pointer;
    &:hover {
      background-color: var(--hover-color);
    }

    &:last-child {
      margin-right: 0;
      transform: unset;
    }
  }
}
</style>
