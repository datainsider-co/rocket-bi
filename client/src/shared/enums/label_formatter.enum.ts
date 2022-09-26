export enum LabelFormatter {
  name = '{point.name}',
  namePercent = '{point.name}: {point.percentage:.1f}%',
  nameValue = '{point.name}: {point.y}',
  percent = '{point.percentage:.1f}%',
  value = '{point.y}'
}
export enum LegendFormatter {
  name = '{name}',
  namePercent = '{name}: {percentage:.1f}%',
  nameValue = '{name}: {y}'
}
