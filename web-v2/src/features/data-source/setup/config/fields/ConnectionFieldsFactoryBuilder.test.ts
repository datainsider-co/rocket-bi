import { describe, expect, it } from 'vitest';
import type { Control } from 'react-hook-form';
import { ConnectionType } from '@/core/connection/ConnectionType';
import type { ConnectionFormValues } from '../connectionForm.utils';
import type { ConnectionFieldsRenderer } from './ConnectionFieldsFactory';
import { ConnectionFieldsFactoryBuilder } from './ConnectionFieldsFactoryBuilder';

const ClickhouseStub: ConnectionFieldsRenderer = () => null;
const MySqlStub: ConnectionFieldsRenderer = () => null;
const props = { control: {} as Control<ConnectionFormValues> };

function fullBuilder() {
  return new ConnectionFieldsFactoryBuilder()
    .register(ConnectionType.Clickhouse, ClickhouseStub)
    .register(ConnectionType.MySql, MySqlStub);
}

describe('ConnectionFieldsFactoryBuilder', () => {
  it.each([
    [ConnectionType.Clickhouse, ClickhouseStub],
    [ConnectionType.MySql, MySqlStub]
  ])('builds a factory that renders the renderer registered for %s', (type, renderer) => {
    const element = fullBuilder().build().render(type, props);

    expect(element.type).toBe(renderer);
    expect(element.props).toEqual(props);
  });

  it('throws on build when a connection type has no renderer', () => {
    const builder = new ConnectionFieldsFactoryBuilder().register(ConnectionType.Clickhouse, ClickhouseStub);

    expect(() => builder.build()).toThrow(`Missing connection fields renderer for: ${ConnectionType.MySql}`);
  });

  it('throws when a type is registered twice', () => {
    const builder = fullBuilder();

    expect(() => builder.register(ConnectionType.MySql, MySqlStub)).toThrow('already registered');
  });
});
