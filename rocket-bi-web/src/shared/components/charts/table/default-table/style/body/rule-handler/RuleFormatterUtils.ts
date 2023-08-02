/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 11:31 PM
 */

import { ColorFormatting, IconFormatting, MinMaxData } from '@core/common/domain';
import { HeaderData } from '@/shared/models';
import { RuleResolver } from '@chart/table/default-table/style/body/rule-handler/RuleResolver';

export class RuleFormatterUtils {
  static getColor(colorFormatting: ColorFormatting, header: HeaderData, minMaxData: MinMaxData, rowData: any): string | undefined {
    const value = rowData[header.key];
    const ruleResolver = new RuleResolver(colorFormatting.rules?.colorRules ?? [], minMaxData);
    return ruleResolver.getColor(value);
  }

  static getFooterColor(colorFormatting: ColorFormatting, header: HeaderData, minMaxData: MinMaxData): string | undefined {
    const value = header.total as any;
    const ruleResolver = new RuleResolver(colorFormatting.rules?.colorRules ?? [], minMaxData);
    return ruleResolver.getColor(value);
  }

  static getIcon(iconFormatting: IconFormatting, header: HeaderData, minMaxData: MinMaxData, rowData: any): string | undefined {
    const value = rowData[header.key];
    const ruleResolver = new RuleResolver(iconFormatting.rules?.iconRules ?? [], minMaxData);
    return ruleResolver.getColor(value);
  }

  static getFooterIcon(iconFormatting: IconFormatting, header: HeaderData, minMaxData: MinMaxData): string | undefined {
    const value = header.total as any;
    const ruleResolver = new RuleResolver(iconFormatting.rules?.iconRules ?? [], minMaxData);
    return ruleResolver.getColor(value);
  }
}
