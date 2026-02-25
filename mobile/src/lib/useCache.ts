import { useRef, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import * as SecureStore from 'expo-secure-store';

/**
 * Stale-While-Revalidate cache hook.
 *
 * On mount it reads from SecureStore and immediately populates state (no spinner),
 * then silently fetches fresh data in the background. Every successful fetch saves
 * to cache for the next mount.
 *
 * Usage:
 *   const { load, save } = useCache('admin_dashboard_v1', setData, setLoading);
 *   // call load() on mount, call save(data) after every successful fetch
 */
export function useCache<T>(
    cacheKey: string,
    setData: Dispatch<SetStateAction<T>> | ((data: T) => void),
    setLoading: Dispatch<SetStateAction<boolean>>,
) {
    const cacheLoaded = useRef(false);

    // Load cached data immediately on mount
    const loadCache = useCallback(async () => {
        if (cacheLoaded.current) return;
        try {
            const cached = await SecureStore.getItemAsync(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached) as T;
                setData(parsed);
                setLoading(false); // Hide spinner immediately
            }
        } catch { /* ignore corrupt cache */ }
        cacheLoaded.current = true;
    }, [cacheKey, setData, setLoading]);

    // Save data to cache (fire-and-forget)
    const saveCache = useCallback((data: T) => {
        try {
            SecureStore.setItemAsync(cacheKey, JSON.stringify(data)).catch(() => { });
        } catch { /* ignore */ }
    }, [cacheKey]);

    return { loadCache, saveCache };
}
