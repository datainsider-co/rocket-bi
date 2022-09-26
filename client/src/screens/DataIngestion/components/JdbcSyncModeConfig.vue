<template>
  <div>
    <label>Sync Mode</label>
    <div class="input">
      <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncedJdbcJob.syncMode" name="radio-sub-component">
        <BFormRadio :id="genCheckboxId('full-sync')" :value="syncMode.FullSync">Full sync</BFormRadio>
        <BFormRadio :id="genCheckboxId('incremental-sync')" :value="syncMode.IncrementalSync">Incremental sync</BFormRadio>
      </BFormRadioGroup>
      <b-collapse :visible="syncedJdbcJob.syncMode === syncMode.IncrementalSync">
        <label class="mt-2">Incremental column</label>
        <DynamicSuggestionInput
          :suggestionCommand="incrementalColumnSuggestionCommand"
          :value="syncedJdbcJob.incrementalColumn"
          placeholder="Input incremental column"
          @change="updateIncrementalColumn"
        />
        <template v-if="isValidate && isEmptyIncrementalColumn">
          <div class="error-message mt-1">Incremental column is required.</div>
        </template>
        <label class="mt-12px">Start value</label>
        <BFormInput :id="genInputId('start-value')" placeholder="Input start value" autocomplete="off" v-model="syncedJdbcJob.lastSyncedValue"></BFormInput>
        <template v-if="isInValidLastSyncedValue && isValidate">
          <div class="error-message mt-1">Start value is required.</div>
        </template>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import { JdbcJob, SyncMode } from '@core/DataIngestion';
import DynamicSuggestionInput from './DynamicSuggestionInput.vue';
import { SuggestionCommand } from '@/screens/DataIngestion/interfaces/SuggestionCommand';
import { IncrementalColumnSuggestionCommand } from '@/screens/DataIngestion/interfaces/IncrementalColumnSuggestionCommand';
import { StringUtils } from '@/utils/string.utils';
import { Track } from '@/shared/anotation';

@Component({
  components: { DynamicSuggestionInput }
})
export default class JdbcSyncModeConfig extends Vue {
  private readonly syncMode = SyncMode;

  @PropSync('jdbcJob')
  syncedJdbcJob!: JdbcJob;

  @Prop()
  isValidate!: boolean;

  private get incrementalColumnSuggestionCommand(): SuggestionCommand {
    return new IncrementalColumnSuggestionCommand(this.syncedJdbcJob.sourceId, this.syncedJdbcJob.databaseName, this.syncedJdbcJob.tableName);
  }

  private get isEmptyIncrementalColumn() {
    return this.syncedJdbcJob.syncMode! === SyncMode.IncrementalSync && StringUtils.isEmpty(this.syncedJdbcJob.incrementalColumn);
  }

  private get isInValidLastSyncedValue() {
    return this.syncedJdbcJob.syncMode === SyncMode.IncrementalSync && StringUtils.isEmpty(this.syncedJdbcJob.lastSyncedValue);
  }

  public validSyncMode() {
    return !this.isInValidLastSyncedValue && !this.isEmptyIncrementalColumn;
  }

  @Track('input_incremental_column', { value: (_: JdbcSyncModeConfig) => _.syncedJdbcJob.incrementalColumn })
  private updateIncrementalColumn(value: string) {
    this.syncedJdbcJob.incrementalColumn = value;
  }
}
</script>
