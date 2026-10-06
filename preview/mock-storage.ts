// In-memory replacement for wxt/utils/storage with the same defineItem API.
type Listener = (value: unknown) => void;
const data = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();

export type WxtStorageItem<T, _M> = {
  getValue(): Promise<T>;
  setValue(v: T): Promise<void>;
  removeValue(): Promise<void>;
  watch(cb: (v: T) => void): () => void;
};

export const storage = {
  defineItem<T>(key: string, opts: { fallback: T }): WxtStorageItem<T, {}> {
    const emit = (v: unknown) => listeners.get(key)?.forEach((l) => l(v));
    return {
      async getValue() {
        return (data.has(key) ? data.get(key) : opts.fallback) as T;
      },
      async setValue(v) {
        data.set(key, structuredClone(v));
        emit(v);
      },
      async removeValue() {
        data.delete(key);
        emit(opts.fallback);
      },
      watch(cb) {
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key)!.add(cb as Listener);
        return () => listeners.get(key)!.delete(cb as Listener);
      },
    };
  },
};
