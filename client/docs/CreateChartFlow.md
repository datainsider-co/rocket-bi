**Create a new chart flow**

- [Optional] Create SeriesResponse in [Response folder](di_core/domain/Response)

- Define **enum**:

  - Define [WidgetType](src/shared/enums/ChartType.ts) for new chart type
  - Define [QuerySettingType](di_core/domain/Model/Query/QuerySettingType.ts) for new query type
  - Define [VizSettingType](di_core/domain/Model/ChartOption/VizSettingType.ts) for new type
  - Define [ChartFamilyType](di_core/domain/Model/ChartOption/ChartFamilyType.ts) for display

- Implement [VizSetting](di_core/domain/Model/ChartOption/ChartOption.ts):

  - Create file in [Implement](di_core/domain/Model/ChartOption/Implement)
  - Add **fromObject** for create the object.
  - [Optional] define interface for [VizSettingData](di_core/domain/Model/ChartOption/ExtraSetting/ChartOptionData.ts)
  - Run `yarn create:index di_core/domain/Model/VizSetting/Implement` for create **install.ts**
  - Use **fromObject** in [VizSetting](di_core/domain/Model/ChartOption/ChartOption.ts)

- Implement [QueryChartSetting](di_core/domain/Model/Query/QuerySetting.ts):

  - Create new file in folder [Implement](di_core/domain/Model/Query/Implement)
  - Add **fromObject** for create the object
  - Run `yarn create:index di_core/domain/Model/Query/Implement` for create **install.ts**
  - Use from **fromObject** in [QueryChartSetting](di_core/domain/Model/Query/QuerySetting.ts)

- Define **QuerySettingHandler**:

  - Implement
    class [QuerySettingHandler](src/shared/Resolver/QuerySettingResolver/QuerySettingHandler/QuerySettingHandler.ts)
  - Run `yarn create:index src/shared/builder/QuerySettingResolver/QuerySettingHandler` for re-create install.ts
  - Bind implement with [ChartType](src/shared/enums/ChartType.ts)
    to [ChartBuilderModule](src/shared/module/ChartBuilderModule.ts)

- Define **VizSettingHandler**:

  -
  Implement [VisualizationSettingHandler](src/shared/Resolver/VizSettingResolver/VizSettingHandler/VizSettingHandler.ts)

  - Run `yarn create:index src/shared/Resolver/VizSettingResolver/VizSettingHandler` for re-create install.ts
  - Bind implement with [ChartType](src/shared/enums/ChartType.ts)
    to [ChartBuilderModule](src/shared/module/ChartBuilderModule.ts)

- [Optional] Define **PanelHandler**

  - Implement [PanelSettingHandler](src/shared/Resolver/PanelSettingResolver/PanelSettingHandler/Implement)
  - Run `yarn create:index src/shared/Resolver/PanelSettingResolver/PanelSettingHandler/Implement` for re-create
    install.ts
  - Bind implement with [ChartType](src/shared/enums/ChartType.ts)
    to [ChartBuilderModule](src/shared/module/ChartBuilderModule.ts)

- Configs chart:

  - Define list [DraggableConfig](src/shared/constants/data_builder.constants.ts)
  - Add config to **ALL_CHARTS**

- Define chart:

  - Implement [Chart](src/shared/components/charts)
  - Bind Component to [index](src/shared/components/charts/index.ts)
  - Bind Chart with **VizSettingType** at [ChartWidget](src/screens/DashboardDetail/components/WidgetContainer/charts/ChartWidget/ChartComponentController.ts)
  - Add convert chart type in **VizSetting**

- Define setting chart in [chart_setting_data](src/shared/constants/chart_setting_data.json)
  👉 ⛄⛄⛄⛄ Completed
