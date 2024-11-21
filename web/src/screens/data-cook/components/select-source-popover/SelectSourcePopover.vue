<template>
  <PopoverV2 ref="popover" :optimize="false">
    <slot></slot>
    <template v-slot:menu>
      <SelectSource
        ref="selectSource"
        @selectTable="selectTable"
        :database-infos="databaseInfos"
        :db-loading-map="dbLoadingMap"
        :loading="loading"
      ></SelectSource>
    </template>
  </PopoverV2>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { DatabaseInfo, TableSchema } from '@core/common/domain';
import SelectSource from '../select-source/SelectSource.vue';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import { DatabaseSchemaModule, SchemaReloadMode } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { Log } from '@core/utils';
import { ListUtils } from '@/utils';

@Component({
  components: {
    PopoverV2,
    SelectSource
  }
})
export default class SelectSourcePopover extends Vue {
  private loading = false;
  private isInited = false;
  @Ref()
  private readonly popover!: PopoverV2;

  protected get databaseInfos(): DatabaseInfo[] {
    return DatabaseSchemaModule.databaseInfos;
  }

  protected get dbLoadingMap(): { [p: string]: boolean } {
    return DatabaseSchemaModule.databaseLoadingMap;
  }

  public hide() {
    if (this.popover) {
      this.popover.hidePopover();
    }
  }

  async show(reference: HTMLElement | null = null): Promise<void> {
    try {
      this.loading = true;
      if (this.popover) {
        this.popover.showPopover(reference);
        await this.initDatabaseInfo();
      }
      this.loading = false;
    } catch (ex) {
      Log.error('SelectSourcePopover -> show', ex);
      this.loading = false;
    }
  }

  protected async initDatabaseInfo(): Promise<void> {
    try {
      if (this.isInited) {
        return;
      }
      this.isInited = true;
      await DatabaseSchemaModule.reloadDatabaseInfos(SchemaReloadMode.OnlyShortDatabaseInfo);
    } catch (ex) {
      this.isInited = false;
      Log.error('SelectSourcePopover -> initDatabaseInfo', ex);
    }
  }

  private selectTable(database: DatabaseInfo, table: TableSchema) {
    this.hide();
    this.$emit('selectTable', database, table);
  }
}
</script>
