import { Platform } from 'react-native';

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

const CONFIG: SupabaseConfig | null = (() => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (url && anonKey) {
    return { url: url.replace(/\/$/, ''), anonKey };
  }
  return null;
})();

export const isSupabaseConfigured = Boolean(CONFIG);

let deviceIdMemory: string | null = null;
async function getDeviceId(): Promise<string> {
  try {
    const key = 'device_id';
    if (typeof window !== 'undefined' && window?.localStorage) {
      const existing = window.localStorage.getItem(key);
      if (existing && existing.trim()) return existing;
      const id = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(key, id);
      return id;
    }
    if (deviceIdMemory) return deviceIdMemory;
    deviceIdMemory = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return deviceIdMemory;
  } catch (e) {
    console.error('[supabase] getDeviceId error', e);
    return `anon-${Math.random().toString(36).slice(2)}`;
  }
}

function headers() {
  if (!CONFIG) throw new Error('Supabase is not configured');
  return {
    apikey: CONFIG.anonKey,
    Authorization: `Bearer ${CONFIG.anonKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  } as const;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!CONFIG) throw new Error('Supabase is not configured');
  const url = `${CONFIG.url}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const res = await fetch(url, {
    ...init,
    headers: {
      ...headers(),
      ...(init?.headers || {}),
    },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const text = await res.text();
  if (!res.ok) {
    console.error('[supabase] HTTP error', res.status, text);
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  try {
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  } catch (e) {
    console.error('[supabase] JSON parse error', e, text);
    throw new Error('Invalid JSON from Supabase');
  }
}

export type SupaTransaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  notes?: string | null;
  date: string; // ISO
  user_id: string;
  created_at?: string;
};

export type SupaGoal = {
  id: string;
  title: string;
  target_amount: number;
  progress: number;
  deadline: string; // ISO
  user_id: string;
  created_at?: string;
};

export async function fetchTransactionsForCurrentDevice(): Promise<SupaTransaction[]> {
  if (!CONFIG) return [];
  const userId = await getDeviceId();
  const query = `/rest/v1/transactions?user_id=eq.${encodeURIComponent(userId)}&select=*`;
  return http<SupaTransaction[]>(query, { method: 'GET' });
}

export async function upsertTransaction(t: Omit<SupaTransaction, 'id' | 'user_id'> & { id?: string }): Promise<SupaTransaction> {
  if (!CONFIG) throw new Error('Supabase is not configured');
  const userId = await getDeviceId();
  const payload = [{ ...t, user_id: userId }];
  const data = await http<SupaTransaction[]>(`/rest/v1/transactions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data[0];
}

export async function fetchGoalsForCurrentDevice(): Promise<SupaGoal[]> {
  if (!CONFIG) return [];
  const userId = await getDeviceId();
  const query = `/rest/v1/goals?user_id=eq.${encodeURIComponent(userId)}&select=*`;
  return http<SupaGoal[]>(query, { method: 'GET' });
}

export async function upsertGoal(g: Omit<SupaGoal, 'id' | 'user_id'> & { id?: string }): Promise<SupaGoal> {
  if (!CONFIG) throw new Error('Supabase is not configured');
  const userId = await getDeviceId();
  const payload = [{ ...g, user_id: userId }];
  const data = await http<SupaGoal[]>(`/rest/v1/goals`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data[0];
}

export async function ensureSupabaseReady(): Promise<{ configured: boolean; deviceId?: string }> {
  if (!CONFIG) return { configured: false };
  const deviceId = await getDeviceId();
  return { configured: true, deviceId };
}
