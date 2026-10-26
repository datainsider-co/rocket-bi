import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { DashboardMode } from './dashboardMode.utils';
import { useDashboardMode } from './useDashboardMode';

/** A document whose full screen calls can be watched and fail on demand. */
function fakeDocument(fails = false) {
  const target = new EventTarget();
  const doc = {
    fullscreenElement: null as Element | null,
    documentElement: {
      requestFullscreen: vi.fn<() => Promise<void>>(async () => {
        if (fails) throw new Error('denied');
        doc.fullscreenElement = document.body;
      })
    },
    exitFullscreen: vi.fn<() => Promise<void>>(async () => {
      doc.fullscreenElement = null;
    }),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    leaveFullscreen: () => {
      doc.fullscreenElement = null;
      target.dispatchEvent(new Event('fullscreenchange'));
    }
  };
  return doc;
}

const render = (doc: ReturnType<typeof fakeDocument>) => renderHook(() => useDashboardMode(doc as unknown as Document));

describe('useDashboardMode', () => {
  it('asks for full screen in TV mode and goes back to view when it ends', async () => {
    const doc = fakeDocument();
    const { result } = render(doc);
    await act(() => result.current.changeMode(DashboardMode.Tv));
    expect(doc.documentElement.requestFullscreen).toHaveBeenCalled();
    expect(result.current.mode).toBe(DashboardMode.Tv);

    act(() => doc.leaveFullscreen());
    expect(result.current.mode).toBe(DashboardMode.View);
  });

  it('leaves the browser full screen when leaving TV mode', async () => {
    const doc = fakeDocument();
    const { result } = render(doc);
    await act(() => result.current.changeMode(DashboardMode.Tv));
    await act(() => result.current.changeMode(DashboardMode.View));
    expect(doc.exitFullscreen).toHaveBeenCalled();
    expect(result.current.mode).toBe(DashboardMode.View);
  });

  it('keeps full screen without the browser, and falls back to it when the browser refuses', async () => {
    const doc = fakeDocument(true);
    const { result } = render(doc);
    await act(() => result.current.changeMode(DashboardMode.FullScreen));
    expect(doc.documentElement.requestFullscreen).not.toHaveBeenCalled();
    act(() => doc.leaveFullscreen());
    expect(result.current.mode).toBe(DashboardMode.FullScreen);

    await act(() => result.current.changeMode(DashboardMode.Tv));
    expect(result.current.mode).toBe(DashboardMode.FullScreen);
  });
});
