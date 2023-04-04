import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Column, TableSchema } from '@core/common/domain/model';
import { ListUtils } from '@/utils';

/* eslint @typescript-eslint/camelcase: 0 */

/* eslint @typescript-eslint/no-use-before-define: 0*/

export interface FunctionInfo {
  name: string;
  title?: string;
  description: string;
  example?: string;
}

export abstract class SupportedFunctionInfo {
  // list keyword supported
  // @ts-ignore
  useFunctions!: string[];

  [key: string]: FunctionInfo[];

  static empty() {
    return { useFunctions: [] };
  }
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.formulaSuggestionStore })
export class FormulaSuggestionStore extends VuexModule {
  // private supportedFunctions: any = require('@/shared/data/supported_function.json');
  private tableSchema: TableSchema | null = null;

  private supportedFunctionInfo: SupportedFunctionInfo = SupportedFunctionInfo.empty();

  get supportedFunctionNames(): string[] {
    return this.supportedFunctionInfo.useFunctions ?? [];
  }

  get getFunctionInfo(): (keyword: string) => FunctionInfo | undefined {
    return (keyword: string) => this.allFunctions.find(fn => fn.name === keyword);
  }

  get getFunctions(): (selectedFunction: string) => FunctionInfo[] {
    return (selectedFunction: string) => {
      return this.supportedFunctionInfo[`${selectedFunction}`] ?? [];
    };
  }

  get allFunctions(): FunctionInfo[] {
    return this.supportedFunctionNames.flatMap(name => this.getFunctions(name));
  }

  get columns(): Column[] {
    return this.tableSchema?.columns ?? [];
  }

  @Mutation
  reset() {
    this.tableSchema = null;
  }

  /**
   * Init suggestion with fileNames, file must in folder model
   * @param payload.fileNames file in  @/shared/data
   * @param payload.useFunctions Chi dinh ra cac loai function se dung, mac dinh la su dung tat ca
   * @param payload.ignoreFunctions Chi dinh ra cac loai function se bi ignore, mac dinh khong ignore function nao
   */
  @Mutation
  initSuggestFunction(payload: { fileNames: string[]; useFunctions?: string[]; ignoreFunctions?: string[] }): void {
    const { fileNames, useFunctions, ignoreFunctions } = payload;

    const functionsList: SupportedFunctionInfo[] = fileNames.map(fileName => require('@/shared/data/' + fileName));
    const functionInfoList = SupportedFunctionInfo.empty();
    functionsList.forEach(supportedInfo => Object.assign(functionInfoList, supportedInfo));

    // tu dong lay useFunctions, neu khong co thi lay all keys -> useFunctions
    const supportedFunctions: string[] = ListUtils.isNotEmpty(useFunctions) ? useFunctions! : Object.keys(functionInfoList);
    // always ignore useFunctions keys
    const ignoreFunctionAsSet: Set<string> = new Set((ignoreFunctions ?? []).concat('useFunctions'));
    const finalSupportedFunctions: string[] = ListUtils.remove(supportedFunctions, item => ignoreFunctionAsSet.has(item));

    Object.assign(functionInfoList, { useFunctions: finalSupportedFunctions });

    this.supportedFunctionInfo = functionInfoList;
  }

  @Mutation
  setTableSchema(tableSchema: TableSchema): void {
    this.tableSchema = tableSchema;
  }
}

export const FormulaSuggestionModule: FormulaSuggestionStore = getModule(FormulaSuggestionStore);
