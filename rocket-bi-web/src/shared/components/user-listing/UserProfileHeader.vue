<template>
  <div class="user-profile-header-container">
    <div class="user-profile-header-title">
      <div class="regular-icon-16">
        <img alt="User profile" src="@/assets/icon/ic-16-userprofile.svg" />
      </div>
      <span align="center" class="regular-text-24">User profile</span>
    </div>
    <div class="user-profile-header-actions">
      <DiButton :id="genBtnId('clear-filter')" title="Reset filters" class="col-auto" v-if="isHaveFilter" @click="resetFilter">
        <i class="icon-title di-icon-reset"></i>
      </DiButton>
      <APopover placement="bottomRight" trigger="click" v-model="isShowAddFilter">
        <template slot="content">
          <FieldListingSearchable :groupedFields="groupedFields"></FieldListingSearchable>
        </template>
        <DiButton :id="genBtnId('add-filter')" title="Add filter" class="col-auto">
          <i class="di-icon-filter icon-title"></i>
        </DiButton>
      </APopover>
      <APopover placement="bottomRight" trigger="click" v-model="isShowTableActions">
        <template slot="content">
          <TableActionsMenu :items="tableActionsMenuItems"></TableActionsMenu>
        </template>
        <DiButton :id="genBtnId('table-actions')" title="Table actions" class="col-auto">
          <img class="icon-title normal" src="@/assets/icon/ic-16-table-action.svg" alt="Table actions" />
        </DiButton>
      </APopover>
    </div>
    <!-- dialog -->
    <template>
      <EditColumns ref="mdEditColumns" @apply="editColumnsApplied" />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Provide, Ref, Vue } from 'vue-property-decorator';
import { mapState } from 'vuex';
import EditColumns from '@/screens/tracking-profile/components/tracking-profile/EditColumns.vue';
import FieldListingSearchable from '@/shared/components/FieldListingSearchable.vue';
import TableActionsMenu from '@/screens/tracking-profile/components/tracking-profile/TableActionsMenu.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import { ListUtils } from '@/utils';
import { ContextMenuItem, GroupedField, Stores, TableActionsMenuItem } from '@/shared';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { ProfileModule } from '@/screens/tracking-profile/store/ProfileStore';
import { GroupFieldBuilder } from '@core/schema/service/GroupFieldBuilder';
import { DateFieldFilter, NumberFieldFilter, TextFieldFilter } from '@core/schema/service/FieldFilter';
import { IdGenerator } from '@/utils/IdGenerator';

@Component({
  components: {
    FieldListingSearchable,
    EditColumns,
    DiButton,
    TableActionsMenu
  },
  computed: {
    ...mapState(Stores.profileStore, ['configColumns'])
  }
})
export default class UserProfileHeader extends Vue {
  // State
  private readonly configColumns!: FieldDetailInfo[];

  @Prop({ required: true, type: Boolean, default: true })
  private readonly isHaveFilter!: boolean;

  @Ref()
  private readonly mdEditColumns!: EditColumns;

  private isShowTableActions = false;
  private isShowAddFilter = false;

  constructor() {
    super();
  }

  get tableActionsMenuItems(): ContextMenuItem[] {
    return [
      {
        text: TableActionsMenuItem.ExportAsCSV,
        click: () => {
          this.hideSelectionActions();
          this.exportCsv();
        }
      },
      {
        text: TableActionsMenuItem.EditColumns,
        click: () => {
          this.hideSelectionActions();
          this.editColumns();
        }
      }
    ];
  }

  private get groupedFields(): GroupedField[] {
    if (ListUtils.isEmpty(this.configColumns)) {
      return [];
    } else {
      return new GroupFieldBuilder(this.configColumns)
        .addFilter(new NumberFieldFilter())
        .addFilter(new DateFieldFilter())
        .addFilter(new TextFieldFilter())
        .build();
    }
  }

  editColumns() {
    this.mdEditColumns.showDialog();
  }

  exportCsv() {
    ProfileModule.exportProfileAsCSV();
  }

  @Emit('configColumnsChanged')
  editColumnsApplied(value: FieldDetailInfo[]) {
    return value;
  }

  @Emit('resetFilter')
  resetFilter() {
    return [];
  }

  @Provide('handleHideListing')
  private hideAddFilter() {
    this.isShowAddFilter = false;
  }

  private hideSelectionActions() {
    this.isShowTableActions = false;
  }
}
</script>

<style lang="scss">
.ant-popover-inner {
  background-color: var(--primary);
  border-radius: 4px;
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.16), 0 4px 4px 0 rgba(0, 0, 0, 0.16);
}

.ant-popover-placement-bottom,
.ant-popover-placement-bottomLeft,
.ant-popover-placement-bottomRight {
  padding-top: 5px;
}

.ant-popover-arrow {
  display: none;
}

.ant-popover-inner-content {
  padding: 0px;
}
</style>

<style lang="scss" scoped>
.user-profile-header-container {
  display: flex;
  flex-direction: row;
  flex-flow: wrap;
  @media (max-width: 582px) {
    padding-bottom: 64px;
  }
}

.user-profile-header-title {
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-grow: 2;
  justify-content: flex-start;
  order: 0;
}

.user-profile-header-actions {
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  order: 1;
  @media (max-width: 583px) {
    margin-left: auto !important;
  }

  .di-button {
    img {
      opacity: var(--normal-opacity);
    }

    img.normal {
      opacity: var(--active-opacity);
    }

    &:hover {
      img {
        opacity: var(--active-opacity);
      }
    }
  }
}

.field-listing-searchable {
  background-color: var(--primary);
  border-radius: 4px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
  box-sizing: content-box;
  max-width: unset;
  padding: 16px;
  width: 311px;

  ::v-deep {
    .arrow {
      display: none;
    }

    .popover-body {
      padding: 0 !important;
    }
  }
}

.table-actions-menu {
  background-color: var(--primary);
  border-radius: 4px;
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.16), 0 4px 4px 0 rgba(0, 0, 0, 0.16);

  ::v-deep {
    .arrow {
      display: none;
    }

    .popover-body {
      padding: 0 !important;
    }
  }
}

.field-listing-area {
  padding: 16px;
  width: 300px;
}
</style>
