export abstract class TimeoutUtils {
  public static waitAndExec(oldId?: number | null, fn?: () => void, time = 1000): number {
    if (oldId) {
      clearTimeout(oldId);
    }
    if (fn) {
      return window.setTimeout(fn, time);
    } else {
      return -1;
    }
  }

  public static clear(oldId?: number | null): void {
    if (oldId) {
      clearTimeout(oldId);
    }
  }

  /**
   * Function for testing
   */
  public static waitAndExecuteAsPromise<T>(fn: () => Promise<any>, time = 100): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      try {
        // set time out
        setTimeout(async () => {
          try {
            const result = await fn();
            // ok
            resolve(result);
          } catch (ex) {
            reject(ex);
          }
        }, time);
      } catch (ex) {
        // reject
        reject(ex);
      }
    });
  }

  /**
   * Same sleep in java :v
   */
  static sleep(timeMills: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeMills));
  }
}
