import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from 'antd';
import { ErrorState } from './ErrorState';

function renderError(props: Parameters<typeof ErrorState>[0]) {
  return render(
    <App>
      <ErrorState {...props} />
    </App>
  );
}

describe('ErrorState', () => {
  afterEach(() => vi.restoreAllMocks());

  it('copies the whole message, which the box may cut', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const message = 'Table "sales" does not exist. '.repeat(12);
    renderError({ message });

    await user.click(screen.getByRole('button', { name: 'Copy error message' }));

    expect(writeText).toHaveBeenCalledWith(message);
    expect(await screen.findByText('Copied')).toBeInTheDocument();
  });

  it('copies the default message when there is none', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderError({});

    await user.click(screen.getByRole('button', { name: 'Copy error message' }));

    expect(writeText).toHaveBeenCalledWith('Something went wrong, please try again later');
  });

  it('offers Try Again only with a retry', async () => {
    const onRetry = vi.fn<() => void>();
    const { rerender } = renderError({ message: 'x' });
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();

    rerender(
      <App>
        <ErrorState message="x" onRetry={onRetry} />
      </App>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
