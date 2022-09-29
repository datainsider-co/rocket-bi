<template>
  <div class="table-actions-container">
    <ul>
      <li v-for="item in items" v-bind:key="item.text" @click="item.click">
        <span>{{ item.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ContextMenuItem } from '@/shared';

@Component
export default class TableActionsMenu extends Vue {
  @Prop({
    required: true,
    type: Array,
    default: () => []
  })
  items!: ContextMenuItem[];
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.table-actions-container {
  ul {
    list-style-type: none;
    text-align: start;
    white-space: nowrap;
    padding-inline-start: 0px;
    margin-block-start: 0px;
    margin-block-end: 0px;

    li {
      padding: 16px 102px 15px 16px;
      cursor: pointer;

      span {
        @include regular-text;
        font-size: 14px;
        cursor: pointer;
      }
    }

    li:hover {
      border-radius: 4px;
      background-color: rgba(#000000, 0.2);
      cursor: pointer;

      span {
        @include regular-text;
        font-size: 14px;
        opacity: 0.8 !important;
        cursor: pointer;
      }
    }
  }
}
</style>
