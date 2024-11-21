import { PopupUtils, StringUtils } from '@/utils';
import { ChartType, ConfigType, FunctionTreeNode } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { DIException } from '@core/common/domain';
import { Di } from '@core/common/modules';
import { Log } from '@core/utils';
import { ChartBuilderFunction } from '@/shared/components/chat/controller/functions/ChartBuilderFunction';
import EventBus from '@/shared/components/chat/helpers/EventBus';
import { TableSchemaPicker } from '@/shared/components/chat/controller/functions/TableSchemaPicker';
import { ChartPromptRequest } from '@/shared/components/chat/controller/functions/prompt-builder/promt-chart-builder/ChartPromptFactory';

export enum ChartBuilderEvent {
  addConfig = 'add_config',
  analyzingPrompt = 'analyzing_prompt',
  analyzePromptCompleted = 'analyze_prompt_completed'
}

class ChartTypePicker {
  /**
   * Retrieves the current chart type.
   *
   * @returns {ChartType} The current chart type.
   * @throws {DIException} If the current chart type is not supported.
   */
  static get(): ChartType {
    const { type } = _ConfigBuilderStore.itemSelected;

    if (!ChartTypePicker.canGenerateChart(type)) {
      throw new DIException(`${type} is not supported!`);
    }

    return type as ChartType;
  }

  private static canGenerateChart(type: string): boolean {
    return Di.get(ChartBuilderFunction).canExecute(type as ChartType); ///Just mock, will change later
  }
}

export class ChartGenerator {
  async process(prompt: string) {
    try {
      EventBus.$emit(ChartBuilderEvent.analyzingPrompt);
      const response: Map<ConfigType, FunctionTreeNode[]> = await Di.get(ChartBuilderFunction).execute(this.buildChartPromptPayload(prompt));
      EventBus.$emit(ChartBuilderEvent.analyzePromptCompleted);
      response.forEach((nodes, type) => {
        EventBus.$emit(ChartBuilderEvent.addConfig, type, nodes);
      });
    } catch (ex) {
      Log.error('ChartGenerator::process', ex);
      PopupUtils.showError(DIException.fromObject(ex).getPrettyMessage());
    } finally {
      EventBus.$emit(ChartBuilderEvent.analyzePromptCompleted);
    }
  }

  static isValid(prompt: string): boolean {
    return StringUtils.isNotEmpty(prompt.trim());
  }

  private buildChartPromptPayload(prompt: string): ChartPromptRequest {
    return {
      prompt: prompt.trim(),
      chartType: ChartTypePicker.get(),
      tableSchema: TableSchemaPicker.get()
    };
  }
}
