// /*
//  * @author: tvc12 - Thien Vi
//  * @created: 1/20/21, 5:26 PM
//  */
//
// import { WidgetRenderer } from '@chart/WidgetRenderer/WidgetRenderer';
// import DateFilter from '@chart/DateFilter/DateFilter';
// import { StringUtils } from '@/utils/string.utils';
// import DateSelectFilter from '@chart/DateFilter/DateSelectFilter.vue';
// import DiDatePicker from '@/shared/components/DiDatePicker.vue';
//
// export class DefaultDateFilter implements WidgetRenderer<DateFilter> {
//   render(widget: DateFilter, h: any): any {
//     const enableTitle = widget.setting.options.title?.enabled ?? true;
//     const enableSubTitle = widget.setting.options.subtitle?.enabled ?? true;
//     return (
//       <div class={widget.containerClass} style={widget.containerStyle}>
//         <div class="tab-filter-info">
//           {enableTitle && (
//             <div class={widget.titleClass} title={widget.title} style={widget.titleStyle}>
//               {widget.title}
//             </div>
//           )}
//           {enableSubTitle && this.renderSubtitle(widget, h)}
//         </div>
//         {this.renderFilter(widget, h)}
//       </div>
//     );
//   }
//
//   private renderSubtitle(widget: DateFilter, h: any) {
//     if (!!widget.subTitle && StringUtils.isNotEmpty(widget.subTitle)) {
//       // eslint-disable-next-line no-console
//       return (
//         <div class={widget.subtitleClass} style={widget.subtitleStyle}>
//           <div>{widget.subTitle}</div>
//         </div>
//       );
//     }
//     return <div></div>;
//   }
//
//   private renderFilter(widget: DateFilter, h: any) {
//     return (
//       <DateSelectFilter
//         id={widget.idAsString}
//         isPreview={widget.isPreview}
//         dateConditionType={widget.histogramCondition}
//         value={widget.currentValue}
//         onChange={widget.handleFilterChange}
//         minDate={widget.min}
//         maxDate={widget.max}
//       />
//     );
//   }
// }
