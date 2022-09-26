<template>
  <LayoutHeader :title="title" :icon="icon">
    <BreadcrumbComponent :breadcrumbs="breadcrumbs" :max-item="3" />
    <div class="d-flex align-items-center ml-auto">
      <SearchInput
        v-if="enableSearch"
        ref="searchInput"
        :timeBound="500"
        class="search-file-input"
        hint-text="Search file or folder name"
        @onTextChanged="emitSearch"
      />
      <DiIconTextButton v-if="enableRefresh" title="Refresh" @click="emitRefresh">
        <i class="di-icon-reset icon"></i>
      </DiIconTextButton>
      <DiIconTextButton v-if="enableMove" id="move-file" tabindex="-1" title="Move to" @click="emitMove">
        <img alt="" class="ic-16" src="@/assets/icon/ic_move_to.svg" />
      </DiIconTextButton>
      <DiIconTextButton class="mr-0" v-if="enableDelete" :title="deleteTitle" @click="emitDelete">
        <i class="di-icon-delete icon"></i>
      </DiIconTextButton>
      <DiIconTextButton class="d-none" title="Create & query table">
        <i class="di-icon-add icon"></i>
      </DiIconTextButton>
    </div>
  </LayoutHeader>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import { Breadcrumbs } from '@/shared/models';
import SearchInput from '@/shared/components/SearchInput.vue';
import BreadcrumbComponent from '@/screens/Directory/components/BreadcrumbComponent.vue';
import { LayoutHeader } from '@/shared/components/LayoutWrapper';

@Component({ components: { SearchInput, BreadcrumbComponent, LayoutHeader } })
export default class LakeExplorerHeader extends Vue {
  @Prop({ type: Array, default: [] })
  private breadcrumbs!: Breadcrumbs[];

  @Prop({ type: Boolean, default: false })
  private enableMove!: boolean;

  @Prop({ type: Boolean, default: false })
  private enableDelete!: boolean;

  @Prop({ type: Boolean, default: false })
  private enableRefresh!: boolean;

  @Prop({ type: Boolean, default: false })
  private enableSearch!: boolean;

  @Prop({ type: String, default: 'Move to trash' })
  private deleteTitle!: string;

  @Prop({ type: String })
  private title!: string;

  @Prop({ type: String })
  private icon!: string;

  @Ref()
  private readonly searchInput?: SearchInput;

  ///return event and id of button for using context menu
  @Emit('onMove')
  private emitMove(event: Event) {
    return { event: event, id: 'move-file' };
  }

  @Emit('onDelete')
  private emitDelete(event: Event) {
    return event;
  }

  @Emit('onSearch')
  private emitSearch(text: string) {
    return text;
  }

  @Emit('onRefresh')
  private emitRefresh(event: Event) {
    return event;
  }

  resetSearchInput() {
    this.searchInput?.setTextInput('');
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';
@import '~bootstrap/scss/bootstrap-grid';

header {
  > .explorer-header {
    align-items: center;
    display: flex;
    flex: 1;
    font-size: 24px;
    font-stretch: normal;
    font-style: normal;
    font-weight: 500;
    letter-spacing: 0.2px;
    line-height: 1.17;
    overflow: hidden;
  }

  .di-btn-icon-text {
    @include media-breakpoint-down(md) {
      .title {
        display: none;
      }
    }
  }

  .search-file-input {
    width: 200px;
    .form-control {
      padding-right: 0;
    }
  }

  .icon {
    font-size: 16px;
    opacity: 1;
  }

  .btn-icon-text {
    margin-left: 12px;
  }

  > #create-data-source {
    padding: 0;

    &.hide {
      display: none !important;
    }

    &:hover,
    &:active {
      background: unset !important;
    }
  }
}

.icon-action {
  padding: 4px;
}
</style>
