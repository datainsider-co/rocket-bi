import { SSLConfig } from '@core/DataCook/Domain/ETL/SSLConfig/SSLConfig';
import { KeyStoreConfig, SSLConfigs } from '@core/DataCook';
import { OrgId } from '@core/domain';
import { SSLUIConfig } from '@/screens/DataCook/components/SaveToDatabase/SSLForm.vue';
import { ListUtils } from '@/utils';
import { Log } from '@core/utils';

export enum Protocol {
  TCP = 'TCP',
  TCPS = 'TCPS'
}

export class JKSConfig extends SSLConfig {
  className = SSLConfigs.JKSConfig;
  keyStore: KeyStoreConfig | null;
  trustStore: KeyStoreConfig | null;
  protocol: Protocol;

  constructor(keyStore: KeyStoreConfig | null, trustStore: KeyStoreConfig | null, protocol: Protocol) {
    super();
    this.keyStore = keyStore;
    this.trustStore = trustStore;
    this.protocol = protocol;
  }

  static fromObject(obj: JKSConfig) {
    return new JKSConfig(
      obj.keyStore ? KeyStoreConfig.fromObject(obj.keyStore) : null,
      obj.trustStore ? KeyStoreConfig.fromObject(obj.trustStore) : null,
      obj.protocol
    );
  }

  static default(orgId: OrgId) {
    return new JKSConfig(null, null, Protocol.TCP);
  }

  static toSSLUIConfig(jksConfig: JKSConfig | null): SSLUIConfig {
    const defaultConfig: SSLUIConfig = {
      enable: false,
      protocol: Protocol.TCPS,
      trustStore: null,
      trustStoreData: '',
      trustStorePass: '',
      keyStore: null,
      keyStorePass: '',
      keyStoreData: ''
    };
    if (jksConfig) {
      if (jksConfig.keyStore) {
        defaultConfig.keyStore = new File([ListUtils.getHead(jksConfig.keyStore.fileName.split('.')) ?? ''], jksConfig.keyStore.fileName, {
          type: 'text/plain'
        });
        defaultConfig.keyStorePass = jksConfig.keyStore.password;
        defaultConfig.keyStoreData = jksConfig.keyStore.data;
      }
      if (jksConfig.trustStore) {
        defaultConfig.trustStore = new File([ListUtils.getHead(jksConfig.trustStore.fileName.split('.')) ?? ''], jksConfig.trustStore.fileName, {
          type: 'text/plain'
        });
        defaultConfig.trustStoreData = jksConfig.trustStore.data;
        defaultConfig.trustStorePass = jksConfig.trustStore.password;
      }
      defaultConfig.enable = true;
      defaultConfig.protocol = jksConfig.protocol;
    }

    // Log.debug("toSSLUIConfig::", jksConfig,defaultConfig)
    return defaultConfig;
  }
}
