import { OfflineSyncQueueItem } from '../types/index.js';

const STORAGE_KEY = 'tuition_offline_sync_queue';

export function getOfflineQueue(): OfflineSyncQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineSyncQueueItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline queue:', e);
  }
}

export function enqueueOfflineAction(
  entity: OfflineSyncQueueItem['entity'],
  operation: OfflineSyncQueueItem['operation'],
  payload: any
): OfflineSyncQueueItem {
  const item: OfflineSyncQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    entity,
    operation,
    payload,
    clientTimestamp: Date.now(),
    status: 'pending',
  };

  const queue = getOfflineQueue();
  queue.push(item);
  saveOfflineQueue(queue);

  // Notify listeners
  window.dispatchEvent(new CustomEvent('tuition:queue-updated', { detail: { count: queue.length } }));

  return item;
}

export async function flushOfflineQueue(apiSyncBatchFn: (items: OfflineSyncQueueItem[]) => Promise<any>): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  const pendingItems = queue.filter((i) => i.status === 'pending' || i.status === 'failed');
  if (pendingItems.length === 0) return { syncedCount: 0, failedCount: 0 };

  try {
    const response = await apiSyncBatchFn(pendingItems);
    const results: { id: string; status: 'synced' | 'failed'; error?: string }[] = response.results || [];

    const updatedQueue = queue
      .map((item) => {
        const res = results.find((r) => r.id === item.id);
        if (res) {
          return {
            ...item,
            status: res.status,
            error: res.error,
          };
        }
        return item;
      })
      .filter((item) => item.status !== 'synced'); // Remove synced items

    saveOfflineQueue(updatedQueue);

    window.dispatchEvent(
      new CustomEvent('tuition:queue-updated', { detail: { count: updatedQueue.length } })
    );

    const syncedCount = results.filter((r) => r.status === 'synced').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    return { syncedCount, failedCount };
  } catch (err) {
    console.error('Offline flush failed:', err);
    return { syncedCount: 0, failedCount: pendingItems.length };
  }
}
