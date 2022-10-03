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
        <template v-if="$v.syncedJob.bucketName.$error">
          <div class="error-message mt-1">Bucket name is required.</div>
        </template>
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
        <template v-if="$v.syncedJob.folderPath.$error">
          <div class="error-message mt-1">Folder path is required.</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { StringUtils } from '@/utils/StringUtils';
import { S3Job } from '@core/data-ingestion';
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { required } from 'vuelidate/lib/validators';

@Component({
  components: {},
  validations: {
    syncedJob: {
      bucketName: { required },
      folderPath: { required }
    }
  }
})
export default class S3DataSourceConfig extends Vue {
  @PropSync('job')
  syncedJob!: S3Job;

  private emitBucketName(name: string) {
    this.$emit('onChanged', name);
  }

  isValidFromSuggestion(): boolean {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }
}
</script>

<style lang="scss" scoped></style>
