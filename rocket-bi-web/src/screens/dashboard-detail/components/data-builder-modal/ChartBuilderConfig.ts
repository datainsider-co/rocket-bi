import { ChartInfo } from '@core/common/domain';
import { DataBuilderConstantsV35, VisualizationItemData } from '@/shared';

export const DefaultChartBuilderConfig: ChartBuilderConfig = {
  databaseConfig: {
    showSelectDatabase: true,
    useTabControl: true
  },
  builderConfig: {
    vizItems: [...DataBuilderConstantsV35.ALL_CHARTS, ...DataBuilderConstantsV35.ALL_FILTERS].filter(item => !item.isHidden),
    showFilterConfig: true,
    showGeneralConfig: true,
    showSortConfig: true,
    showVizListing: true
  },
  previewConfig: {
    showSetting: true
  }
};

export const RLSFilterBuilderConfig: ChartBuilderConfig = {
  databaseConfig: {
    showSelectDatabase: false,
    useTabControl: false
  },
  builderConfig: {
    vizItems: [DataBuilderConstantsV35.ALL_CHARTS[0]], ///Table
    showFilterConfig: true,
    showGeneralConfig: false,
    showSortConfig: false,
    showVizListing: false
  },
  previewConfig: {
    showSetting: false
  }
};

export const ControlBuilderConfig: ChartBuilderConfig = {
  databaseConfig: {
    showSelectDatabase: true,
    useTabControl: false
  },
  builderConfig: {
    vizItems: DataBuilderConstantsV35.MULTIPLE_MEASURES,
    showFilterConfig: false,
    showGeneralConfig: true,
    showSortConfig: false,
    showVizListing: true
  },
  previewConfig: {
    showSetting: true
  }
};

export const AdhocBuilderConfig: ChartBuilderConfig = {
  databaseConfig: {
    showSelectDatabase: false,
    useTabControl: false,
    hideTableAction: true
  },
  builderConfig: {
    vizItems: [...DataBuilderConstantsV35.ALL_CHARTS, ...DataBuilderConstantsV35.ALL_FILTERS].filter(item => !item.isHidden),
    showFilterConfig: true,
    showGeneralConfig: true,
    showSortConfig: true,
    showVizListing: true
  },
  previewConfig: {
    showSetting: true
  }
};

export interface ChartBuilderConfig {
  headerConfig?: HeaderConfig;
  databaseConfig?: DatabaseListingConfig;
  builderConfig?: BuilderConfig;
  previewConfig?: PreviewConfig;
}

export interface HeaderConfig {
  title?: string;
  actionName?: string;
  cancelName?: string;
}

export interface PreviewConfig {
  showSetting?: boolean;
}

export interface BuilderConfig {
  showVizListing?: boolean;
  vizItems?: VisualizationItemData[];
  showGeneralConfig?: boolean;
  showSortConfig?: boolean;
  showFilterConfig?: boolean;
}

export interface DatabaseListingConfig {
  showSelectDatabase?: boolean;
  useTabControl?: boolean;
  hideTableAction?: boolean;
}
