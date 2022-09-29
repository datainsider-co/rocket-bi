<template>
  <div class="table-schema-header">
    <i class="di-icon-table"></i>
    <div class="title">
      Table details - <span>{{ tableName }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class TableTitle extends Vue {
  @Prop({ required: true, type: String })
  tableName!: string;
}
</script>

<style lang="scss">
.table-schema-header {
  display: flex;
  align-items: center;
  i {
    margin-right: 8px;
  }
  .title {
    color: var(--text-color);
    font-size: 14px;
    letter-spacing: 0.12px;
    font-weight: 500;
    span {
      font-weight: normal;
    }
  }
}
</style>
