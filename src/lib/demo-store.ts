const DB_NAME = 'agripride_demo';
const DB_VERSION = 1;

export type StoreName = 'users' | 'farms' | 'crops' | 'diseaseReports' | 'recommendations' | 'weatherData' | 'marketPrices' | 'sustainabilityScores' | 'notifications' | 'auditLogs' | 'yieldRecords' | 'consentRecords' | 'chatMessages' | 'yieldPredictions' | 'contactInquiries' | 'farmerProfiles' | 'subscriptionPlans' | 'userSubscriptions' | 'testimonials' | 'supportTickets' | 'ticketMessages' | 'mpesaTransactions' | 'aiUsageLogs' | 'activityLogs' | 'platformStats';

const ALL_STORES: StoreName[] = ['users', 'farms', 'crops', 'diseaseReports', 'recommendations', 'weatherData', 'marketPrices', 'sustainabilityScores', 'notifications', 'auditLogs', 'yieldRecords', 'consentRecords', 'chatMessages', 'yieldPredictions', 'contactInquiries', 'farmerProfiles', 'subscriptionPlans', 'userSubscriptions', 'testimonials', 'supportTickets', 'ticketMessages', 'mpesaTransactions', 'aiUsageLogs', 'activityLogs', 'platformStats'];

function openDB(key: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(`${DB_NAME}_${key}`, DB_VERSION);
    req.onupgradeneeded = () => {
      for (const store of ALL_STORES) {
        if (!req.result.objectStoreNames.contains(store)) {
          req.result.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getDemoDataKey(): Promise<string> {
  return 'default';
}

export async function getCollection<T extends { id: string }>(storeName: StoreName, key?: string): Promise<T[]> {
  const dbKey = key || (await getDemoDataKey());
  const db = await openDB(dbKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => {
      resolve((req.result || []) as T[]);
      db.close();
    };
    req.onerror = () => {
      reject(req.error);
      db.close();
    };
  });
}

export async function getPaginatedCollection<T extends { id: string }>(storeName: StoreName, limit: number, offset: number, key?: string): Promise<{ data: T[]; total: number }> {
  const dbKey = key || (await getDemoDataKey());
  const db = await openDB(dbKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const countReq = store.count();
    const allReq = store.getAll();

    let resolved = false;
    const resolveIfDone = () => {
      if (resolved) return;
      if (countReq.readyState === 'done' && allReq.readyState === 'done') {
        resolved = true;
        const total = countReq.result;
        const data = (allReq.result || []).slice(offset, offset + limit) as T[];
        resolve({ data, total });
        db.close();
      }
    };

    countReq.onsuccess = resolveIfDone;
    countReq.onerror = () => { reject(countReq.error); db.close(); };
    allReq.onsuccess = resolveIfDone;
    allReq.onerror = () => { reject(allReq.error); db.close(); };
  });
}

export async function setCollection<T extends { id: string }>(storeName: StoreName, items: T[], key?: string): Promise<void> {
  const dbKey = key || (await getDemoDataKey());
  const db = await openDB(dbKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => { reject(tx.error); db.close(); };
  });
}

export async function getItem<T extends { id: string }>(storeName: StoreName, id: string, key?: string): Promise<T | undefined> {
  const dbKey = key || (await getDemoDataKey());
  const db = await openDB(dbKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => {
      resolve((req.result ?? undefined) as T | undefined);
      db.close();
    };
    req.onerror = () => { reject(req.error); db.close(); };
  });
}

export async function putItem<T extends { id: string }>(storeName: StoreName, item: T, key?: string): Promise<void> {
  const dbKey = key || (await getDemoDataKey());
  const db = await openDB(dbKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(item);
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => { reject(tx.error); db.close(); };
  });
}

export async function deleteItem(storeName: StoreName, id: string, key?: string): Promise<void> {
  const dbKey = key || (await getDemoDataKey());
  const db = await openDB(dbKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => { reject(tx.error); db.close(); };
  });
}

export async function getTotalCount(storeName: StoreName, key?: string): Promise<number> {
  const dbKey = key || (await getDemoDataKey());
  const db = await openDB(dbKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.count();
    req.onsuccess = () => { resolve(req.result); db.close(); };
    req.onerror = () => { reject(req.error); db.close(); };
  });
}

export async function clearAllData(key?: string): Promise<void> {
  const dbKey = key || (await getDemoDataKey());
  const db = await openDB(dbKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALL_STORES, 'readwrite');
    for (const store of ALL_STORES) {
      tx.objectStore(store).clear();
    }
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => { reject(tx.error); db.close(); };
  });
}
