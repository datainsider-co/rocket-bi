import { describe, expect, it } from 'vitest';
import { UNSAFE_ErrorResponseImpl as ErrorResponse, data } from 'react-router';
import { NOT_FOUND, toErrorPageContent } from './errorPage.utils';

describe('toErrorPageContent', () => {
  it('maps a 404 response to not found', () => {
    expect(toErrorPageContent(new ErrorResponse(404, 'Not Found', null))).toEqual(NOT_FOUND);
  });

  it.each([401, 403])('maps a %i response to access denied', status => {
    expect(toErrorPageContent(new ErrorResponse(status, 'Forbidden', null)).status).toBe('403');
  });

  it('maps another response to 500 with its status as detail', () => {
    const content = toErrorPageContent(new ErrorResponse(502, 'Bad Gateway', null));

    expect(content.status).toBe('500');
    expect(content.detail).toBe('502 Bad Gateway');
  });

  it('maps a thrown error to 500 with its stack as detail', () => {
    const error = new Error('Element type is invalid');
    const content = toErrorPageContent(error);

    expect(content).toMatchObject({ status: '500', title: 'Something went wrong' });
    expect(content.detail).toContain('Element type is invalid');
  });

  it('keeps a thrown string as detail', () => {
    expect(toErrorPageContent('boom').detail).toBe('boom');
  });

  it('has no detail for other values', () => {
    expect(toErrorPageContent({ odd: true }).detail).toBeUndefined();
    expect(toErrorPageContent(undefined).detail).toBeUndefined();
  });

  it('is not fooled by a data() payload that is not a response', () => {
    expect(toErrorPageContent(data({ status: 404 })).status).toBe('500');
  });
});
