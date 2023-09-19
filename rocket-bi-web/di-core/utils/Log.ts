/* eslint-disable no-console */
import DiAnalytics from 'di-web-analytics';

export enum LogLevel {
  // No Logging
  Off = 0,
  // The application is unusable. Action needs to be taken immediately.
  Fatal = 100,
  // An error occurred in the application.
  Error = 200,
  // Something unexpected—though not necessarily an error—happened and needs to be watched.
  Warn = 300,
  // Something normal, but notable, happened.
  Info = 400,
  //  For debugging purposes: fine-grained information about the application's state.
  Debug = 500,
  // For debugging purposes: tracing information about the application's execution.
  Trace = 600,
  All = 1000
}

export class Log {
  /**
   * return current log level bind to window, default will be Level Off
   */
  static getLevel(): LogLevel {
    return window.logLevel ?? LogLevel.Off;
  }

  /**
   * Log to console in debug mode
   */
  static debug(...data: any): void {
    Log.printLog(LogLevel.Debug, data);
  }

  /**
   * Log to console in trace mode
   */
  static trace(...data: any): void {
    Log.printLog(LogLevel.Trace, data);
  }

  /**
   * Log to console in info mode
   */
  static info(...data: any): void {
    Log.printLog(LogLevel.Info, data);
    Log.postLog(LogLevel.Info, ...data);
  }

  /**
   * Log to console in error mode.
   * Always post to tracking service
   */
  static error(...data: any) {
    Log.printLog(LogLevel.Error, data);
    Log.postLog(LogLevel.Error, ...data);
  }

  /**
   * Log to console in warn mode
   */
  static warn(...data: any): void {
    Log.printLog(LogLevel.Warn, data);
    Log.postLog(LogLevel.Warn, ...data);
  }

  /**
   * Log to console in fatal mode. This is the highest level of logging
   * Always dump to console & post to tracking service
   */
  static fatal(...data: any) {
    Log.printLog(LogLevel.Fatal, data);
    Log.postLog(LogLevel.Fatal, ...data);
  }

  private static canPrint(level: LogLevel): boolean {
    return window.dumpLog && level <= Log.getLevel();
  }

  private static printLog(level: LogLevel, data: any[]): void {
    switch (level) {
      case LogLevel.Fatal: {
        console.error(...data);
        break;
      }
      case LogLevel.Error: {
        if (Log.canPrint(LogLevel.Error)) {
          console.error(...data);
        }
        break;
      }
      case LogLevel.Info: {
        if (Log.canPrint(LogLevel.Info)) {
          console.info(...data);
        }
        break;
      }
      case LogLevel.All:
      case LogLevel.Debug: {
        if (Log.canPrint(LogLevel.Debug)) {
          console.log(...data);
        }
        break;
      }
      case LogLevel.Trace: {
        if (Log.canPrint(LogLevel.Trace)) {
          console.trace(...data);
        }
        break;
      }
      default:
        break;
    }
  }

  private static postLog(currentLevel: LogLevel, ...data: any[]): void {
    if (currentLevel <= LogLevel.Error) {
      // TODO: post log to tracking service
      const eventLog = `di_web_${Log.toLogEventName(currentLevel)}`;
      const text = data.join(' ');
      DiAnalytics.track(eventLog, { message: text });
    }
  }

  private static toLogEventName(level: LogLevel): string {
    switch (level) {
      case LogLevel.Fatal:
        return 'Fatal';
      case LogLevel.Error:
        return 'Error';
      case LogLevel.Warn:
        return 'Warn';
      case LogLevel.Info:
        return 'Info';
      case LogLevel.Debug:
        return 'Debug';
      case LogLevel.Trace:
        return 'Trace';
      default:
        return 'Unknown';
    }
  }
}
