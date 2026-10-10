import {normalizeRoutePath} from '../../shared/routes'
import {getStorageKeys, getStoredValue, setStoredValue} from './storage'

export type SavedProgress = {percent: number; updatedAt: string}
export const PROGRESS_PREFIX = 'zblog:reading-progress:'

export function parseProgress(value: string | null): SavedProgress | null {
    try {
        const data = JSON.parse(value || '')
        return data && typeof data.percent === 'number' && Number.isFinite(data.percent) &&
            data.percent >= 0 && data.percent <= 100 &&
            typeof data.updatedAt === 'string' && Number.isFinite(Date.parse(data.updatedAt))
            ? {percent: data.percent, updatedAt: data.updatedAt}
            : null
    } catch {
        return null
    }
}

export function getReadingRecords(base?: string): Map<string, SavedProgress> {
    const records = new Map<string, SavedProgress>()
    for (const key of getStorageKeys(PROGRESS_PREFIX)) {
        const saved = parseProgress(getStoredValue(key))
        if (!saved) continue
        const path = normalizeRoutePath(key.slice(PROGRESS_PREFIX.length), base)
        const previous = records.get(path)
        if (!previous || Date.parse(saved.updatedAt) > Date.parse(previous.updatedAt)) records.set(path, saved)
    }
    return records
}

export function saveReadingProgress(path: string, value: SavedProgress, base?: string): boolean {
    return setStoredValue(`${PROGRESS_PREFIX}${normalizeRoutePath(path, base)}`, JSON.stringify(value))
}

export function createProgressWriter(write = saveReadingProgress) {
    let pending: {path: string; value: SavedProgress} | null = null
    return {
        capture(path: string, percent: number) {
            pending = {path, value: {percent, updatedAt: new Date().toISOString()}}
        },
        flush() {
            if (!pending) return
            const snapshot = pending
            pending = null
            write(snapshot.path, snapshot.value)
        }
    }
}
