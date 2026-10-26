/**
 * A typed key for one dependency. Identity is the object itself; `name` is only for error messages.
 * `T` is carried by the phantom `type` field so `get(token)` returns the right type.
 */
export interface Token<T> {
  readonly name: string;
  readonly type?: T;
}

export function token<T>(name: string): Token<T> {
  return Object.freeze({ name });
}

export interface DiResolver {
  get<T>(key: Token<T>): T;
}

export interface DiBinder {
  bindValue<T>(key: Token<T>, value: T): void;
  /** `factory` runs on the first `get`, then its result is reused. */
  bindSingleton<T>(key: Token<T>, factory: (di: DiResolver) => T): void;
}

/** Registers bindings. Later modules override earlier ones, so a test module can replace a real one. */
export type DiModule = (di: DiBinder) => void;

type Binding = { kind: 'value'; value: unknown } | { kind: 'singleton'; factory: (di: DiResolver) => unknown };

export class DiContainer implements DiBinder, DiResolver {
  readonly #bindings = new Map<Token<unknown>, Binding>();
  readonly #instances = new Map<Token<unknown>, unknown>();
  readonly #resolving: Token<unknown>[] = [];

  bindValue<T>(key: Token<T>, value: T): void {
    this.#bindings.set(key, { kind: 'value', value });
    this.#instances.delete(key);
  }

  bindSingleton<T>(key: Token<T>, factory: (di: DiResolver) => T): void {
    this.#bindings.set(key, { kind: 'singleton', factory });
    this.#instances.delete(key);
  }

  get<T>(key: Token<T>): T {
    const binding = this.#bindings.get(key);
    if (!binding) {
      throw new Error(`DI: no binding for ${key.name}`);
    }
    if (binding.kind === 'value') {
      return binding.value as T;
    }
    if (this.#instances.has(key)) {
      return this.#instances.get(key) as T;
    }
    if (this.#resolving.includes(key)) {
      const cycle = [...this.#resolving, key].map(t => t.name).join(' -> ');
      throw new Error(`DI: circular dependency ${cycle}`);
    }

    this.#resolving.push(key);
    try {
      const instance = binding.factory(this);
      this.#instances.set(key, instance);
      return instance as T;
    } finally {
      this.#resolving.pop();
    }
  }
}

export function createContainer(modules: readonly DiModule[]): DiContainer {
  const container = new DiContainer();
  for (const module of modules) module(container);
  return container;
}
