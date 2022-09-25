<template>
  <div class="timeline-item">
    <div class="item-header">
      <span class="dot" />
      <div class="item-content">
        <span class="item-status">{{ item.title }}</span>
        <a class="item-link" :href="item.url">{{ item.urlDisplay }}</a>
      </div>
    </div>
    <div class="item-time" :class="{ 'no-border-left': isLastChild }">
      <span>{{ item.time }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator';

@Component
export default class TimelineItem extends Vue {
  @Prop({
    type: Object,
    required: true,
    default: () => []
  })
  item!: any;

  @Prop({
    type: Boolean,
    required: true,
    default: false
  })
  isLastChild!: boolean;
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.timeline-item {
  position: relative;
  display: flex;
  flex-direction: column;
  .item-header {
    order: 0;
    display: flex;
    flex-direction: row;

    .dot {
      order: 0;
      width: 8px;
      height: 8px;
      margin-top: 4px;
      border: solid 1px var(--success);
      border-radius: 50%;
      align-items: center;
    }

    .item-content {
      order: 1;
      display: flex;
      flex-direction: row;
      margin-left: 16px;
      align-items: center;

      .item-status {
        order: 0;
        @include regular-text;
        opacity: 0.8;
        font-size: 12px;
        letter-spacing: 0.2px;
        text-align: left;
        align-items: center;
      }

      .item-link {
        order: 1;
        @include regular-text;
        opacity: 0.8;
        font-size: 12px;
        letter-spacing: 0.2px;
        color: var(--accent);
        margin-left: 4px;
        text-align: left;
        align-items: center;
      }

      .item-link:hover {
        cursor: pointer;
      }
    }
  }

  .item-time {
    order: 1;
    border-left: 1px solid var(--success);
    padding-bottom: 28px;
    padding-top: 11px;
    margin-left: 4px;
    margin-top: -3px;
    margin-bottom: -4px;

    span {
      @include regular-text;
      opacity: 0.8;
      font-size: 12px;
      letter-spacing: 0.2px;
      text-align: left;
      color: var(--text-color);
      margin-left: 19px;
    }
  }
}

.no-border-left {
  border-left: 0px !important;
}
</style>
