import { JKSConfig, SSLConfigs } from '@core/DataCook';
import { OrgId } from '@core/domain';
import { SSLUIConfig } from '@/screens/DataCook/components/SaveToDatabase/SSLForm.vue';

export abstract class SSLConfig {
  abstract className: SSLConfigs;

  static fromObject(obj: any) {
    return JKSConfig.fromObject(obj as JKSConfig);
  }

  static default(orgId: OrgId) {
    return JKSConfig.default(orgId);
  }

  static toSSLUIConfig(sslConfig: SSLConfig | null): SSLUIConfig {
    return JKSConfig.toSSLUIConfig(sslConfig as JKSConfig | null);
  }
}
