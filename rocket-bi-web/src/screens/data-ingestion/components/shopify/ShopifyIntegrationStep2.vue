<template>
  <LayoutWrapper>
    <div class="shopify-integration-step-2">
      <span class="shopify-integration-step-2--title">
        You've successfully connected your store!
      </span>
      <span class="mt-2 shopify-integration-step-2--subtitle">
        You've analysis is in progress
      </span>
      <span class="mt-1 shopify-integration-step-2--subtitle">
        We're off to a good start! This process can took a long time, but we'll let you know as soon as we're done.
      </span>
      <div class="mt-3 shopify-integration-step-2--steps">
        <template v-for="(step, index) in steps">
          <div
            class="shopify-step-item"
            :key="index"
            :class="{
              'shopify-step-item--waiting': currentStepIndex < index,
              'shopify-step-item--running': currentStepIndex === index,
              'shopify-step-item--completed': currentStepIndex > index,
              'shopify-step-item--error': isError && currentStepIndex <= index
            }"
          >
            <!--            <i v-if="currentStepIndex < index" class="fa-solid fa-fade di-icon-three-dot-horizontal"></i>-->
            <i v-if="!isError && currentStepIndex <= index" class="fa fa-spinner fa-spin"></i>
            <i v-else-if="isError && currentStepIndex <= index" class="di-icon-warning"></i>
            <i v-else class="di-icon-check-circle"></i>
            <span>{{ step.displayName }}</span>
          </div>
        </template>
      </div>
    </div>
  </LayoutWrapper>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
import { Component, Vue } from 'vue-property-decorator';
import { Routers } from '@/shared';
import DiLoading from '@/shared/components/DiLoading.vue';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { RouterUtils } from '@/utils/RouterUtils';
import { RouterEnteringHook } from '@/shared/components/vue-hook/RouterEnteringHook';
import { NavigationGuardNext, Route } from 'vue-router';
import { Di } from '@core/common/modules';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { Log } from '@core/utils';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { DataSourceInfo, Job, SyncMode } from '@core/data-ingestion';
import { ShopifySourceInfo } from '@core/data-ingestion/domain/data-source/ShopifySourceInfo';
import { LayoutContent, LayoutHeader, LayoutWrapper } from '@/shared/components/layout-wrapper';
import { DatabaseCreateRequest, DIException } from '@core/common/domain';
import { ShopifyUtils } from '@/utils';
import { SchemaService } from '@core/schema/service/SchemaService';
import { ShopifyJob } from '@core/data-ingestion/domain/job/ShopifyJob';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';
import { SchedulerHourly } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerHourly';
import { StringUtils } from '@/utils/StringUtils';

class ShopifyStep {
  displayName: string;
  run: (data: Map<string, any>) => Promise<boolean>;

  constructor(displayName: string, run: (data: Map<string, any>) => Promise<boolean>) {
    this.displayName = displayName;
    this.run = run;
  }
}

@Component({
  components: { DiLoading, LayoutWrapper, LayoutContent, LayoutHeader }
})
export default class ShopifyIntegrationStep2 extends Vue implements RouterEnteringHook {
  private currentStepIndex = 1;
  private isError = true;
  // chua toan bo data trong map
  private data = new Map<string, any>();
  private readonly DB_NAME = 'db_name';
  private readonly SOURCE_ID = 'source_id';

  private get steps(): ShopifyStep[] {
    return [
      new ShopifyStep('Create Database', (data: Map<string, any>) => this.handleCreateDatabase(data, this.shopUrl)),
      new ShopifyStep('Create Shopify Source', (data: Map<string, any>) => this.handleCreateSource(data, this.shopUrl, this.code, this.apiVersion)),
      new ShopifyStep('Create Shopify Job', (data: Map<string, any>) => this.handleCreateJob(data))
    ];
  }
  // =  ['Create Database', 'Create Shopify Source', 'Create Shopify Job'];

  private get shopUrl(): string {
    return this.$route.query['shop'] as string;
  }

  private get code(): string {
    return this.$route.query['code'] as string;
  }

  private get apiVersion(): string {
    return window.appConfig.VUE_APP_SHOPIFY_API_VERSION ?? '';
  }

  mounted() {
    if (ShopifyUtils.isShopValid(this.shopUrl) && this.code) {
      this.run(this.steps);
    } else {
      RouterUtils.to(Routers.DataSource, { replace: true });
    }
  }

  private async run(steps: ShopifyStep[], initStep = 0) {
    this.isError = false;
    let index = initStep;
    try {
      for (index; index < steps.length; index++) {
        this.currentStepIndex = index;
        const step: ShopifyStep = steps[index];
        const isSuccess: boolean = await step.run(this.data);
        if (!isSuccess) {
          throw new DIException(`Run step ${index} is failure`);
        }
      }
      this.currentStepIndex += 1;
      RouterUtils.to(Routers.Job, { replace: true });
    } catch (ex) {
      this.isError = true;
      Log.error('run failure, cause', ex);
    }
  }

  private async handleCreateDatabase(data: Map<string, any>, shopUrl: string): Promise<boolean> {
    const databaseName: string = StringUtils.normalizeDatabaseName(ShopifyUtils.getShopName(shopUrl)!);
    Log.debug('shop_name', databaseName);
    data.set(this.DB_NAME, databaseName);
    try {
      const createDatabaseRequest = new DatabaseCreateRequest(databaseName, databaseName);
      await Di.get(SchemaService).createDatabase(createDatabaseRequest);
      return Promise.resolve(true);
    } catch (ex) {
      Log.error('create database', databaseName, 'error, cause', ex);
      // ignore exception
      return Promise.resolve(true);
    }
  }

  private async handleCreateSource(data: Map<string, any>, shopUrl: string, authorizationCode: string, apiVersion: string): Promise<boolean> {
    const dbName: string = data.get(this.DB_NAME);
    const accessToken: string = await Di.get(DataSourceService).getShopifyAccessToken(shopUrl, authorizationCode, this.apiVersion);
    const temp: DataSourceInfo = new ShopifySourceInfo(0, '-1', `Shop ${dbName}`, shopUrl, apiVersion, accessToken, '', 0);
    const shopifySource: DataSourceInfo = await DataSourceModule.createDataSource(temp);
    this.data.set(this.SOURCE_ID, shopifySource.id);
    return Promise.resolve(true);
  }

  private async handleCreateJob(data: Map<string, any>) {
    const dbName: string = data.get(this.DB_NAME);
    const sourceId: number = data.get(this.SOURCE_ID);
    const job: Job = ShopifyJob.from(sourceId, dbName, SyncMode.IncrementalSync, new SchedulerHourly(6, 0));
    const tables: string[] = await DataSourceModule.loadTableNames({ id: sourceId, dbName: '' });
    const isSuccess: boolean = await JobModule.createMulti({ job: job, tables: tables });
    return Promise.resolve(true);
  }

  beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<any>): void {
    if (AuthenticationModule.isLoggedIn) {
      next();
    } else {
      next({
        name: Routers.Login,
        query: {
          ...to.query,
          previous_screen: Routers.ShopifyIntegrationStep2
        }
      });
    }
  }
}
</script>

<style lang="scss">
.shopify-integration-step-2 {
  background: var(--secondary);
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .shopify-integration-step-2--title {
    font-size: 24px;
    font-weight: bold;
    line-height: 1.4;
    color: var(--text-color);
  }

  .shopify-integration-step-2--subtitle {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.4;
    color: var(--secondary-text-color);
  }

  .shopify-integration-step-2--steps {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;

    .shopify-step-item {
      font-weight: 400;
      font-size: 16px;

      > span {
        margin-left: 8px;
        line-height: normal;
      }

      &.shopify-step-item--completed {
        color: var(--success);
      }

      &.shopify-step-item--waiting {
        color: var(--secondary-text-color);
      }

      &.shopify-step-item--running {
        color: var(--accent);
      }

      &.shopify-step-item--error {
        color: var(--danger);
      }
    }

    .shopify-step-item + .shopify-step-item {
      margin-top: 4px;
    }
  }
}
</style>
