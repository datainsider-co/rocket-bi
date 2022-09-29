import { DIException } from '../../../common/domain/exception/DIException';
import { QueryState } from '@core/lake-house';

export enum LakeHouseCode {
  Success = 0,
  Fail = 1,
  Exception = 2,
  NullPtr = 3,
  InvalidParam = 4,
  InvalidData = 5,
  InvalidOperation = 6,
  NotFound = 7,
  OutRange = 8,
  NotExist = 9,
  AlreadyExist = 10,
  Empty = 11,
  Unsupported = 12,
  Unloaded = 13,
  Timeout = 14,
  Overflow = 15,
  Underflow = 16,
  NotServe = 17,
  NotPermit = 18,
  NotAllow = 19,
  Unreadable = 20,
  Unwritable = 21,
  WrongAuth = 22,
  NOT_CONNECTED = 23,
  BadConnection = 24,
  LowMem = 25,
  LowDiskSpace = 26,
  ReachMax = 27,
  NotOpened = 28,
  InvalidHdr = 29,
  NotFit = 30,
  NotMatched = 31,
  EndFile = 32,
  Unchanged = 33,
  Duplicated = 34,
  NoConnection = 35,
  Overload = 36,
  SvrMoved = 37,
  Warning = 40
}

export abstract class LakeHouseResponse {
  protected constructor(public code: LakeHouseCode = LakeHouseCode.Success, public msg?: string | null) {}

  /**
   * Check response success, if error, throw DiException
   */
  static ensureValidResponse(response: LakeHouseResponse): void {
    if (response.code !== LakeHouseCode.Success) {
      throw new DIException(response.msg ?? 'Response invalid', response.code, response.code?.toString());
    }
  }
}
