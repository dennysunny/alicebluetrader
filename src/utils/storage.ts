import { MMKV } from 'react-native-mmkv';

let storage: MMKV | null = null;

const getStorage = (): MMKV => {
  if (!storage) {
    storage = new MMKV({
      id: 'aliceblu-storage',
      encryptionKey: 'aliceblu-mmkv-key',
    });
  }
  return storage;
};

export const StorageHelper = {
  getJson: <T>(key: string): T | null => {
    try {
      const raw = getStorage().getString(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJson: <T>(key: string, value: T): void => {
    try {
      getStorage().set(key, JSON.stringify(value));
    } catch (e) {
      console.error('MMKV set error:', e);
    }
  },

  remove: (key: string): void => {
    try {
      getStorage().delete(key);
    } catch {}
  },

  clear: (): void => {
    try {
      getStorage().clearAll();
    } catch {}
  },
};