export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

export function withBase(path: string): string {
  if (!API_BASE) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

export async function apiFetch(path: string, init?: RequestInit) {
  const url = withBase(path)
  return fetch(url, init)
}