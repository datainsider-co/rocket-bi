<template>
  <div>
    <label>Sync Mode</label>
    <div class="input">
      <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncedGenericJdbcJob.syncMode" name="radio-sub-component">
        <BFormRadio :id="genCheckboxId('full-sync')" :value="syncMode.FullSync">Full sync</BFormRadio>
        <BFormRadio :id="genCheckboxId('incremental-sync')" :value="syncMode.IncrementalSync">Incremental sync</BFormRadio>
      </BFormRadioGroup>
      <b-collapse :visible="syncedGenericJdbcJob.syncMode === syncMode.IncrementalSync">
        <label class="mt-2">Incremental column</label>
        <DynamicSuggestionInput
          :suggestionCommand="incrementalColumnSuggestionCommand"
          :value="syncedGenericJdbcJob.incrementalColumn"
          placeholder="Input incremental column"
          @change="updateIncrementalColumn"
        />
        <template v-if="isValidate && isEmptyIncrementalColumn">
          <div class="error-message mt-1">Incremental column is required.</div>
        </template>
        <label class="mt-12px">Start value</label>
        <BFormInput
          :id="genInputId('start-value')"
          placeholder="Input start value"
          autocomplete="off"
          v-model="syncedGenericJdbcJob.lastSyncedValue"
        ></BFormInput>
        <template v-if="isInValidLastSyncedValue && isValidate">
          <div class="error-message mt-1">Start value is required.</div>
        </template>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import { JdbcJob, SyncMode } from '@core/data-ingestion';
import { SuggestionCommand } from '@/screens/data-ingestion/interfaces/SuggestionCommand';
import { IncrementalColumnSuggestionCommand } from '@/screens/data-ingestion/interfaces/IncrementalColumnSuggestionCommand';
import { StringUtils } from '@/utils/StringUtils';
import { GenericJdbcJob } from '@core/data-ingestion/domain/job/GenericJdbcJob';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import { Track } from '@/shared/anotation';

@Component({
  components: { DynamicSuggestionInput }
})
export default class GenericJdbcSyncModeConfig extends Vue {
  private readonly syncMode = SyncMode;

  @PropSync('genericJdbcJob')
  syncedGenericJdbcJob!: GenericJdbcJob;

  @Prop()
  isValidate!: boolean;

  private get incrementalColumnSuggestionCommand(): SuggestionCommand {
    return new IncrementalColumnSuggestionCommand(
      this.syncedGenericJdbcJob.sourceId,
      this.syncedGenericJdbcJob.databaseName,
      this.syncedGenericJdbcJob.tableName
    );
  }

  private get isEmptyIncrementalColumn() {
    return this.syncedGenericJdbcJob.syncMode! === SyncMode.IncrementalSync && StringUtils.isEmpty(this.syncedGenericJdbcJob.incrementalColumn);
  }

  private get isInValidLastSyncedValue() {
    return this.syncedGenericJdbcJob.syncMode === SyncMode.IncrementalSync && StringUtils.isEmpty(this.syncedGenericJdbcJob.lastSyncedValue);
  }

  public validSyncMode() {
    return !this.isInValidLastSyncedValue && !this.isEmptyIncrementalColumn;
  }

  @Track('input_incremental_column', { value: (_: GenericJdbcSyncModeConfig) => _.syncedGenericJdbcJob.incrementalColumn })
  private updateIncrementalColumn(value: string) {
    this.syncedGenericJdbcJob.incrementalColumn = value;
  }
}
</script>
