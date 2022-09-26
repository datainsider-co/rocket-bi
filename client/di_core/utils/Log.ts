import DiAnalytics from 'di-web-analytics';

export enum LogLevel {
  Off = 0,
  Error = 1,
  Info = 2,
  Debug = 3,
  Trace = 4,
  All = 5
}

export class Log {
  /**
   * return current log level bind to window, default will be Level Off
   */
  static getLevel(): LogLevel {
    return window.logLevel ?? LogLevel.Off;
  }

  static debug(...data: any) {
    Log.printLog(LogLevel.Debug, data);
  }
  static trace(...data: any) {
    Log.printLog(LogLevel.Trace, data);
  }

  static info(...data: any) {
    Log.printLog(LogLevel.Info, data);
    //Doing something with info level (post log, ...)
    if (Log.getLevel() >= LogLevel.Info) {
      Log.postLog('info', ...data);
    }
  }

  static error(...data: any) {
    Log.printLog(LogLevel.Error, data);
    //Doing something with error level (post log, ...)
    if (Log.getLevel() >= LogLevel.Error) {
      Log.postLog('error', ...data);
    }
  }

  private static printLog(level: LogLevel, data: any[]) {
    const enable = window.dumpLog ?? false;
    if (enable) {
      switch (level) {
        case LogLevel.Error:
          // eslint-disable-next-line no-console
          console.error(...data);
          break;
        case LogLevel.Info:
          // eslint-disable-next-line no-console
          console.info(...data);
          break;
        case LogLevel.All:
        case LogLevel.Debug:
          // eslint-disable-next-line no-console
          console.log(...data);
          break;
        case LogLevel.Trace:
          // eslint-disable-next-line no-console
          console.trace(...data);
          break;
        default:
          break;
      }
    }
  }

  private static postLog(level: string, ...data: any[]) {
    const eventLog = `di_web_${level}`;
    const text = data.join(' ');
    DiAnalytics.track(eventLog, {
      message: text
    });
  }
}
