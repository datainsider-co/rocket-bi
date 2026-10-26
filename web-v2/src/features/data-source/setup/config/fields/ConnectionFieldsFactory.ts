import { createElement } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { Control } from 'react-hook-form';
import type { ConnectionType } from '@/core/connection/ConnectionType';
import type { ConnectionFormValues } from '../connectionForm.utils';

export interface ConnectionFieldsProps {
  control: Control<ConnectionFormValues>;
}

/** Renders the type-specific part of the connection form (host, ports, credentials...). */
export type ConnectionFieldsRenderer = ComponentType<ConnectionFieldsProps>;

/** Picks the fields renderer for a connection type. Build one with `ConnectionFieldsFactoryBuilder`. */
export interface ConnectionFieldsFactory {
  render(type: ConnectionType, props: ConnectionFieldsProps): ReactElement;
}

export class RegistryConnectionFieldsFactory implements ConnectionFieldsFactory {
  readonly #renderers: ReadonlyMap<ConnectionType, ConnectionFieldsRenderer>;

  constructor(renderers: ReadonlyMap<ConnectionType, ConnectionFieldsRenderer>) {
    this.#renderers = renderers;
  }

  render(type: ConnectionType, props: ConnectionFieldsProps): ReactElement {
    const renderer = this.#renderers.get(type);
    if (!renderer) throw new Error(`No connection fields renderer for "${type}"`);
    return createElement(renderer, props);
  }
}
