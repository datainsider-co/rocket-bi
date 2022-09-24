<template>
  <div class="d-flex justify-content-between align-items-center">
    <div class="title-container">
      <i class="icon" :class="iconClass"></i>
      <span class="title">{{ title }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Routers } from '@/shared';
import DatabaseWarehouseIcon from '@/shared/components/Icon/DataWarehouseIcon.vue';
import DataWarehouseIcon from '@/shared/components/Icon/DataWarehouseIcon.vue';
@Component({
  components: { DataWarehouseIcon, DatabaseIcon: DatabaseWarehouseIcon }
})
export default class DataManagementHeader extends Vue {
  @Prop({ type: String, default: 'di-icon-schema' })
  iconClass!: string;

  @Prop({ type: String, default: 'Schema' })
  title!: string;
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.title-container {
  display: flex;
  .icon {
    font-size: 24px;
    margin-right: 16px;
  }
  .title {
    @include regular-text();
    font-size: 24px;
    font-weight: 500;
  }
}
</style>
