<template>
  <DiCustomModal no-close-on-backdrop id="relationship-modal" ref="modal" class="relationship-modal" hide-footer title="Relationship">
    <div class="relationship-modal-container">
      <!--      <DiagramPanel ref="container" :position="rootPosition">-->
      <RelationshipEditor :mode="relationshipMode" :handler="dashboardRelationshipHandler" class="relationship" @saved="hide"> </RelationshipEditor>
      <!--      </DiagramPanel>-->
    </div>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import DiagramPanel from '@/screens/DataCook/components/DiagramPanel/DiagramPanel.vue';
import RelationshipEditor from '@/screens/DashboardDetail/components/Relationship/RelationshipEditor.vue';
import { DashboardModeModule, DashboardModule } from '@/screens/DashboardDetail/stores';
import { DashboardRelationshipHandler } from '@/screens/DashboardDetail/components/Relationship/RelationshipHandler/DashboardRelationshipHandler';
import { DashboardMode } from '@/shared';
import { RelationshipMode } from '@/screens/DashboardDetail/components/Relationship/enum/RelationshipMode';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';

@Component({ components: { RelationshipEditor, DiagramPanel, DiCustomModal } })
export default class RelationshipModal extends Vue {
  @Ref()
  private readonly modal!: DiCustomModal;

  private get dashboardId() {
    return DashboardModule.id;
  }

  private get relationshipMode() {
    return DashboardModeModule.mode === DashboardMode.Edit ? RelationshipMode.Edit : RelationshipMode.View;
  }

  private get dashboardRelationshipHandler() {
    return new DashboardRelationshipHandler(this.dashboardId ?? 0);
  }

  async show() {
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }
}
</script>

<style lang="scss">
#relationship-modal {
  .modal-lg {
    max-width: 95vw;
    width: 95vw;
    //max-height: 95vh !important;
    //height: 95vh;

    .modal-content {
      max-width: 95vw;
      width: 95vw;
      //max-height: 95vh !important;
      //height: 95vh;
    }

    .modal-body {
      height: calc(95vh - 44px - 32px);
    }
  }
  .relationship-modal-container {
    width: 100%;
    height: 100%;
  }

  .relationship {
    .db-relationship-editor-container {
      //width: calc(100% - 32px);
    }
  }
}
</style>
