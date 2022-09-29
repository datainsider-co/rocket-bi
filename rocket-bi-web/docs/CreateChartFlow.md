**Create a new chart flow**

- [Optional] Create SeriesResponse in [Response folder](di-core/common/domain/response)

- Define **enum**:

  - Define [WidgetType](src/shared/enums/ChartType.ts) for new chart type
  - Define [QuerySettingType](di-core/common/domain/model/query/QuerySettingType.ts) for new query type
  - Define [VizSettingType](di-core/common/domain/model/chart-option/VizSettingType.ts) for new type
  - Define [ChartFamilyType](di-core/common/domain/model/chart-option/ChartFamilyType.ts) for display

- Implement [VizSetting](di-core/common/domain/model/chart-option/ChartOption.ts):

  - Create file in [Implement](di-core/common/domain/model/chart-option/implement)
  - Add **fromObject** for create the object.
  - [Optional] define interface for [VizSettingData](di-core/common/domain/model/chart-option/extra-setting/ChartOptionData.ts)
  - Run `yarn create:index di-core/domain/Model/VizSetting/Implement` for create **install.ts**
  - Use **fromObject** in [VizSetting](di-core/common/domain/model/chart-option/ChartOption.ts)

- Implement [QueryChartSetting](di-core/common/domain/model/query/QuerySetting.ts):

  - Create new file in folder [Implement](di-core/common/domain/model/query/implement)
  - Add **fromObject** for create the object
  - Run `yarn create:index di-core/domain/Model/Query/Implement` for create **install.ts**
  - Use from **fromObject** in [QueryChartSetting](di-core/common/domain/model/query/QuerySetting.ts)

- Define **QuerySettingHandler**:

  - Implement
    class [QuerySettingHandler](src/shared/resolver/query-setting-resolver/query-setting-handler/QuerySettingHandler.ts)
  - Run `yarn create:index src/shared/builder/QuerySettingResolver/QuerySettingHandler` for re-create install.ts
  - Bind implement with [ChartType](src/shared/enums/ChartType.ts)
    to [ChartBuilderModule](src/shared/module/ChartBuilderModule.ts)

- Define **VizSettingHandler**:

  -
  Implement [VisualizationSettingHandler](src/shared/resolver/viz-setting-resolver/viz-setting-handler/VizSettingHandler.ts)

  - Run `yarn create:index src/shared/Resolver/VizSettingResolver/VizSettingHandler` for re-create install.ts
  - Bind implement with [ChartType](src/shared/enums/ChartType.ts)
    to [ChartBuilderModule](src/shared/module/ChartBuilderModule.ts)

- [Optional] Define **PanelHandler**

  - Implement [PanelSettingHandler](src/shared/resolver/PanelSettingResolver/PanelSettingHandler/Implement)
  - Run `yarn create:index src/shared/Resolver/PanelSettingResolver/PanelSettingHandler/Implement` for re-create
    install.ts
  - Bind implement with [ChartType](src/shared/enums/ChartType.ts)
    to [ChartBuilderModule](src/shared/module/ChartBuilderModule.ts)

- Configs chart:

  - Define list [DraggableConfig](src/shared/constants/DataBuilderConstants.ts)
  - Add config to **ALL_CHARTS**

- Define chart:

  - Implement [Chart](src/shared/components/charts)
  - Bind Component to [index](src/shared/components/charts/index.ts)
  - Bind Chart with **VizSettingType** at [ChartWidget](src/screens/dashboard-detail/components/widget-container/charts/chartwidget/ChartComponent.ts)
  - Add convert chart type in **VizSetting**

- Define setting chart in [chart_setting_data](src/shared/constants/chart_setting_data.json)
  👉 ⛄⛄⛄⛄ Completed
