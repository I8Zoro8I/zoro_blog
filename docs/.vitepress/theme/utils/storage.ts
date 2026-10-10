import {normalizeRoutePath} from '../../shared/routes'

export function getStoredValue(key: string): string | null {
    try {
        return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
    } catch {
        return null
    }
}

export function setStoredValue(key: string, value: string): boolean {
    try {
        if (typeof window === 'undefined') return false
        window.localStorage.setItem(key, value)
        return true
    } catch {
        return false
    }
}

export function removeStoredValue(key: string): boolean {
    try {
        if (typeof window === 'undefined') return false
        window.localStorage.removeItem(key)
        return true
    } catch {
        return false
    }
}

export function getStorageKeys(prefix: string): string[] {
    try {
        if (typeof window === 'undefined') return []
        const storage = window.localStorage
        return Array.from({length: storage.length}, (_, index) => storage.key(index))
            .filter((key): key is string => key !== null && key.startsWith(prefix))
    } catch {
        return []
    }
}

export function getRouteStoredValue(prefix: string, path: string, base?: string): string | null {
    const normalized = normalizeRoutePath(path, base)
    const key = `${prefix}${normalized}`
    const existing = getStoredValue(key)
    if (existing !== null) return existing
    const legacyKey = getStorageKeys(prefix).find(candidate =>
        normalizeRoutePath(candidate.slice(prefix.length), base) === normalized)
    const legacyValue = legacyKey ? getStoredValue(legacyKey) : null
    if (legacyValue !== null) setStoredValue(key, legacyValue)
    return legacyValue
}
