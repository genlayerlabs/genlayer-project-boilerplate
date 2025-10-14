'use client'

// Safe localStorage wrapper to prevent SSR issues
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, value)
    } catch {
      // Ignore errors
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore errors
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.clear()
    } catch {
      // Ignore errors
    }
  }
}

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(key, value)
    } catch {
      // Ignore errors
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.removeItem(key)
    } catch {
      // Ignore errors
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.clear()
    } catch {
      // Ignore errors
    }
  }
}

