<template>
  <div>
    <label>Sync Mode</label>
    <div class="input">
      <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncedMongoJob.syncMode" name="radio-sub-component">
        <BFormRadio :id="genCheckboxId('full-sync')" :value="syncMode.FullSync">Full sync</BFormRadio>
        <BFormRadio :id="genCheckboxId('incremental-sync')" :value="syncMode.IncrementalSync">Incremental sync</BFormRadio>
      </BFormRadioGroup>
      <b-collapse :visible="syncedMongoJob.syncMode === syncMode.IncrementalSync">
        <label class="mt-2">Incremental column</label>
        <DynamicSuggestionInput
          :suggestionCommand="incrementalColumnSuggestionCommand"
          :value="syncedMongoJob.incrementalColumn"
          placeholder="Input incremental column"
          @change="updateIncrementalColumn"
        />
        <template v-if="isValidate && isEmptyIncrementalColumn">
          <div class="error-message mt-1">Incremental column is required.</div>
        </template>
        <label class="mt-12px">Start value</label>
        <BFormInput :id="genInputId('start-value')" placeholder="Input start value" autocomplete="off" v-model="syncedMongoJob.lastSyncedValue"></BFormInput>
        <template v-if="isInValidLastSyncedValue && isValidate">
          <div class="error-message mt-1">Start value is required.</div>
        </template>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import { SyncMode } from '@core/data-ingestion';
import { SuggestionCommand } from '@/screens/data-ingestion/interfaces/SuggestionCommand';
import { IncrementalColumnSuggestionCommand } from '@/screens/data-ingestion/interfaces/IncrementalColumnSuggestionCommand';
import { StringUtils } from '@/utils/StringUtils';
import { MongoJob } from '@core/data-ingestion/domain/job/MongoJob';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import { Track } from '@/shared/anotation';

@Component({
  components: { DynamicSuggestionInput }
})
export default class MongoSyncModeConfig extends Vue {
  private readonly syncMode = SyncMode;

  @PropSync('mongoJob')
  syncedMongoJob!: MongoJob;

  @Prop()
  isValidate!: boolean;

  private get incrementalColumnSuggestionCommand(): SuggestionCommand {
    return new IncrementalColumnSuggestionCommand(this.syncedMongoJob.sourceId, this.syncedMongoJob.databaseName, this.syncedMongoJob.tableName);
  }

  private get isEmptyIncrementalColumn() {
    return this.syncedMongoJob.syncMode! === SyncMode.IncrementalSync && StringUtils.isEmpty(this.syncedMongoJob.incrementalColumn);
  }

  private get isInValidLastSyncedValue() {
    return this.syncedMongoJob.syncMode === SyncMode.IncrementalSync && StringUtils.isEmpty(this.syncedMongoJob.lastSyncedValue);
  }

  public validSyncMode() {
    return !this.isInValidLastSyncedValue && !this.isEmptyIncrementalColumn;
  }

  @Track('input_incremental_column', { value: (_: MongoSyncModeConfig) => _.syncedMongoJob.incrementalColumn })
  private updateIncrementalColumn(value: string) {
    this.syncedMongoJob.incrementalColumn = value;
  }
}
</script>
