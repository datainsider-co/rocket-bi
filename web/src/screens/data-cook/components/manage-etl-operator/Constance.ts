import LeaderLine from 'leader-line-new';
import { CheckProgressResponse, EtlOperator, GetDataOperator, Position, PositionValue } from '@core/data-cook';
import { DatabaseInfo, TableSchema } from '@core/common/domain';

export class ManageEtlModel {
  dbName = '';
  map: Record<string, EtlOperator> = {};
  mapTable: Record<string, EtlOperator> = {};
  mapLoading: Record<string, boolean> = {};
  mapPreviewData: Record<string, CheckProgressResponse> = {};
  extraData: Record<string, any> = {};
  tablePosition: Record<string, Position> = {};
  savedTablePosition: Record<string, Position> = {};
  savedThirdPartyPosition: Record<string, Position> = {};
  savedEmailConfigPosition: Record<string, Position> = {};
  operatorPosition: Record<string, Position> = {};
  stagePosition: PositionValue = new PositionValue(0, 0);
}

export const FONT_FAMILY = '"Roboto", sans-serif';
export const TEXT_LINE_HEIGHT = 21;
export const TEXT_COLOR = '#4f4f4f';
export const TEXT_SIZE = 14;
export const ACCENT_COLOR = '#597fff';
export const ERROR_COLOR = '#ea6b6b';

export const LLOption: LeaderLine.Options = {
  size: 1,
  color: ACCENT_COLOR,
  endPlug: 'arrow1',
  endPlugSize: 2,
  path: 'grid',
  startSocket: 'right',
  endSocket: 'left'
};

export const LLOptionError: LeaderLine.Options = { ...LLOption, color: ERROR_COLOR };

export type TListOperatorModel<T extends EtlOperator> = {
  items: T[];
  map: {
    [key: string]: T;
  };
};

export enum EVENT_NAME {
  EndPreview = 'endPreview'
}

export const PREVIEW_TIMING = 1000;

// eslint-disable-next-line no-useless-escape
export const ETL_JOB_NAME_INVALID_REGEX = /[\\\/\?\*\"\>\<\:\|@(){}`]/g;

export function increaseDiv(scrollParent: HTMLElement, target: HTMLElement, scrollTop: number, scrollLeft: number, offset: number, increase: number) {
  const $parent = window.$(scrollParent);
  const $target = window.$(target);
  const cWidth = $parent.width();
  const cHeight = $parent.height();

  const dWidth = $target.width();
  const dHeight = $target.height();
  if (scrollTop + cHeight > dHeight - offset) {
    $target.height(dHeight + increase);
  }
  if (scrollLeft + cWidth > dWidth - offset) {
    $target.width(dWidth + increase);
  }
}

export type TTableContextMenuPayload = {
  table?: TableSchema;
  database?: DatabaseInfo;
  operator?: EtlOperator;
};

export enum Distance {
  TableToOperator = 380,
  OperatorToTable = 200,
  TableToTable = 160
}
