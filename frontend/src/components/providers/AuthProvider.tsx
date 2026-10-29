'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { sessionExpiresAt } from '@/lib/session'

// ─── Types ──────────────────────────────────────────────────────────
interface AuthState {
  token: string | null
  role: string | null
  email: string | null
  country: string | null
  name: string | null
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: { token: string; role: string; email: string; country?: string; name?: string }) => void
  logout: () => void
}

const AUTH_KEYS = {
  token: 'valam_token',
  role: 'valam_role',
  email: 'valam_email',
  country: 'valam_country',
  name: 'valam_name',
} as const

// ─── Context ────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within <AuthProvider>')
  }
  return ctx
}

// ─── Helper: read auth from localStorage ────────────────────────────
function readAuthFromStorage(): AuthState {
  if (typeof window === 'undefined') {
    return { token: null, role: null, email: null, country: null, name: null }
  }
  const expiry = sessionExpiresAt(localStorage.getItem(AUTH_KEYS.token));
  if (!expiry || expiry <= Date.now()) {
    for (const key of Object.values(AUTH_KEYS)) localStorage.removeItem(key);
    return { token: null, role: null, email: null, country: null, name: null };
  }
  return {
    token: localStorage.getItem(AUTH_KEYS.token),
    role: localStorage.getItem(AUTH_KEYS.role),
    email: localStorage.getItem(AUTH_KEYS.email),
    country: localStorage.getItem(AUTH_KEYS.country),
    name: localStorage.getItem(AUTH_KEYS.name),
  }
}

// ─── Provider ───────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null, role: null, email: null, country: null, name: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const isLoggingIn = useRef(false)

  // Initial hydration — read from localStorage once mounted
  useEffect(() => {
    setAuth(readAuthFromStorage())
    setIsLoading(false)
  }, [])

  // ── login: write to localStorage + update state ──────────────────
  const login = useCallback((data: { token: string; role: string; email: string; country?: string; name?: string }) => {
    isLoggingIn.current = true

    localStorage.setItem(AUTH_KEYS.token, data.token)
    localStorage.setItem(AUTH_KEYS.role, data.role)
    localStorage.setItem(AUTH_KEYS.email, data.email)
    localStorage.setItem(AUTH_KEYS.country, data.country || 'ID')
    if (data.name) {
      localStorage.setItem(AUTH_KEYS.name, data.name)
    }

    setAuth({
      token: data.token,
      role: data.role,
      email: data.email,
      country: data.country || 'ID',
      name: data.name || null,
    })

    // Reset flag after a tick so storage events from this login don't trigger redirect
    setTimeout(() => { isLoggingIn.current = false }, 500)
  }, [])

  // ── logout: clear localStorage + update state ────────────────────
  const logout = useCallback(() => {
    const token = localStorage.getItem(AUTH_KEYS.token);
    if (token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
      void fetch(`${apiUrl}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
        .then(response => { if (!response.ok && response.status !== 401) console.warn('Server logout was not confirmed.'); })
        .catch(() => console.warn('Server logout was not confirmed; local session cleared.'));
    }
    localStorage.removeItem(AUTH_KEYS.token)
    localStorage.removeItem(AUTH_KEYS.role)
    localStorage.removeItem(AUTH_KEYS.email)
    localStorage.removeItem(AUTH_KEYS.country)
    localStorage.removeItem(AUTH_KEYS.name)

    setAuth({ token: null, role: null, email: null, country: null, name: null })
  }, [])

  useEffect(() => {
    if (!auth.token) return;
    const expiry = sessionExpiresAt(auth.token);
    if (!expiry || expiry <= Date.now()) { logout(); return; }
    const timer = window.setTimeout(logout, Math.min(expiry - Date.now(), 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [auth.token, logout]);

  useEffect(() => {
    if (!auth.token) return;
    let cancelled = false;
    const validate = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
        const response = await fetch(`${apiUrl}/profiles/me`, { headers: { Authorization: `Bearer ${auth.token}` } });
        if (!cancelled && response.status === 401) logout();
      } catch { /* API failure is shown by the page; never create a fallback session. */ }
    };
    void validate();
    window.addEventListener('focus', validate);
    return () => { cancelled = true; window.removeEventListener('focus', validate); };
  }, [auth.token, logout]);

  // ── Cross-tab sync via `storage` event ───────────────────────────
  // The `storage` event fires ONLY when another tab changes localStorage.
  // It does NOT fire for changes in the same tab — so we won't get loops.
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Ignore if we're in the middle of a login flow in this tab
      if (isLoggingIn.current) return

      const isAuthKey = Object.values(AUTH_KEYS).includes(e.key as any)
      if (!isAuthKey && e.key !== null) return

      // Re-read full auth state from localStorage
      const fresh = readAuthFromStorage()
      setAuth(fresh)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // ── Re-validate when tab regains focus ───────────────────────────
  // Catches edge cases where storage event was missed (e.g. tab was suspended)
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggingIn.current) return
      const fresh = readAuthFromStorage()
      setAuth(prev => {
        // Only update if something actually changed
        if (
          prev.token !== fresh.token ||
          prev.role !== fresh.role ||
          prev.email !== fresh.email
        ) {
          return fresh
        }
        return prev
      })
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const value: AuthContextType = {
    ...auth,
    isAuthenticated: !!auth.token,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
