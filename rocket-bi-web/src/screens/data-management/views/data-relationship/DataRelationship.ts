/* eslint-disable @typescript-eslint/camelcase */
import { Component, Mixins } from 'vue-property-decorator';
import { Log } from '@core/utils';
import AbstractSchemaComponent from '../AbstractSchemaComponent';
import { DatabaseInfo, TableSchema } from '@core/common/domain';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import { LayoutNoData } from '@/shared/components/layout-wrapper';
import SplitPanelMixin from '@/shared/components/layout-wrapper/SplitPanelMixin';
import { GlobalRelationshipHandler } from '@/screens/dashboard-detail/components/relationship/relationship-handler/GlobalRelationshipHandler';
import RelationshipEditor from '@/screens/dashboard-detail/components/relationship/RelationshipEditor.vue';
import { RelationshipMode } from '@/screens/dashboard-detail/components/relationship/enum/RelationshipMode';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { DatabaseSchemaModule, SchemaReloadMode } from '@/store/modules/data-builder/DatabaseSchemaStore';

const DROP_TYPE = 'drop_table';
const DATA_TRANSFER_KEY = {
  Type: 'type',
  DatabaseName: 'database_name',
  TableName: 'table_name'
};

@Component({
  components: {
    Split,
    SplitArea,
    LayoutNoData,
    RelationshipEditor
  }
})
export default class DataRelationship extends Mixins(AbstractSchemaComponent, SplitPanelMixin) {
  protected isDragging = false;

  protected get globalRelationshipHandler() {
    return new GlobalRelationshipHandler();
  }

  private get panelSize() {
    return this.getPanelSizeHorizontal();
  }

  mounted() {
    this.init();
    _ConfigBuilderStore.setAllowBack(true);
  }

  private async init() {
    await this.loadShortDatabaseInfos?.call(this);
  }

  private get relationshipMode() {
    return RelationshipMode.Edit;
  }

  async beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext<any>) {
    if (await _ConfigBuilderStore.requireConfirmBack()) {
      await next();
    } else {
      next(false);
    }
  }

  private onDragStart(e: DragEvent, database: DatabaseInfo, table: TableSchema) {
    Log.debug('onDragStart');
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.Type, DROP_TYPE);
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.DatabaseName, database.name);
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.TableName, table.name);
    const img = document.createElement('img');
    img.src = '/static/icons/upload@3x.png';
    e.dataTransfer?.setDragImage(img, 10, 10);
    this.isDragging = true;
  }

  private onDragOver(e: DragEvent) {
    Log.debug('onDragOver');
    e.preventDefault();
    // (e.target as HTMLElement).classList.add('active');
  }

  private onDragLeave(e: DragEvent) {
    Log.debug('onDragLeave');
    // (e.target as HTMLElement).classList.remove('active');
  }

  private onDragEnd(e: DragEvent) {
    Log.debug('onDragEnd');
    // (e.target as HTMLElement).classList.remove('active');
    this.isDragging = false;
  }

  protected async onToggleDatabase(dbName: string, isShowing: boolean): Promise<void> {
    if (isShowing) {
      await DatabaseSchemaModule.loadDatabaseInfo({ dbName });
    }
  }

  protected async handleReloadDatabases() {
    if (this.reloadShortDatabaseInfos) {
      await this.reloadShortDatabaseInfos(SchemaReloadMode.OnlyDatabaseHasTable);
    }
  }
}
