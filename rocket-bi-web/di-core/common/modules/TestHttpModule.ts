import { BaseModule } from '@core/common/modules/Module';
import { Container } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules/Di';
import { BaseClient } from '@core/common/services';
import { ClientBuilders, ClientWithoutWorkerBuilders } from '@core/common/misc/ClientBuilder';
import { Log } from '@core/utils';
//@ts-ignore
import { testConfig } from '../../../public/config/test.js';

export class HttpTestModule extends BaseModule {
  configuration(): void {
    Log.debug('testConfig::', testConfig);
    const timeout: number = testConfig.VUE_APP_TIME_OUT || 30000;
    const caasApiUrl = testConfig.VUE_APP_CAAS_API_URL;
    Container.bindName(DIKeys.CaasClient).to(this.buildClient(caasApiUrl, timeout));

    const biApiUrl = testConfig.VUE_APP_BI_API_URL;
    Container.bindName(DIKeys.BiClient).to(this.buildClient(biApiUrl, timeout));

    const schemaApiUrl = testConfig.VUE_APP_SCHEMA_API_URL;
    Container.bindName(DIKeys.SchemaClient).to(this.buildClient(schemaApiUrl, timeout));

    const lakeApiUrl = testConfig.VUE_APP_LAKE_API_URL;
    Container.bindName(DIKeys.LakeClient).to(this.buildClient(lakeApiUrl, timeout));

    const cdpApiUrl = testConfig.VUE_APP_CDP_API_URL;
    Container.bindName(DIKeys.CdpClient).to(this.buildClient(cdpApiUrl, timeout));

    const staticApiUrl = testConfig.VUE_APP_STATIC_API_URL;
    Container.bindName(DIKeys.StaticClient).to(this.buildClient(staticApiUrl, timeout));

    const cookApiUrl = testConfig.VUE_APP_DATA_COOK_API_URL;
    Container.bindName(DIKeys.DataCookClient).to(this.buildClient(cookApiUrl, timeout));

    const billingApiUrl = testConfig.VUE_APP_BILLING_API_URL;
    Container.bindName(DIKeys.BillingClient).to(this.buildClient(billingApiUrl, timeout));

    const ingestionWorkerApiUrl = testConfig.VUE_APP_WORKER_API_URL;
    Container.bindName(DIKeys.WorkerClient).to(this.buildClient(ingestionWorkerApiUrl, timeout));

    const ingestionSchedulerApiUrl = testConfig.VUE_APP_SCHEDULER_API_URL;
    Container.bindName(DIKeys.SchedulerClient).to(this.buildClient(ingestionSchedulerApiUrl, timeout));

    const relayApiUrl = testConfig.VUE_APP_RELAY_API_URL;
    Container.bindName(DIKeys.RelayClient).to(this.buildClient(relayApiUrl, timeout));
  }

  private buildClient(apiUrl: string, timeout: number): BaseClient {
    return ClientWithoutWorkerBuilders.defaultBuilder()
      .withBaseUrl(apiUrl)
      .withTimeout(timeout)
      .build();
  }
}
