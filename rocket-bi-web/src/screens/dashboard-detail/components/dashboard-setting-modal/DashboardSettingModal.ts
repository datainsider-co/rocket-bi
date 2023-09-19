/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 6:15 PM
 */
import { Component, Ref, Vue } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { cloneDeep } from 'lodash';
import { DashboardSettingModalData } from '@/screens/dashboard-detail/components/dashboard-setting-modal/DashboardSettingModalData';
import { SettingItem } from '@/shared/models';
import { DashboardSetting } from '@core/common/domain';
import ToggleSettingComponent from '@/shared/components/builder/setting/ToggleSettingComponent.vue';
import { DashboardThemeType } from '@core/common/domain/model/dashboard/setting/DashboardThemeType';
import { LabelNode } from '@/shared';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { TimeoutUtils } from '@/utils';
import { ObjectUtils } from '@core/utils';

@Component({
  components: {
    DiCustomModal,
    ToggleSettingComponent
  }
})
export default class DashboardSettingModal extends Vue {
  private settingModalData: DashboardSettingModalData | null = null;
  private isLoading = false;

  @Ref('modal')
  private readonly modal?: DiCustomModal;
  private overlapSettingItem: SettingItem = SettingItem.default();
  private DarkThemes: LabelNode[] = [
    {
      label: 'Dark Default',
      type: DashboardThemeType.Default
    },
    {
      label: 'Clear Sky',
      type: DashboardThemeType.Theme1
    },
    {
      label: 'Deep Sea Space',
      type: DashboardThemeType.Theme2
    },
    {
      label: 'Lawrencium',
      type: DashboardThemeType.Theme3
    },
    {
      label: 'Dark',
      type: DashboardThemeType.Theme4
    }
  ];
  private LightThemes: LabelNode[] = [
    {
      label: 'Dodger Blue',
      type: DashboardThemeType.LightDefault
    },
    {
      label: 'Anzac',
      type: DashboardThemeType.LightTheme1
    },
    {
      label: 'Electric Violet',
      type: DashboardThemeType.LightTheme2
    },
    {
      label: 'Curious Blue',
      type: DashboardThemeType.LightTheme3
    },
    {
      label: 'Ebony Clay',
      type: DashboardThemeType.LightTheme4
    }
  ];

  private currentTheme = DashboardThemeType.Default;
  private DashboardThemeType = DashboardThemeType;

  private get canShowModal(): boolean {
    return !!this.settingModalData;
  }

  show(settingModalData: DashboardSettingModalData): void {
    this.progressSettingData(settingModalData);
    this.showSettingModal();
  }

  hide(): void {
    this.modal?.hide();
  }

  getCurrentDashboardSetting(): DashboardSetting {
    return new DashboardSetting({
      ...this.settingModalData?.setting,
      enableOverlap: this.overlapSettingItem.value,
      themeName: this.currentTheme
    });
  }

  private onOverlapSettingChanged(key: string, value: boolean) {
    this.overlapSettingItem.value = value;
  }

  private async applySetting(event: MouseEvent): Promise<void> {
    try {
      event.preventDefault();
      this.isLoading = true;
      // khi apply theme se bi stuff ui, wait for render loading complete
      await TimeoutUtils.sleep(200);
      if (this.settingModalData && this.settingModalData.onApply) {
        const setting = this.getCurrentDashboardSetting();
        await this.settingModalData.onApply(setting);
      }
    } finally {
      this.hide();
      this.isLoading = false;
    }
  }

  private cancelSetting(): void {
    _ThemeStore.setDashboardTheme(this.settingModalData?.setting?.themeName ?? DashboardThemeType.Default);
    if (this.settingModalData && this.settingModalData.onCancel) {
      this.settingModalData.onCancel();
    }
  }

  private progressSettingData(settingModalData: DashboardSettingModalData) {
    this.isLoading = false;
    this.settingModalData = cloneDeep(settingModalData);
    this.overlapSettingItem = SettingItem.toggle('overlap', 'Overlap mode', settingModalData.setting.enableOverlap, '');
    this.currentTheme = settingModalData.setting.themeName;
  }

  private showSettingModal() {
    this.$nextTick(() => this.modal?.show());
  }

  protected selectTheme(themeType: DashboardThemeType): void {
    this.currentTheme = themeType;
    const theme = _ThemeStore.getTheme(themeType);
    Object.entries(theme.defaultSettings).forEach(([key, value]) => {
      ObjectUtils.set(this.settingModalData?.setting, key, value);
    });
  }
}
