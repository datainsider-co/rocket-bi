import { BaseModule } from '@core/common/modules/Module';
import { Container } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules/Di';
import { BaseClient } from '@core/common/services';
import { ClientBuilders } from '@core/common/misc/ClientBuilder';

export class HttpModule extends BaseModule {
  configuration(): void {
    const timeout: number = window.appConfig?.VUE_APP_TIME_OUT || 30000;
    const caasApiUrl = window.appConfig?.VUE_APP_CAAS_API_URL;
    Container.bindName(DIKeys.CaasClient).to(this.buildClient(caasApiUrl, timeout));

    const biApiUrl = window.appConfig.VUE_APP_BI_API_URL;
    Container.bindName(DIKeys.BiClient).to(this.buildClient(biApiUrl, timeout));

    const schemaApiUrl = window.appConfig.VUE_APP_SCHEMA_API_URL;
    Container.bindName(DIKeys.SchemaClient).to(this.buildClient(schemaApiUrl, timeout));

    const lakeApiUrl = window.appConfig.VUE_APP_LAKE_API_URL;
    Container.bindName(DIKeys.LakeClient).to(this.buildClient(lakeApiUrl, timeout));

    const cdpApiUrl = window.appConfig.VUE_APP_CDP_API_URL;
    Container.bindName(DIKeys.CdpClient).to(this.buildClient(cdpApiUrl, timeout));

    const staticApiUrl = window.appConfig.VUE_APP_STATIC_API_URL;
    Container.bindName(DIKeys.StaticClient).to(this.buildClient(staticApiUrl, timeout));

    const cookApiUrl = window.appConfig.VUE_APP_DATA_COOK_API_URL;
    Container.bindName(DIKeys.DataCookClient).to(this.buildClient(cookApiUrl, timeout));

    const billingApiUrl = window.appConfig.VUE_APP_BILLING_API_URL;
    Container.bindName(DIKeys.BillingClient).to(this.buildClient(billingApiUrl, timeout));

    const workerApiUrl = window.appConfig.VUE_APP_WORKER_API_URL;
    Container.bindName(DIKeys.WorkerClient).to(this.buildClient(workerApiUrl, timeout));

    const schedulerApiUrl = window.appConfig.VUE_APP_SCHEDULER_API_URL;
    Container.bindName(DIKeys.SchedulerClient).to(this.buildClient(schedulerApiUrl, timeout));

    const relayApiUrl = window.appConfig.VUE_APP_RELAY_API_URL;
    Container.bindName(DIKeys.RelayClient).to(this.buildClient(relayApiUrl, timeout));
  }

  private buildClient(apiUrl: string, timeout: number): BaseClient {
    return ClientBuilders.authAndTokenBuilder()
      .withBaseUrl(apiUrl)
      .withTimeout(timeout)
      .build();
  }
}
