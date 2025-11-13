const BASE = import.meta.env.VITE_API_BASE_URL || '';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function extractError(res: Response): Promise<Error> {
  let message = res.statusText || 'Request failed';
  try {
    const text = await res.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        message = (data && (data.error || data.message)) || message;
      } catch {
        // not JSON, use plain text
        message = text;
      }
    }
  } catch {
    // ignore secondary failure
  }
  return new Error(message);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, { headers: { 'Content-Type': 'application/json', ...authHeader() } });
  if (!res.ok) throw await extractError(res);
  return res.json();
}

export async function apiPost<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init?.headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: init?.signal,
  });
  if (!res.ok) throw await extractError(res);
  return res.json();
}

export async function apiPatch<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init?.headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: init?.signal,
  });
  if (!res.ok) throw await extractError(res);
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE}/api${path}`, { method: 'DELETE', headers: { ...authHeader() } });
  if (!res.ok) throw await extractError(res);
}

// Returns a Bulgarian user-facing error message
export function userError(err: any, fallback?: string): string {
  const raw = (err && (err.localizedMessage || err.message || String(err))) || '';
  const msg = typeof raw === 'string' ? raw : '';

  // If the message already contains Cyrillic letters, assume it's localized
  if (/\p{Script=Cyrillic}/u.test(msg)) {
    return msg;
  }

  const lower = msg.toLowerCase();
  const map: Array<[string | RegExp, string]> = [
    [/invalid credentials|wrong password|incorrect password|invalid email/, 'Невалиден имейл или парола.'],
    [/unauthorized|not authorized|no token|jwt|token/, 'Нямате права или сесията е изтекла.'],
    [/forbidden/, 'Достъпът е забранен.'],
    [/not found|does not exist/, 'Ресурсът не е намерен.'],
    [/bad request|validation|invalid request|unprocessable/, 'Невалидна или непълна заявка.'],
    [/timeout/, 'Времето за изчакване изтече. Опитайте отново.'],
    [/failed to fetch|network|fetch error|cors/, 'Мрежова грешка. Проверете връзката или опитайте по‑късно.'],
    [/internal server error|server error|status 5\d\d/, 'Вътрешна грешка на сървъра. Опитайте по‑късно.'],
  ];

  for (const [needle, bg] of map) {
    if (typeof needle === 'string') {
      if (lower.includes(needle)) return bg;
    } else if (needle.test(lower)) {
      return bg;
    }
  }

  return fallback || 'Възникна грешка. Опитайте отново.';
}
