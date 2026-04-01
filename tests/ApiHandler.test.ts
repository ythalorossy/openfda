import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeOpenFDARequest } from '../src/ApiHandler';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('makeOpenFDARequest', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should return data on a successful request', async () => {
    const mockData = { results: [{ id: '123' }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { data, error } = await makeOpenFDARequest('http://test.com');
    expect(data).toEqual(mockData);
    expect(error).toBeNull();
  });

  it('should return an http error on a failed request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Error message',
    });

    const { data, error } = await makeOpenFDARequest('http://test.com');
    expect(data).toBeNull();
    expect(error?.type).toBe('http');
    expect(error?.status).toBe(404);
  });

  it('should retry on a 500 error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: async () => 'Server error',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

    const { data, error } = await makeOpenFDARequest('http://test.com', { maxRetries: 1, retryDelay: 10 });
    expect(data).not.toBeNull();
    expect(error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle a network error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { data, error } = await makeOpenFDARequest('http://test.com', { maxRetries: 0 });
    expect(data).toBeNull();
    expect(error?.type).toBe('network');
  });

  it('should handle a timeout', async () => {
    mockFetch.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100);
      });
    });

    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

    const { data, error } = await makeOpenFDARequest('http://test.com', { timeout: 50 });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(abortSpy).toHaveBeenCalled();
  });
});