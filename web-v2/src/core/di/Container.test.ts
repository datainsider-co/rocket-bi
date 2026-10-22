import { describe, expect, it, vi } from 'vitest';
import { createContainer, DiContainer, token } from './Container';
import type { DiModule } from './Container';

const Name = token<string>('Name');
const Greeter = token<{ greet: () => string }>('Greeter');

describe('DiContainer', () => {
  it('returns a bound value', () => {
    const di = new DiContainer();
    di.bindValue(Name, 'rocket');

    expect(di.get(Name)).toBe('rocket');
  });

  it('builds a singleton lazily, once, with its dependencies', () => {
    const di = new DiContainer();
    const factory = vi.fn<() => { greet: () => string }>(() => ({ greet: () => `hi ${di.get(Name)}` }));
    di.bindSingleton(Greeter, factory);
    di.bindValue(Name, 'rocket');

    expect(factory).not.toHaveBeenCalled();
    const first = di.get(Greeter);

    expect(first.greet()).toBe('hi rocket');
    expect(di.get(Greeter)).toBe(first);
    expect(factory).toHaveBeenCalledOnce();
  });

  it('passes itself to the factory', () => {
    const di = new DiContainer();
    di.bindValue(Name, 'rocket');
    di.bindSingleton(Greeter, d => ({ greet: () => d.get(Name) }));

    expect(di.get(Greeter).greet()).toBe('rocket');
  });

  it('treats tokens with the same name as different keys', () => {
    const di = new DiContainer();
    const Other = token<string>('Name');
    di.bindValue(Name, 'a');

    expect(() => di.get(Other)).toThrow('DI: no binding for Name');
  });

  it('throws on a missing binding', () => {
    expect(() => new DiContainer().get(Name)).toThrow('DI: no binding for Name');
  });

  it('reports a circular dependency', () => {
    const A = token<unknown>('A');
    const B = token<unknown>('B');
    const di = new DiContainer();
    di.bindSingleton(A, d => d.get(B));
    di.bindSingleton(B, d => d.get(A));

    expect(() => di.get(A)).toThrow('DI: circular dependency A -> B -> A');
  });

  it('can resolve again after a factory throws', () => {
    const di = new DiContainer();
    let fail = true;
    di.bindSingleton(Name, () => {
      if (fail) throw new Error('boom');
      return 'ok';
    });

    expect(() => di.get(Name)).toThrow('boom');
    fail = false;
    expect(di.get(Name)).toBe('ok');
  });

  it('drops the cached instance when a token is rebound', () => {
    const di = new DiContainer();
    di.bindSingleton(Name, () => 'real');
    di.get(Name);
    di.bindValue(Name, 'fake');

    expect(di.get(Name)).toBe('fake');
  });
});

describe('createContainer', () => {
  it('applies modules in order, so later ones override', () => {
    const RealModule: DiModule = di => di.bindValue(Name, 'real');
    const TestModule: DiModule = di => di.bindValue(Name, 'test');

    expect(createContainer([RealModule, TestModule]).get(Name)).toBe('test');
  });
});
