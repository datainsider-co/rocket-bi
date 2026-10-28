import type { KyInstance } from 'ky';
import { vi } from 'vitest';
import { HttpClientBuilder } from '@/shared/http/HttpClientBuilder';

export interface Reply {
  status?: number;
  body?: unknown;
}

export interface RecordedRequest {
  method: string;
  url: string;
  body: unknown;
}

/** Test-only: an HTTP client on `http://api.test` that answers each request with the next reply (the last repeats). */
export function fakeHttp(...replies: Reply[]): { http: KyInstance; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const fetch = vi.fn<(request: Request) => Promise<Response>>(async request => {
    const text = await request.clone().text();
    requests.push({ method: request.method, url: request.url, body: text ? (JSON.parse(text) as unknown) : undefined });
    const reply = replies[Math.min(requests.length - 1, replies.length - 1)] ?? {};
    return reply.body === undefined
      ? new Response('', { status: reply.status ?? 200 })
      : Response.json(reply.body, { status: reply.status ?? 200 });
  });
  return { http: new HttpClientBuilder('http://api.test').withFetch(fetch).build(), requests };
}
