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
    <GoogleAdsSyncModeConfig v-if="isGoogleAdsJob" ref="ggAdsSyncModeConfig" class="mb-3" :is-validate="isValidate" :job.sync="syncJob" />
    <FacebookAdsSyncModeConfig
      v-if="isFacebookAdsJob"
      ref="fbAdsSyncModeConfig"
      class="mb-3"
      :is-validate="isValidate"
      :job.sync="syncJob"
      :singleTable="singleTable"
    />
    <GoogleAnalyticSyncModeConfig
      v-if="isGoogleAnalyticJob"
      ref="googleAnalyticSyncModeConfig"
      class="mb-3"
      :is-validate="isValidate"
      :job.sync="syncJob"
      :single-table="singleTable"
    />
    <TiktokAdsSyncModeConfig v-if="isTiktokAdsJob" class="mb-3" :is-validate="isValidate" :job.sync="syncJob" :single-table="singleTable" />
    <GoogleAnalytic4SyncModeConfig
      v-if="isGoogleAnalytic4Job"
      ref="googleAnalytic4SyncModeConfig"
      class="mb-3"
      :is-validate="isValidate"
      :job.sync="syncJob"
      :single-table="singleTable"
    />
  </div>
</template>

<script lang="ts">
import BigQuerySyncModeConfig from '@/screens/data-ingestion/components/BigQuerySyncModeConfig.vue';
import GenericJdbcSyncModeConfig from '@/screens/data-ingestion/components/generic-jdbc-job-form/GenericJdbcSyncModeConfig.vue';
import JdbcSyncModeConfig from '@/screens/data-ingestion/components/JdbcSyncModeConfig.vue';
import ShopifySyncModeConfig from '@/screens/data-ingestion/components/ShopifySyncModeConfig.vue';
import MongoSyncModeConfig from '@/screens/data-ingestion/mongo-job-form/MongoSyncModeConfig.vue';
import { Job, JobName } from '@core/data-ingestion';
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import S3SyncModeConfig from './S3SyncModeConfig.vue';
import GoogleAdsSyncModeConfig from '@/screens/data-ingestion/components/GoogleAdsSyncModeConfig.vue';
import FacebookAdsSyncModeConfig from '@/screens/data-ingestion/components/facebook-ads/FacebookAdsSyncModeConfig.vue';
import { Log } from '@core/utils';
import GoogleAnalyticSyncModeConfig from '@/screens/data-ingestion/components/google-analytics/GoogleAnalyticSyncModeConfig.vue';
import TiktokAdsSyncModeConfig from '@/screens/data-ingestion/components/tiktok/TiktokAdsSyncModeConfig.vue';
import GoogleAnalytic4SyncModeConfig from '@/screens/data-ingestion/components/google-analytics-4/GoogleAnalytic4SyncModeConfig.vue';

@Component({
  components: {
    TiktokAdsSyncModeConfig,
    ShopifySyncModeConfig,
    S3SyncModeConfig,
    JdbcSyncModeConfig,
    GenericJdbcSyncModeConfig,
    MongoSyncModeConfig,
    BigQuerySyncModeConfig,
    GoogleAdsSyncModeConfig,
    FacebookAdsSyncModeConfig,
    GoogleAnalyticSyncModeConfig,
    GoogleAnalytic4SyncModeConfig
  }
})
export default class JobSyncConfig extends Vue {
  private readonly jobName = JobName;

  @PropSync('job')
  syncJob!: Job;

  @Prop()
  isValidate!: boolean;

  @Prop({ required: false, default: true })
  singleTable!: boolean;

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

  @Ref()
  private readonly ggAdsSyncModeConfig?: GoogleAdsSyncModeConfig;

  @Ref()
  private readonly fbAdsSyncModeConfig?: FacebookAdsSyncModeConfig;

  @Ref()
  private readonly googleAnalyticSyncModeConfig?: GoogleAnalyticSyncModeConfig;

  @Ref()
  private readonly googleAnalytic4SyncModeConfig?: GoogleAnalytic4SyncModeConfig;

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

  private get isGoogleAdsJob(): boolean {
    return this.syncJob.className === JobName.GoogleAdsJob;
  }
  private get isFacebookAdsJob(): boolean {
    return this.syncJob.className === JobName.FacebookAdsJob;
  }

  private get isGoogleAnalyticJob(): boolean {
    return this.syncJob.className === JobName.GoogleAnalyticJob;
  }

  private get isTiktokAdsJob(): boolean {
    return this.syncJob.className === JobName.TiktokAdsJob;
  }

  private get isGoogleAnalytic4Job(): boolean {
    return this.syncJob.className === JobName.GA4Job;
  }

  public validSyncMode() {
    Log.debug('validSyncMode', this.ggAdsSyncModeConfig);
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
      case JobName.GoogleAdsJob:
        return this.ggAdsSyncModeConfig?.validSyncMode();
      case JobName.FacebookAdsJob:
        return this.fbAdsSyncModeConfig?.validSyncMode();
      case JobName.GoogleSheetJob:
      case JobName.UnsupportedJob:
        return false;
      case JobName.GoogleAnalyticJob:
        return this.googleAnalyticSyncModeConfig?.validSyncMode();
      case JobName.GA4Job:
        return this.googleAnalytic4SyncModeConfig?.validSyncMode();
      default:
        return true;
    }
  }
}
</script>
