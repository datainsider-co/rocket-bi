import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createContainer, token } from '@/core/di/Container';
import { DiProvider, useDi } from './DiContext';

const Greeting = token<string>('Greeting');

function Hello() {
  return <p>{useDi(Greeting)}</p>;
}

describe('useDi', () => {
  it('reads a dependency from the provider', () => {
    const container = createContainer([di => di.bindValue(Greeting, 'hello')]);

    render(
      <DiProvider container={container}>
        <Hello />
      </DiProvider>
    );

    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('throws outside the provider', () => {
    expect(() => render(<Hello />)).toThrow('useDi must be used inside <DiProvider>');
  });
});
