// import Vue from 'vue';
import { Vue } from 'vue-property-decorator';
import { VNode } from 'vue';
import ToastHeader from '@/shared/components/ToastHeader.vue';

export enum Toaster {
  bottomRight = 'b-toaster-bottom-right',
  bottomLeft = 'b-toaster-bottom-left'
}

//add new one, need define theme in _toast.scss
export enum Variant {
  danger = 'danger',
  success = 'success'
}

export class PopupUtils {
  private static appInstance: Vue;

  static customToastHeader(variant: Variant): VNode {
    const customToastHeader = PopupUtils.appInstance.$createElement;
    return customToastHeader(ToastHeader, { props: { variant: variant } });
  }

  static init(instance: Vue) {
    if (PopupUtils.appInstance == undefined) {
      PopupUtils.appInstance = instance;
    }
  }

  static showError(message: string, toaster: Toaster = Toaster.bottomRight) {
    const variant = Variant.danger;
    PopupUtils.appInstance.$bvToast.toast(message, {
      title: PopupUtils.customToastHeader(variant),
      variant: variant,
      toaster: toaster
      // noAutoHide: true
    });
  }

  static showSuccess(message: string, toaster: Toaster = Toaster.bottomRight) {
    const variant = Variant.success;
    PopupUtils.appInstance.$bvToast.toast(message, {
      title: PopupUtils.customToastHeader(variant),
      variant: variant,
      toaster: toaster
      // noAutoHide: true
    });
  }

  // hide all popup, popover and context menu
  static hideAllPopup() {
    document.documentElement.click();
  }
}
