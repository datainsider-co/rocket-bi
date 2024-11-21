import DIException from '@core/common/domain/exception/DIException';

export class DIApiException extends DIException {
  constructor(message: string, statusCode?: number, reason?: string) {
    super(message, statusCode, reason);
  }

  static fromObject(object: any): DIApiException {
    if (DIApiException.isNewFormat(object)) {
      return new DIApiException(object.error.message, object.error.code, object.error.reason);
    } else {
      return new DIApiException(object.message ?? object.msg, object.code, object.reason);
    }
  }

  /**
   * new format is like this:
   * {
   * 	"success": false,
   * 	"error": {
   * 		"code": 500,
   * 		"reason": "internal_error",
   * 		"message": "Internal Server Error"
   * 	}
   * }
   */
  protected static isNewFormat(object: any): boolean {
    return object.success === false && object.error;
  }
}
