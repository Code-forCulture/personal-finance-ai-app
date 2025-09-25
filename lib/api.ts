export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL as string;
  }
  if (typeof window !== 'undefined' && (window as unknown as { location?: { origin?: string } }).location?.origin) {
    return window.location.origin as string;
  }
  return 'http://localhost:8081';
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const isAbsolute = input.startsWith('http://') || input.startsWith('https://');
  const url = isAbsolute ? input : `${getApiBaseUrl()}${input.startsWith('/') ? '' : '/'}${input}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(url, { ...init, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timeoutId);
  }
}
