import { Prop, Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { PopupUtils, StringUtils } from '@/utils';
import { ThirdPartyType } from '@/shared/components/third-party-authentication/ThirdPartyType';

export abstract class AbstractAuthentication extends Vue {
  @Prop({ required: false, type: String, default: ThirdPartyType.GoogleAnalytic })
  protected readonly authType!: ThirdPartyType;

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
