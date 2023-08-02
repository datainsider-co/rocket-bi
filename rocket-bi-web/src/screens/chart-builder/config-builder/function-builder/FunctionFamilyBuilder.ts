/*
 * @author: tvc12 - Thien Vi
 * @created: 5/20/21, 3:37 PM
 */

import { Field } from '@core/common/domain/model';
import {
  AGGREGATION_FUNCTION_FOR_DATE,
  AGGREGATION_FUNCTION_FOR_NUMBER,
  AGGREGATION_FUNCTION_FOR_TEXT,
  DraggableConfig,
  FunctionFamilyInfo,
  FunctionFamilyTypes,
  GROUP_FUNCTION_FOR_DATE,
  GROUP_FUNCTION_FOR_NUMBER,
  GROUP_FUNCTION_FOR_TEXT,
  NONE_FUNCTION_FOR_DATE,
  NONE_FUNCTION_FOR_NUMBER,
  NONE_FUNCTION_FOR_TEXT,
  AGGREGATION_FUNCTION_FOR_MEASURE
} from '@/shared';
import { DataType } from '@core/schema/service/FieldFilter';

/**
 * Function family builder sử dụng để tạo ra function family and type cho display
 * Nếu có draggableConfig config sẽ ưu tiên lấy default từ draggable config. Ngược lại sẽ lấy default function từ selected function family
 * Yêu cầu field bắt buộc phải không null.
 */
export class FunctionFamilyBuilder {
  private field!: Field;
  private draggableConfig?: DraggableConfig;
  private selectedFunctionFamily?: FunctionFamilyTypes;

  withField(field: Field): FunctionFamilyBuilder {
    this.field = field;
    return this;
  }

  withConfig(draggableConfig: DraggableConfig): FunctionFamilyBuilder {
    this.draggableConfig = draggableConfig;
    return this;
  }

  withSelectedFunction(selectedFunction: FunctionFamilyTypes): FunctionFamilyBuilder {
    this.selectedFunctionFamily = selectedFunction;
    return this;
  }

  build(): FunctionFamilyInfo {
    const dataType: DataType = this.field.getDataType();
    switch (dataType) {
      case DataType.Date:
        return this.draggableConfig?.defaultDateFunctionInfo ?? this.getDefaultDateFunction(this.selectedFunctionFamily);
      case DataType.Text:
        return this.draggableConfig?.defaultTextFunctionInfo ?? this.getDefaultTextFunction(this.selectedFunctionFamily);
      case DataType.Number:
        return this.draggableConfig?.defaultNumberFunctionInfo ?? this.getDefaultNumberFunction(this.selectedFunctionFamily);
      case DataType.Expression:
        return this.getDefaultExpressionFunction();
      default:
        return new FunctionFamilyInfo(FunctionFamilyTypes.dynamic);
    }
  }

  private getDefaultExpressionFunction() {
    return AGGREGATION_FUNCTION_FOR_MEASURE;
  }

  private getDefaultDateFunction(selectedFunction?: FunctionFamilyTypes): FunctionFamilyInfo {
    switch (selectedFunction) {
      case FunctionFamilyTypes.aggregation:
        return AGGREGATION_FUNCTION_FOR_DATE;
      case FunctionFamilyTypes.none:
        return NONE_FUNCTION_FOR_DATE;
      case FunctionFamilyTypes.dateHistogram:
        return GROUP_FUNCTION_FOR_DATE;
      case FunctionFamilyTypes.groupBy:
        return GROUP_FUNCTION_FOR_TEXT;
      default:
        return GROUP_FUNCTION_FOR_DATE;
    }
  }

  private getDefaultTextFunction(selectedFunction?: FunctionFamilyTypes): FunctionFamilyInfo {
    switch (selectedFunction) {
      case FunctionFamilyTypes.groupBy:
        return GROUP_FUNCTION_FOR_TEXT;
      case FunctionFamilyTypes.aggregation:
        return AGGREGATION_FUNCTION_FOR_TEXT;
      case FunctionFamilyTypes.none:
        return NONE_FUNCTION_FOR_TEXT;
      // date histogram for text incorrect
      case FunctionFamilyTypes.dateHistogram:
        return GROUP_FUNCTION_FOR_DATE;
      default:
        return GROUP_FUNCTION_FOR_TEXT;
    }
  }

  private getDefaultNumberFunction(selectedFunction?: FunctionFamilyTypes): FunctionFamilyInfo {
    switch (selectedFunction) {
      case FunctionFamilyTypes.aggregation:
        return AGGREGATION_FUNCTION_FOR_NUMBER;
      // date histogram for date incorrect
      case FunctionFamilyTypes.dateHistogram:
        return GROUP_FUNCTION_FOR_DATE;
      case FunctionFamilyTypes.none:
        return NONE_FUNCTION_FOR_NUMBER;
      case FunctionFamilyTypes.groupBy:
        return GROUP_FUNCTION_FOR_NUMBER;
      default:
        return AGGREGATION_FUNCTION_FOR_NUMBER;
    }
  }
}
