import { numeric } from 'vuelidate/lib/validators';
import { DIException } from '@core/common/domain';
import { isEqual } from 'lodash';
import { Log } from '@core/utils';
import { ApiExceptions } from '@/shared';

export enum FacebookStatus {
  Connected = 'connected',
  Unknown = 'unknown'
}

export interface FacebookAuthen {
  accessToken: string;
  expiresIn: number;
  reauthorizeRequiredIn: number;
  signedRequest: string;
  userId: string;
  graphDomain: string;
  grantedScopes: string;
  dataAccessExpirationTime: number;
}

export interface FacebookResponse {
  status: FacebookStatus;
  authResponse?: FacebookAuthen | null;
}
const scopesDisplayNames = new Map<string, string>([
  ['ads_management', 'Ads Management'],
  ['ads_read', 'Ads Read']
]);
export function validFacebookResponse(response: FacebookResponse | undefined, expectScopes: string) {
  if (!response) {
    throw new DIException('Facebook Response is empty', 401, ApiExceptions.unauthorized);
  }
  if (response.status === FacebookStatus.Unknown) {
    throw new DIException('Facebook not connected!', 401, ApiExceptions.unauthorized);
  }
  if (!response.authResponse) {
    throw new DIException('Facebook not connected!', 401, ApiExceptions.unauthorized);
  }
  const expectScopesAsList = expectScopes.split(',');
  const grantedScopesASList = response.authResponse.grantedScopes.split(',');
  const remainScopes = expectScopesAsList.filter(expectScope => !grantedScopesASList.includes(expectScope));
  if (remainScopes.length > 0) {
    const displayNamePermission = remainScopes.map(scope => scopesDisplayNames.get(scope));
    throw new DIException(`Permission ${displayNamePermission.join(',')} is required`);
  }
}
