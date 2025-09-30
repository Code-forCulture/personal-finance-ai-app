import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL as string | undefined;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl;
  }
  if (typeof window !== 'undefined' && (window as unknown as { location?: { origin?: string } }).location?.origin) {
    return (window as unknown as { location?: { origin?: string } }).location!.origin as string;
  }
  if (Platform.OS !== 'web') {
    const anyConst = Constants as unknown as { expoConfig?: { hostUri?: string } } & { manifest?: { debuggerHost?: string } };
    const host = anyConst?.expoConfig?.hostUri || anyConst?.manifest?.debuggerHost || '';
    if (host) {
      const hostname = host.split(':')[0];
      if (hostname) {
        return `http://${hostname}:8081`;
      }
    }
  }
  return 'http://localhost:8081';
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const isAbsolute = input.startsWith('http://') || input.startsWith('https://');
  const url = isAbsolute ? input : `${getApiBaseUrl()}${input.startsWith('/') ? '' : '/'}${input}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  try {
    const resp = await fetch(url, { ...init, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timeoutId);
  }
}
