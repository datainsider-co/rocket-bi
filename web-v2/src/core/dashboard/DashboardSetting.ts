import Deneric from 'deneric2';

/**
 * The dashboard's look (`setting` of `GET dashboards/{id}`, v1 `DashboardSetting`). Every class keeps v1's defaults,
 * which apply when the server sends no setting (a new dashboard) or leaves a field out. Field names follow what v1
 * stored, which is snake_case.
 */

export class RadiusInfo extends Deneric {
  topLeft = 20;
  topRight = 20;
  bottomRight = 20;
  bottomLeft = 20;

  constructor(json?: unknown) {
    super({
      topLeft: ['top_left', Number],
      topRight: ['top_right', Number],
      bottomRight: ['bottom_right', Number],
      bottomLeft: ['bottom_left', Number]
    });
    this.fromJson(json);
  }
}

export class BorderInfo extends Deneric {
  width = 1;
  color = '#f2f2f7';
  colorOpacity = 100;
  radius = new RadiusInfo();
  /** `outside` or `inside`; v1 draws both the same way. */
  position = 'outside';

  constructor(json?: unknown, defaults?: { width: number }) {
    super({
      width: ['width', Number],
      color: ['color', String],
      colorOpacity: ['color_opacity', Number],
      radius: ['radius', RadiusInfo],
      position: ['position', String]
    });
    if (defaults) this.width = defaults.width;
    this.fromJson(json);
  }
}

export class BackgroundInfo extends Deneric {
  color: string;
  opacity = 100;

  constructor(json?: unknown, defaultColor = '#FAFAFB') {
    super({
      color: ['color', String],
      opacity: ['opacity', Number]
    });
    this.color = defaultColor;
    this.fromJson(json);
  }
}

export const FitMode = {
  Fill: 'fill',
  Fit: 'fit',
  Stretch: 'stretch',
  Repeat: 'repeat',
  RepeatX: 'repeat-x',
  RepeatY: 'repeat-y',
  Parallax: 'parallax',
  None: 'none'
} as const;

export class BackgroundImageInfo extends Deneric {
  imageName = '';
  path = '';
  fitMode: string = FitMode.Repeat;
  brightness = 100;
  contrast = 100;
  grayscale = 0;
  opacity = 100;

  constructor(json?: unknown) {
    super({
      imageName: ['image_name', String],
      path: ['path', String],
      fitMode: ['fit_mode', String],
      brightness: ['brightness', Number],
      contrast: ['contrast', Number],
      grayscale: ['grayscale', Number],
      opacity: ['opacity', Number]
    });
    this.fromJson(json);
  }
}

export const SizeUnit = { Px: 'px', Percent: '%', Auto: 'auto' } as const;

export class SizeInfo extends Deneric {
  width = 100;
  height = 0;
  widthUnit: string = SizeUnit.Percent;
  heightUnit: string = SizeUnit.Auto;

  constructor(json?: unknown) {
    super({
      width: ['width', Number],
      height: ['height', Number],
      widthUnit: ['width_unit', String],
      heightUnit: ['height_unit', String]
    });
    this.fromJson(json);
  }
}

export class TextStyleSetting extends Deneric {
  fontFamily = 'Roboto';
  fontSize: string;
  fontWeight: string;
  textAlign = 'center';
  color: string;
  colorOpacity = 100;
  isBold = false;
  isItalic = false;
  isUnderline = false;

  constructor(json: unknown, defaults: { fontSize: string; fontWeight: string; color: string }) {
    super({
      fontFamily: ['font_family', String],
      fontSize: ['font_size', String],
      fontWeight: ['font_weight', String],
      textAlign: ['text_align', String],
      color: ['color', String],
      colorOpacity: ['color_opacity', Number],
      isBold: ['is_bold', Boolean],
      isItalic: ['is_italic', Boolean],
      isUnderline: ['is_underline', Boolean]
    });
    this.fontSize = defaults.fontSize;
    this.fontWeight = defaults.fontWeight;
    this.color = defaults.color;
    this.fromJson(json);
  }
}

function field(json: unknown, key: string): unknown {
  return typeof json === 'object' && json !== null ? (json as Record<string, unknown>)[key] : undefined;
}

/** Defaults for every widget of the dashboard (v1 "Edit Widgets"). */
export class WidgetSetting extends Deneric {
  primaryText: TextStyleSetting;
  secondaryText: TextStyleSetting;
  padding = 15;
  border: BorderInfo;
  background: BackgroundInfo;

  constructor(json?: unknown) {
    super({ padding: ['padding', Number] });
    // deneric2 can't pass constructor arguments to nested entities, so the ones with their own defaults are built here.
    this.primaryText = new TextStyleSetting(field(json, 'primary_text'), { fontSize: '20px', fontWeight: '500', color: '#4f4f4f' });
    this.secondaryText = new TextStyleSetting(field(json, 'secondary_text'), {
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#5f6368'
    });
    this.border = new BorderInfo(field(json, 'border'), { width: 0 });
    this.background = new BackgroundInfo(field(json, 'background'), '#FFFFFF');
    this.fromJson(json);
  }

  override toJson(): Record<string, unknown> {
    return {
      ...(super.toJson() as Record<string, unknown>),
      primary_text: this.primaryText.toJson(),
      secondary_text: this.secondaryText.toJson(),
      border: this.border.toJson(),
      background: this.background.toJson()
    };
  }
}

export class AutoRefreshSetting extends Deneric {
  isAutoRefresh = false;
  refreshIntervalMs = 10_000;

  constructor(json?: unknown) {
    super({
      isAutoRefresh: ['is_auto_refresh', Boolean],
      refreshIntervalMs: ['refresh_interval_ms', Number]
    });
    this.fromJson(json);
  }
}

/** v1 `MainDateFilter2`: the date range picker in the dashboard header. Its widget id is fixed. */
export class MainDateFilterSetting extends Deneric {
  static readonly ID = -99887766;

  id = MainDateFilterSetting.ID;
  /** v1 `MainDateMode`, `all_time` when unset. */
  mode = 'all_time';

  constructor(json?: unknown) {
    super({
      id: ['id', Number],
      mode: ['mode', String]
    });
    this.fromJson(json);
  }
}

export class DashboardSetting extends Deneric {
  version = '1';
  enableOverlap = false;
  /** A `DashboardThemeType` value; v1 fell back to the app's light/dark default. */
  themeName = 'light_default';
  mainDateFilter?: MainDateFilterSetting;
  border = new BorderInfo();
  size = new SizeInfo();
  backgroundImage = new BackgroundImageInfo();
  background = new BackgroundInfo();
  widgetSetting = new WidgetSetting();
  autoRefreshSetting = new AutoRefreshSetting();

  constructor(json?: unknown) {
    super({
      version: ['version', String],
      enableOverlap: ['enable_overlap', Boolean],
      themeName: ['theme_name', String],
      border: ['border', BorderInfo],
      size: ['size', SizeInfo],
      backgroundImage: ['background_image', BackgroundImageInfo],
      background: ['background', BackgroundInfo],
      autoRefreshSetting: ['auto_refresh_setting', AutoRefreshSetting]
    });
    this.widgetSetting = new WidgetSetting(field(json, 'widget_setting'));
    const mainDate = field(json, 'main_date_filter');
    this.mainDateFilter = mainDate ? new MainDateFilterSetting(mainDate) : undefined;
    this.fromJson(json);
  }

  override toJson(): Record<string, unknown> {
    return {
      ...(super.toJson() as Record<string, unknown>),
      widget_setting: this.widgetSetting.toJson(),
      main_date_filter: this.mainDateFilter?.toJson()
    };
  }
}
