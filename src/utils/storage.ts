import { MMKV } from 'react-native-mmkv';

// ============================================================
// STORAGE UTILITY - Uses MMKV (10x faster than AsyncStorage)
// For sensitive data, use Keychain (see authService.ts)
// ============================================================

export const storage = new MMKV({
  id: 'aliceblu-storage',
  encryptionKey: 'aliceblu-mmkv-key', // rotate per build in production
});

// Type-safe helpers
export const StorageHelper = {
  getJson: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJson: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  remove: (key: string): void => {
    storage.delete(key);
  },

  clear: (): void => {
    storage.clearAll();
  },
};
