'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRoleType } from '@/lib/types';

interface AuthContextType {
  user: Profile | null;
  role: UserRoleType;
  isLoading: boolean;
  loginAsStudent: () => void;
  loginAsAdmin: () => void;
  logout: () => void;
  customLogin: (email: string, fullName: string, role: UserRoleType) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'student',
  isLoading: false,
  loginAsStudent: () => {},
  loginAsAdmin: () => {},
  logout: () => {},
  customLogin: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to demo admin (Shekhar Sir) so admin panel, CMS, and video upload are immediately accessible
  const [user, setUser] = useState<Profile | null>({
    id: 'u0000000-0000-0000-0000-000000000002',
    email: 'admin@aspireacademy.demo',
    full_name: 'Shekhar Sir (Admin)',
    phone: '+91 9123456789',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  });
  const [role, setRole] = useState<UserRoleType>('admin');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check localStorage for saved session
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('aspire_user');
      const savedRole = localStorage.getItem('aspire_role') as UserRoleType;
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          if (savedRole) setRole(savedRole);
        } catch {
          // ignore parsing error
        }
      }
    }
  }, []);

  const loginAsStudent = () => {
    const studentUser: Profile = {
      id: 'u0000000-0000-0000-0000-000000000001',
      email: 'student@aspireacademy.demo',
      full_name: 'Priyanshu Kumari',
      phone: '+91 9876543210',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    };
    setUser(studentUser);
    setRole('student');
    localStorage.setItem('aspire_user', JSON.stringify(studentUser));
    localStorage.setItem('aspire_role', 'student');
  };

  const loginAsAdmin = () => {
    const adminUser: Profile = {
      id: 'u0000000-0000-0000-0000-000000000002',
      email: 'admin@aspireacademy.demo',
      full_name: 'Shekhar Sir (Admin)',
      phone: '+91 9123456789',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    };
    setUser(adminUser);
    setRole('admin');
    localStorage.setItem('aspire_user', JSON.stringify(adminUser));
    localStorage.setItem('aspire_role', 'admin');
  };

  const customLogin = (email: string, fullName: string, newRole: UserRoleType) => {
    const newUser: Profile = {
      id: `u_${Date.now()}`,
      email,
      full_name: fullName,
      phone: '+91 9876543210',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(newUser);
    setRole(newRole);
    localStorage.setItem('aspire_user', JSON.stringify(newUser));
    localStorage.setItem('aspire_role', newRole);
  };

  const logout = () => {
    setUser(null);
    setRole('student');
    localStorage.removeItem('aspire_user');
    localStorage.removeItem('aspire_role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        loginAsStudent,
        loginAsAdmin,
        logout,
        customLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
