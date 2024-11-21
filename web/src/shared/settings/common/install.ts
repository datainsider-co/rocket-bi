import _Vue from 'vue';
import AlignSetting from '@/shared/settings/common/AlignSetting.vue';
import ColorSetting from '@/shared/settings/common/ColorSetting.vue';
import InputSetting from '@/shared/settings/common/InputSetting.vue';
import DropdownSetting from '@/shared/settings/common/DropdownSetting.vue';
import ToggleSetting from '@/shared/settings/common/ToggleSetting.vue';
import RevertButton from '@/shared/settings/common/RevertButton.vue';
import ToggleTextButtonSetting from '@/shared/settings/common/ToggleTextButtonSetting.vue';
import InputDateSetting from '@/shared/settings/common/InputDateSetting.vue';

const Settings = {
  install(Vue: typeof _Vue) {
    Vue.component('AlignSetting', AlignSetting);
    Vue.component('ColorSetting', ColorSetting);
    Vue.component('DropdownSetting', DropdownSetting);
    Vue.component('InputSetting', InputSetting);
    Vue.component('ToggleSetting', ToggleSetting);
    Vue.component('RevertButton', RevertButton);
    Vue.component('ToggleTextButtonSetting', ToggleTextButtonSetting);
    Vue.component('InputDateSetting', InputDateSetting);
  }
};

function opacity(enable: boolean): string {
  return enable ? '1' : 'var(--disable-opacity)';
}

function pointerEvents(enable: boolean): string {
  return enable ? 'unset' : 'none';
}

export function enableCss(enable: boolean): CSSStyleDeclaration {
  return {
    pointerEvents: pointerEvents(enable),
    cursor: enable ? 'default' : 'stop',
    opacity: opacity(enable)
  } as CSSStyleDeclaration;
}

export default Settings;
