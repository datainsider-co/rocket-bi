<template>
  <PopoverV2 ref="popover" @hidden="reset" class="selection-popover position-absolute" auto-hide>
    <template #menu>
      <div class="dropdown-menu dropdown-menu-events">
        <div @click.stop class="input-group input-group-filter">
          <div class="input-group-prepend">
            <span class="input-group-text px-2">
              <i class="fa fa-search"></i>
            </span>
          </div>
          <input v-model.trim="keyword" type="text" placeholder="Search..." class="form-control" autofocus />
        </div>
        <template v-if="isShowTab">
          <div class="selection-tabs">
            <a
              @click.prevent.stop="selectTab(tab)"
              v-for="tab in tabs"
              :key="tab.id"
              class="selection-tabs-item text-uppercase"
              :class="{ active: value === tab.id }"
              href="#"
              >{{ tab.displayName }}</a
            >
          </div>
        </template>

        <vuescroll class="selection-scroll-area">
          <div class="list-select-option-panel">
            <slot :name="value" :keyword="keyword"></slot>
          </div>
        </vuescroll>
      </div>
    </template>
  </PopoverV2>
</template>
<script lang="ts">
import { Component, Emit, Model, Prop, Ref, Vue } from 'vue-property-decorator';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';
import { SelectOption } from '@/shared';

@Component({
  components: {
    PopoverV2
  }
})
export default class SelectionPopover extends Vue {
  private keyword = '';

  private get isShowTab() {
    return this.tabs.length > 1;
  }

  @Prop({ required: true, type: Array, default: () => [] })
  private readonly tabs!: SelectOption[];

  @Model('change', { required: false, type: String, default: '' })
  private value!: string;

  @Ref()
  private readonly popover!: PopoverV2;

  show(target: HTMLElement) {
    this.popover.showPopover(target);
  }

  hide() {
    this.popover.hidePopover();
  }

  @Emit('hidden')
  reset(event: Event) {
    this.keyword = '';
    return event;
  }

  @Emit('change')
  private selectTab(tab: SelectOption) {
    return tab.id;
  }
}
</script>
<style lang="scss">
.selection-popover {
  $padding: 16px;

  .dropdown-menu-events {
    width: 320px;
    padding: 0;
  }

  .input-group-filter {
    padding: $padding $padding 0 $padding;
  }

  .selection-tabs {
    display: flex;
    //width: calc(100% + #{$padding * 2});
    margin: $padding 0 0;

    &-item {
      min-height: 22px;
      flex: 1;
      display: flex;
      justify-content: center;
      border-bottom: 1px solid var(--grid-line-color);
      color: var(--text-color);
      font-weight: 500;
      text-decoration: none;

      &.active,
      &:hover {
        color: var(--accent);
        border-color: var(--accent);
      }
    }
  }

  .selection-scroll-area {
    padding-top: 8px !important;

    .list-select-option-panel {
      display: flex;
      flex-direction: column;
      max-height: 340px;
    }
  }
}
</style>
