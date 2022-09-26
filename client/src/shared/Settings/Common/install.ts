import _Vue from 'vue';
import AlignSetting from '@/shared/Settings/Common/AlignSetting.vue';
import ColorSetting from '@/shared/Settings/Common/ColorSetting.vue';
import InputSetting from '@/shared/Settings/Common/InputSetting.vue';
import DropdownSetting from '@/shared/Settings/Common/DropdownSetting.vue';
import ToggleSetting from '@/shared/Settings/Common/ToggleSetting.vue';
import RevertButton from '@/shared/Settings/Common/RevertButton.vue';
import ToggleTextButtonSetting from '@/shared/Settings/Common/ToggleTextButtonSetting.vue';
import InputDateSetting from '@/shared/Settings/Common/InputDateSetting.vue';

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
