<template>
  <div>
    <JdbcSyncModeConfig v-if="isJdbcJob" ref="jdbcSyncModeConfig" class="mb-3" :is-validate="isValidate" :jdbc-job.sync="syncJob"></JdbcSyncModeConfig>
    <GenericJdbcSyncModeConfig
      v-if="isGenericJdbcJob"
      ref="genericJdbcSyncModeConfig"
      class="mb-3"
      :generic-jdbc-job.sync="syncJob"
      :is-validate="isValidate"
    ></GenericJdbcSyncModeConfig>
    <MongoSyncModeConfig v-if="isMongoJob" ref="mongoSyncModeConfig" class="mb-3" :is-validate="isValidate" :mongo-job.sync="syncJob"></MongoSyncModeConfig>
    <BigQuerySyncModeConfig
      v-if="isBigQueryJob"
      ref="bigQuerySyncModeConfig"
      class="mb-3"
      :big-query.sync="syncJob"
      :is-validate="isValidate"
    ></BigQuerySyncModeConfig>
    <ShopifySyncModeConfig
      v-if="isShopifyJob"
      ref="shopifySyncModeConfig"
      class="mb-3"
      :is-validate="isValidate"
      :shopify-job.sync="syncJob"
    ></ShopifySyncModeConfig>
    <S3SyncModeConfig v-if="isS3Job" ref="s3SyncModeConfig" class="mb-3" :is-validate="isValidate" :job.sync="syncJob"></S3SyncModeConfig>
  </div>
</template>

<script lang="ts">
import BigQuerySyncModeConfig from '@/screens/data-ingestion/components/BigQuerySyncModeConfig.vue';
import GenericJdbcSyncModeConfig from '@/screens/data-ingestion/components/generic-jdbc-job-form/GenericJdbcSyncModeConfig.vue';
import JdbcSyncModeConfig from '@/screens/data-ingestion/components/JdbcSyncModeConfig.vue';
import ShopifySyncModeConfig from '@/screens/data-ingestion/components/ShopifySyncModeConfig.vue';
import MongoSyncModeConfig from '@/screens/data-ingestion/mongo-job-form/MongoSyncModeConfig.vue';
import { Job } from '@core/data-ingestion';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import S3SyncModeConfig from './S3SyncModeConfig.vue';

@Component({
  components: {
    ShopifySyncModeConfig,
    S3SyncModeConfig,
    JdbcSyncModeConfig,
    GenericJdbcSyncModeConfig,
    MongoSyncModeConfig,
    BigQuerySyncModeConfig
  }
})
export default class JobSyncConfig extends Vue {
  private readonly jobName = JobName;

  @PropSync('job')
  syncJob!: Job;

  @Prop()
  isValidate!: boolean;

  @Ref()
  private readonly bigQuerySyncModeConfig?: BigQuerySyncModeConfig;

  @Ref()
  private readonly jdbcSyncModeConfig?: JdbcSyncModeConfig;

  @Ref()
  private readonly genericJdbcSyncModeConfig?: GenericJdbcSyncModeConfig;

  @Ref()
  private readonly mongoSyncModeConfig?: MongoSyncModeConfig;

  @Ref()
  private readonly shopifySyncModeConfig?: ShopifySyncModeConfig;
  @Ref()
  private readonly s3SyncModeConfig?: S3SyncModeConfig;

  private get isJdbcJob(): boolean {
    return Job.isJdbcJob(this.syncJob);
  }

  private get isMongoJob(): boolean {
    return Job.isMongoJob(this.syncJob);
  }

  private get isGenericJdbcJob(): boolean {
    return Job.isGenericJdbcJob(this.syncJob);
  }

  private get isBigQueryJob(): boolean {
    return Job.isBigQueryJob(this.syncJob);
  }

  private get isShopifyJob(): boolean {
    return Job.isShopifyJob(this.syncJob);
  }

  private get isS3Job(): boolean {
    return Job.isS3Job(this.syncJob);
  }

  public validSyncMode() {
    switch (this.syncJob.className) {
      case JobName.Jdbc:
        return this.jdbcSyncModeConfig?.validSyncMode();
      case JobName.GenericJdbc:
        return this.genericJdbcSyncModeConfig?.validSyncMode();
      case JobName.BigQueryJob:
        return this.bigQuerySyncModeConfig?.validSyncMode();
      case JobName.MongoJob:
        return this.mongoSyncModeConfig?.validSyncMode();
      case JobName.ShopifyJob:
        return this.shopifySyncModeConfig?.validSyncMode();
      case JobName.S3Job:
        return this.s3SyncModeConfig?.validSyncMode();
      case JobName.GoogleAnalyticJob:
      case JobName.GoogleSheetJob:
      case JobName.UnsupportedJob:
        return false;
      default:
        return true;
    }
  }
}
</script>
