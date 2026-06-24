const isBrowser = typeof window !== 'undefined';

function generateId(): string {
  const chars = '0123456789abcdef';
  let result = '';
  const arr = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    for (let i = 0; i < 16; i++) {
      result += chars[arr[i] % 16];
    }
  } else {
    for (let i = 0; i < 16; i++) {
      result += chars[Math.floor(Math.random() * 16)];
    }
  }
  return result;
}

export function getRequestId(): string {
  if (!isBrowser && typeof globalThis !== 'undefined') {
    const store = (globalThis as Record<string, unknown>).__requestIdStore as Map<string, string> | undefined;
    if (store && store.size > 0) {
      return store.values().next().value ?? generateId();
    }
  }
  return generateId();
}

export function setRequestId(id: string) {
  if (!isBrowser && typeof globalThis !== 'undefined') {
    let store = (globalThis as Record<string, unknown>).__requestIdStore as Map<string, string> | undefined;
    if (!store) {
      store = new Map();
      (globalThis as Record<string, unknown>).__requestIdStore = store;
    }
    store.set('current', id);
  }
}
