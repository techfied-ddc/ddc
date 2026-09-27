const BASE = import.meta.env['VITE_API_URL'] ?? '';

let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly status:  number,
    public readonly code:    string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshPromise: Promise<string | null> | null = null;

const doFetch = async (path: string, opts: ApiOptions = {}): Promise<unknown> => {
  const { body, ...rest } = opts;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };

  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && path !== '/api/v1/auth/refresh') {
    if (!refreshPromise) {
      refreshPromise = doFetch('/api/v1/auth/refresh', { method: 'POST' })
        .then((d) => (d as { data: { accessToken: string } }).data.accessToken)
        .catch(() => null)
        .finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      setAccessToken(newToken);
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${BASE}${path}`, {
        ...rest,
        credentials: 'include',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return parseResponse(retryRes);
    }
    setAccessToken(null);
  }

  return parseResponse(res);
};

const parseResponse = async (res: Response): Promise<unknown> => {
  const json = await res.json().catch(() => ({ ok: false, error: { code: 'PARSE_ERROR', message: 'Invalid server response.' } }));
  if (!json.ok) {
    throw new ApiError(res.status, json.error?.code ?? 'API_ERROR', json.error?.message ?? 'An error occurred.', json.error?.details);
  }
  return json;
};

export const api = {
  get:    (path: string, opts?: ApiOptions) => doFetch(path, { ...opts, method: 'GET' }),
  post:   (path: string, body?: unknown, opts?: ApiOptions) => doFetch(path, { ...opts, method: 'POST', body }),
  patch:  (path: string, body?: unknown, opts?: ApiOptions) => doFetch(path, { ...opts, method: 'PATCH', body }),
  put:    (path: string, body?: unknown, opts?: ApiOptions) => doFetch(path, { ...opts, method: 'PUT', body }),
  delete: (path: string, opts?: ApiOptions) => doFetch(path, { ...opts, method: 'DELETE' }),
};
