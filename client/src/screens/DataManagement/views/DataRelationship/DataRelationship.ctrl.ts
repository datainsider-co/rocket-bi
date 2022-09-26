/* eslint-disable @typescript-eslint/camelcase */
import { Component, Mixins } from 'vue-property-decorator';
import '@/screens/DataIngestion/components/DiUploadDocument/assets/style.css';
import { Log } from '@core/utils';
import DataManagementChild from '../DataManagementChild';
import { DatabaseSchema, TableSchema } from '@core/domain';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import { LayoutNoData } from '@/shared/components/LayoutWrapper';
import SplitPanelMixin from '@/shared/components/LayoutWrapper/SplitPanel.mixin';
import { GlobalRelationshipHandler } from '@/screens/DashboardDetail/components/Relationship/RelationshipHandler/GlobalRelationshipHandler';
import RelationshipEditor from '@/screens/DashboardDetail/components/Relationship/RelationshipEditor.vue';
import { RelationshipMode } from '@/screens/DashboardDetail/components/Relationship/enum/RelationshipMode';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
import { _ThemeStore } from '@/store/modules/ThemeStore';

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
export default class DataRelationship extends Mixins(DataManagementChild, SplitPanelMixin) {
  private isDraging = false;

  private get globalRelationshipHandler() {
    return new GlobalRelationshipHandler();
  }

  private get panelSize() {
    return this.getPanelSizeHorizontal();
  }

  mounted() {
    _ConfigBuilderStore.setAllowBack(true);
  }

  private get relationshipMode() {
    return RelationshipMode.Edit;
  }

  async beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext<any>) {
    if (await _ConfigBuilderStore.confirmBack()) {
      await next();
    } else {
      next(false);
    }
  }

  private onDragStart(e: DragEvent, database: DatabaseSchema, table: TableSchema) {
    Log.debug('onDragStart');
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.Type, DROP_TYPE);
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.DatabaseName, database.name);
    e.dataTransfer?.setData(DATA_TRANSFER_KEY.TableName, table.name);
    const img = document.createElement('img');
    img.src = '/static/icons/upload@3x.png';
    e.dataTransfer?.setDragImage(img, 10, 10);
    this.isDraging = true;
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
    this.isDraging = false;
  }

  private handleReloadDatabases() {
    if (this.loadDatabases) {
      this.loadDatabases();
    }
  }
}
