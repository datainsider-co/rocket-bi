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

  static empty(): SupportedFunctionInfo {
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
   * Init supported function with functionList
   * @param payload.functionList all function supported
   * @param payload.useFunctions if not empty, only use these functions. Otherwise, use all keys
   * @param payload.ignoreFunctions if not empty, ignore these functions. Otherwise, ignore nothing
   */
  @Mutation
  loadSuggestions(payload: { supportedFunctionInfo: SupportedFunctionInfo; useFunctions?: string[]; ignoreFunctions?: string[] }): void {
    const { supportedFunctionInfo, useFunctions, ignoreFunctions } = payload;
    const finalFunctionInfo: SupportedFunctionInfo = SupportedFunctionInfo.empty();
    Object.assign(finalFunctionInfo, supportedFunctionInfo);

    const supportedFunctions: string[] = ListUtils.isNotEmpty(useFunctions) ? useFunctions! : Object.keys(finalFunctionInfo);
    // always ignore useFunctions keys
    const ignoreFunctionAsSet: Set<string> = new Set((ignoreFunctions ?? []).concat('useFunctions'));
    const finalSupportedFunctions: string[] = ListUtils.remove(supportedFunctions, item => ignoreFunctionAsSet.has(item));

    Object.assign(finalFunctionInfo, { useFunctions: finalSupportedFunctions });

    this.supportedFunctionInfo = finalFunctionInfo;
  }

  @Mutation
  setTableSchema(tableSchema: TableSchema): void {
    this.tableSchema = tableSchema;
  }
}

export const FormulaSuggestionModule: FormulaSuggestionStore = getModule(FormulaSuggestionStore);
