import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_USER_KEY = 'user';
const STORAGE_AUTH_KEY = 'isAuthenticated';

export interface UserContextUser {
  id: string;
  name: string;
  email: string;
  roleId?: number;
  profileImage?: string;
}

export interface UserContextValue {
  user: UserContextUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: UserContextUser) => void;
  logout: () => void;
  updateUser: (patch: Partial<UserContextUser>) => void;
  setUser: (user: UserContextUser | null) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

function readStoredUser(): UserContextUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserContextUser;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

function persistUser(user: UserContextUser | null, authenticated: boolean) {
  if (authenticated && user) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_AUTH_KEY, 'true');
    return;
  }
  localStorage.removeItem(STORAGE_USER_KEY);
  localStorage.removeItem(STORAGE_AUTH_KEY);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserContextUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = readStoredUser();
    const storedAuth = localStorage.getItem(STORAGE_AUTH_KEY) === 'true';
    if (storedAuth && storedUser) {
      setUserState(storedUser);
      setIsAuthenticated(true);
    } else {
      persistUser(null, false);
    }
    setLoading(false);
  }, []);

  const login = useCallback((nextUser: UserContextUser) => {
    setUserState(nextUser);
    setIsAuthenticated(true);
    persistUser(nextUser, true);
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    setIsAuthenticated(false);
    persistUser(null, false);
  }, []);

  const updateUser = useCallback((patch: Partial<UserContextUser>) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      persistUser(updated, true);
      return updated;
    });
  }, []);

  const setUser = useCallback((nextUser: UserContextUser | null) => {
    setUserState(nextUser);
    const nextAuth = !!nextUser;
    setIsAuthenticated(nextAuth);
    persistUser(nextUser, nextAuth);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      updateUser,
      setUser,
    }),
    [user, isAuthenticated, loading, login, logout, updateUser, setUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUserContext must be used within UserProvider');
  }
  return ctx;
}

