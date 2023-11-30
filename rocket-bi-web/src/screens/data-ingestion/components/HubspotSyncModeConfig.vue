<template>
  <div>
    <label>Sync Mode</label>
    <div class="input">
      <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncedJdbcJob.syncMode" name="radio-sub-component">
        <BFormRadio :id="genCheckboxId('full-sync')" :value="syncMode.FullSync">Full sync</BFormRadio>
        <!--        <BFormRadio :id="genCheckboxId('incremental-sync')" :value="syncMode.IncrementalSync">Incremental sync</BFormRadio>-->
      </BFormRadioGroup>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import { HubspotJob, JdbcJob, SyncMode } from '@core/data-ingestion';
import DynamicSuggestionInput from './DynamicSuggestionInput.vue';
import { SuggestionCommand } from '@/screens/data-ingestion/interfaces/SuggestionCommand';
import { IncrementalColumnSuggestionCommand } from '@/screens/data-ingestion/interfaces/IncrementalColumnSuggestionCommand';
import { StringUtils } from '@/utils/StringUtils';
import { Track } from '@/shared/anotation';

@Component({
  components: { DynamicSuggestionInput }
})
export default class HubspotSyncModeConfig extends Vue {
  private readonly syncMode = SyncMode;

  @PropSync('job')
  syncedJdbcJob!: HubspotJob;
}
</script>
