import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const VALID_CREDENTIALS = [
  { email: 'yesadmin@dialndine.com', password: 'dialndine', name: 'System Admin', role: UserRole.ADMIN },
  { email: 'samanthacallcenter1@gmail.com', password: 'callcenters', name: 'Samantha Pakkies', role: UserRole.SUPERVISOR },
  { email: 'sogcinwacallcenter@gmail.com', password: 'callcentern', name: 'Sogcinwa Nkala', role: UserRole.SUPERVISOR },
];

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const found = VALID_CREDENTIALS.find(c => c.email === email && c.password === password);
    if (!found) return false;
    const appUser: AppUser = {
      id: found.email,
      email: found.email,
      name: found.name,
      role: found.role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(found.name)}&background=6366f1&color=fff`,
    };
    setUser(appUser);
    localStorage.setItem('auth_user', JSON.stringify(appUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
