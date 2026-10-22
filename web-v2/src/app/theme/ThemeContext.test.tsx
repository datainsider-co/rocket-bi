import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

function ModeToggle() {
  const { mode, toggleMode } = useTheme();
  return <button onClick={toggleMode}>{mode}</button>;
}

describe('ThemeContext', () => {
  it('toggles between light and dark', async () => {
    render(
      <ThemeProvider>
        <ModeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('light');
    await userEvent.click(button);
    expect(button).toHaveTextContent('dark');
  });

  it('throws when used outside the provider', () => {
    expect(() => render(<ModeToggle />)).toThrow('useTheme must be used inside <ThemeProvider>');
  });
});
