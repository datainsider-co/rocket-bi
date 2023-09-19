import { Annotation } from './Annotation';

const runningMethodSet = new Set<string>();

function toMethodName(key: PropertyKey): string {
  return `__di_atomic_action_${String(key)}__`;
}

function applyUnlockMethod(methodName: string, delayMs: number): number {
  return setTimeout(() => runningMethodSet.delete(methodName), delayMs);
}

/**
 * Limit the execution of a method to once every `delayMs` milliseconds.
 */
export const AtomicAction = (delayMs = 700) =>
  Annotation.create((key: PropertyKey) => toMethodName(key), {
    transformOriginFn: (originFn: () => any, key, args) => {
      const methodName: string = toMethodName(key);
      if (runningMethodSet.has(methodName)) {
        return;
      }
      // Simple lock, it's not perfect but it's good enough for now
      runningMethodSet.add(methodName);
      try {
        const result = originFn();
        if (result && result instanceof Promise) {
          return (result as Promise<any>).finally(() => applyUnlockMethod(methodName, delayMs));
        } else {
          applyUnlockMethod(methodName, delayMs);
          return result;
        }
      } catch (ex) {
        applyUnlockMethod(methodName, delayMs);
        throw ex;
      }
    }
  });
