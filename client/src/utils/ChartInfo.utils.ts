import { WidgetId } from '@core/domain';

export abstract class ChartInfoUtils {
  private static id = 1;

  ///Tính toán lại Id của Chart Filter của Chart Widget
  ///Cộng thêm 10 và đảo số về số âm (do widgetID có 3 số 0,1,2 là trường hợp đặc biệt k thể đảo dấu đc)
  static generatedChartFilterId(parentId: WidgetId): WidgetId {
    return (parentId + 10) * -1;
  }

  ///Tính toán lại Id của Parent Filter của Chart Widget
  ///Trừ 10 và đảo số về số dương (do widgetID có 3 số 0,1,2 là trường hợp đặc biệt k thể đảo dấu đc)
  static generatedChartParentId(id: WidgetId): WidgetId {
    return id * -1 - 10;
  }

  static isChartFilterId(id: WidgetId): boolean {
    if (id === 0 || id === -1 || id === -2) {
      return false;
    }
    if (id < 0) {
      return true;
    }
    return false;
  }

  //increasemental id
  static getNextId() {
    return ++this.id;
  }
}
