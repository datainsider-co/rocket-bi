<template>
  <div>
    <label>Sync Mode</label>
    <div class="input">
      <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncedJob.syncMode" name="radio-sub-component">
        <BFormRadio :id="genCheckboxId('full-sync')" :value="syncMode.FullSync">Full sync</BFormRadio>
        <BFormRadio :id="genCheckboxId('incremental-sync')" :value="syncMode.IncrementalSync">Incremental sync </BFormRadio>
      </BFormRadioGroup>
      <b-collapse :visible="syncedJob.syncMode === syncMode.IncrementalSync">
        <label class="mt-2">Incremental time</label>
        <DiDatePicker :date.sync="syncedJob.incrementalTimeAsDate" placement="bottom" class="w-100" />
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import { S3Job, SyncMode } from '@core/DataIngestion';
import { Component, Vue, Prop, PropSync } from 'vue-property-decorator';

@Component({ components: { DiDatePicker } })
export default class S3SyncModeConfig extends Vue {
  private readonly syncMode = SyncMode;

  @PropSync('job')
  syncedJob!: S3Job;

  @Prop()
  isValidate!: boolean;

  public validSyncMode() {
    return true;
  }
}
</script>

<style lang="scss" scoped></style>
