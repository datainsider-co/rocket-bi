import { DefaultSize, SizeAsMap } from '@/shared';
import { ChartInfo, DIMap, Position, TabWidget, Widget } from '@core/common/domain/model';
import { ObjectUtils } from '@core/utils/ObjectUtils';
import { cloneDeep } from 'lodash';

export abstract class PositionUtils {
  static getPosition(widget: Widget) {
    if (TabWidget.isTabWidget(widget)) {
      return new Position(-1, -1, 24, 16, 1);
    } else if (ChartInfo.isChartInfo(widget)) {
      const [width, height] = widget.setting.getDefaultSize();
      // const [width, height] = widget.setting.getChartOption()?.className
      //   ? SizeAsMap.get(widget.setting.getChartOption()?.className!) ?? DefaultSize
      //   : DefaultSize;
      return new Position(-1, -1, width, height, 1);
    } else {
      return new Position(-1, -1, 8, 3, 1);
    }
  }

  static calculateZIndex(mapPosition: DIMap<Position>): DIMap<Position> {
    const min = this.getMinZIndex(mapPosition);
    const isRequiredCalculateZIndex = min > 0;
    if (isRequiredCalculateZIndex) {
      return this.reCalculateZIndex(mapPosition, min);
    } else {
      return cloneDeep(mapPosition);
    }
  }

  static getMaxZIndex(mapPosition: DIMap<Position>) {
    let maxIndex = 1;
    Object.keys(mapPosition).forEach(key => {
      const position = mapPosition[+key];
      maxIndex = Math.max(position.zIndex || 0, maxIndex);
    });
    return maxIndex;
  }

  static getMinZIndex(mapPosition: DIMap<Position>) {
    let minZIndex = ObjectUtils.getHead(mapPosition)?.zIndex || 1;
    Object.keys(mapPosition).forEach(key => {
      const position = mapPosition[+key];
      minZIndex = Math.min(position.zIndex || 0, minZIndex);
    });
    return minZIndex;
  }

  private static reCalculateZIndex(mapPosition: DIMap<Position>, min: number): DIMap<Position> {
    const clonedMapPosition = cloneDeep(mapPosition);
    Object.keys(clonedMapPosition).forEach(key => {
      const position = clonedMapPosition[+key];
      position.zIndex = position.zIndex - min;
    });
    return clonedMapPosition;
  }
}
