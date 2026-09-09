const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId: string | null;
  mustSetPassword: boolean;
  emailVerified: boolean;
  mustVerifyEmail: boolean;
  pendingEmail: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      message = JSON.parse(text)?.message ?? text;
    } catch {
      /* keep text */
    }
    throw new Error(Array.isArray(message) ? message.join(', ') : String(message));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
};

export const authApi = {
  me: () => api.get<AuthUser>('/auth/me'),
  login: (body: { email: string; password: string }) =>
    api.post<{ token: string; user: AuthUser }>('/auth/login', body),
  registerAdmin: (body: unknown) =>
    api.post<{ token: string; user: AuthUser }>('/auth/register-admin', body),
  join: (body: unknown) =>
    api.post<{ token: string; user: AuthUser }>('/auth/join', body),
  requestOtp: (email: string) => api.post('/auth/otp/request', { email }),
  verifyOtp: (email: string, code: string) =>
    api.post<{ token: string; user: AuthUser }>('/auth/otp/verify', { email, code }),
  setPassword: (password: string) => api.post<AuthUser>('/auth/password', { password }),
  requestEmailVerify: () => api.post('/auth/email/verify/request'),
  confirmEmailVerify: (code: string) => api.post<AuthUser>('/auth/email/verify/confirm', { code }),
  requestEmailChange: (newEmail: string) =>
    api.post('/auth/email/change/request', { newEmail }),
  confirmEmailChange: (newEmail: string, code: string) =>
    api.post<AuthUser>('/auth/email/change/confirm', { newEmail, code }),
  logout: () => api.post('/auth/logout'),
  googleUrl: `${API_URL}/auth/google`,
};
