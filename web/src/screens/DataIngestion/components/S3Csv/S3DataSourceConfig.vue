<template>
  <div>
    <div class="job-section">
      <label>Bucket name</label>
      <div class="input">
        <BFormInput
          :id="genInputId('s3-job-bucket-name')"
          placeholder="Input bucket name"
          autocomplete="off"
          :debounce="500"
          v-model="syncedJob.bucketName"
          @change="emitBucketName"
        ></BFormInput>
      </div>
    </div>
    <div class="job-section">
      <label>Folder path</label>
      <div class="input">
        <BFormInput
          :id="genInputId('s3-job-folder-path')"
          placeholder="Input bucket name"
          autocomplete="off"
          :debounce="500"
          v-model="syncedJob.folderPath"
        ></BFormInput>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { StringUtils } from '@/utils/string.utils';
import { S3Job } from '@core/DataIngestion';
import { Component, PropSync, Vue } from 'vue-property-decorator';

@Component({ components: {} })
export default class S3DataSourceConfig extends Vue {
  @PropSync('job')
  syncedJob!: S3Job;

  private emitBucketName(name: string) {
    this.$emit('onChanged', name);
  }

  isValidFromSuggestion(): boolean {
    if (StringUtils.isEmpty(this.syncedJob.bucketName)) {
      return false;
    } else {
      return true;
    }
  }
}
</script>

<style lang="scss" scoped></style>
