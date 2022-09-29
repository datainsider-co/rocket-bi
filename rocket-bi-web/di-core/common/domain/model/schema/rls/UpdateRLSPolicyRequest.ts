import { RlsPolicy } from '@core/common/domain';

export class UpdateRLSPolicyRequest {
  constructor(public dbName: string, public tblName: string, public policies: RlsPolicy[]) {}
}
