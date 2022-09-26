<template>
  <div>
    <label class="export-form mb-0">
      <div class="custom-control custom-switch">
        <input
          :id="genToggleId('flatten-deep')"
          :checked="enableNestedColumn"
          class="custom-control-input"
          type="checkbox"
          @input="handleEnableNestedColumn($event.target.checked)"
        />
        <label class="custom-control-label" :for="genToggleId('flatten-deep')">Nested Column</label>
      </div>
    </label>
    <div class="input">
      <b-collapse :visible="enableNestedColumn" class="mt-12px">
        <label>Nested level</label>
        <BInputGroupAppend class="input-group-append">
          <BFormInput v-model.number="syncedMongoJob.flattenDepth" :min="0" type="number" placeholder="Input nested level..." />
        </BInputGroupAppend>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { MongoJob } from '@core/DataIngestion/Domain/Job/MongoJob';
import DiToggle from '@/shared/components/Common/DiToggle.vue';

@Component({ components: { DiToggle } })
export default class MongoDepthConfig extends Vue {
  @PropSync('mongoJob')
  syncedMongoJob!: MongoJob;

  private get enableNestedColumn(): boolean {
    return this.syncedMongoJob.flattenDepth !== undefined && this.syncedMongoJob.flattenDepth !== 0;
  }

  private handleEnableNestedColumn(enable: boolean) {
    if (enable) {
      this.syncedMongoJob.flattenDepth = 1;
    } else {
      this.syncedMongoJob.flattenDepth = 0;
    }
    this.$forceUpdate();
  }
}
</script>

<style lang="scss" scoped></style>
