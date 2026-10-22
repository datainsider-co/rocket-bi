import type { KyInstance } from 'ky';
import type { ApiError } from './ApiError';
import { createHttpClient } from './createHttpClient';
import type { HttpClientOptions } from './createHttpClient';

/** Fluent wrapper over `createHttpClient`, mirroring v1's `ClientBuilder`. */
export class HttpClientBuilder {
  #options: HttpClientOptions;

  constructor(prefix: string) {
    this.#options = { prefix };
  }

  withTimeout(timeout: number): this {
    this.#options = { ...this.#options, timeout };
    return this;
  }

  withHeaders(getHeaders: () => Record<string, string | undefined>): this {
    this.#options = { ...this.#options, getHeaders };
    return this;
  }

  onUnauthenticated(callback: (error: ApiError) => void): this {
    this.#options = { ...this.#options, onUnauthenticated: callback };
    return this;
  }

  withFetch(fetch: NonNullable<HttpClientOptions['fetch']>): this {
    this.#options = { ...this.#options, fetch };
    return this;
  }

  build(): KyInstance {
    return createHttpClient(this.#options);
  }
}
