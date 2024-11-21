import { JKSConfig, SSLConfigs } from '@core/data-cook';
import { OrgId } from '@core/common/domain';
import { SSLUIConfig } from '@/screens/data-cook/components/save-to-database/SSLForm.vue';

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
