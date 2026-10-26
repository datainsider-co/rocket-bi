import { ConnectionType } from '@/core/connection/ConnectionType';
import { RegistryConnectionFieldsFactory } from './ConnectionFieldsFactory';
import type { ConnectionFieldsFactory, ConnectionFieldsRenderer } from './ConnectionFieldsFactory';

/**
 * Registers one renderer per connection type, then builds an immutable factory.
 * `build` fails fast when a type has no renderer, so adding a `ConnectionType` without its fields breaks at startup
 * instead of when a user picks it.
 */
export class ConnectionFieldsFactoryBuilder {
  readonly #renderers = new Map<ConnectionType, ConnectionFieldsRenderer>();

  register(type: ConnectionType, renderer: ConnectionFieldsRenderer): this {
    if (this.#renderers.has(type)) throw new Error(`Connection fields renderer for "${type}" is already registered`);
    this.#renderers.set(type, renderer);
    return this;
  }

  build(): ConnectionFieldsFactory {
    const missing = Object.values(ConnectionType).filter(type => !this.#renderers.has(type));
    if (missing.length > 0) throw new Error(`Missing connection fields renderer for: ${missing.join(', ')}`);
    return new RegistryConnectionFieldsFactory(new Map(this.#renderers));
  }
}
