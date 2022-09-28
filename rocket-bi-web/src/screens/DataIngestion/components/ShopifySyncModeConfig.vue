<template>
  <div>
    <label>Sync Mode</label>
    <div class="input">
      <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncedShopifyJob.syncMode" name="radio-sub-component">
        <BFormRadio :id="genCheckboxId('full-sync')" :value="syncMode.FullSync">Full sync</BFormRadio>
        <BFormRadio :id="genCheckboxId('incremental-sync')" :value="syncMode.IncrementalSync">Incremental sync</BFormRadio>
      </BFormRadioGroup>
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
import { ShopifyJob } from '@core/DataIngestion/Domain/Job/ShopifyJob';

@Component({
  components: { DynamicSuggestionInput }
})
export default class ShopifySyncModeConfig extends Vue {
  private readonly syncMode = SyncMode;

  @PropSync('shopifyJob')
  syncedShopifyJob!: ShopifyJob;

  @Prop()
  isValidate!: boolean;

  public validSyncMode() {
    return true;
  }
}
</script>
