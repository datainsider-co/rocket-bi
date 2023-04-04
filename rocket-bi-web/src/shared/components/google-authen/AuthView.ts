import { Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { ThirdPartyAuthenticationType } from '@/shared/components/google-authen/enum/ThirdPartyAuthenticationType';
import { PopupUtils, StringUtils } from '@/utils';

export abstract class AuthView extends Vue {
  abstract async authentication(): Promise<void>;

  protected handlePostMessage(data: any, type: string, target?: string) {
    Log.debug('handlePostMessage::', data, type);
    Log.debug('redirectRouteQuery::', this.$route.query);
    const targetOrigin = StringUtils.isNotEmpty(target) ? target : this.$route.query.redirect;
    window.opener.postMessage(
      {
        authResponse: data,
        responseType: type
      },
      targetOrigin
    );
  }

  protected handleError(error: any) {
    PopupUtils.showError(error.message);
    window.opener.postMessage({ error: error.message }, '*');
  }
}
