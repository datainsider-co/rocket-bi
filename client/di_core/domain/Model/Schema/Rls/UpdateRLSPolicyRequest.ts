import { RlsPolicy } from '@core/domain';

export class UpdateRLSPolicyRequest {
  constructor(public dbName: string, public tblName: string, public policies: RlsPolicy[]) {}
}
