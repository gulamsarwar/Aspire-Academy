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
  customLogin: (email: string, fullName: string, role: UserRoleType, phone?: string) => void;
  loginWithGoogle: (customEmail?: string, customName?: string) => Promise<void>;
  loginWithPhone: (phone: string, fullName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'student',
  isLoading: false,
  loginAsStudent: () => {},
  loginAsAdmin: () => {},
  logout: () => {},
  customLogin: () => {},
  loginWithGoogle: async () => {},
  loginWithPhone: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to guest visitor (null) so visitors and students see clean Student Login state
  const [user, setUser] = useState<Profile | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('aspire_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          // ignore parsing error
        }
      }
    }
    return null;
  });

  const [role, setRole] = useState<UserRoleType>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('aspire_role') as UserRoleType;
      if (savedRole) return savedRole;
    }
    return 'student';
  });

  const [isLoading, setIsLoading] = useState(false);

  const loginAsStudent = () => {
    const studentUser: Profile = {
      id: 'u0000000-0000-0000-0000-000000000001',
      email: 'student@gmail.com',
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
      email: 'admin@aspireacademy.in',
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

  const customLogin = (email: string, fullName: string, newRole: UserRoleType, phone?: string) => {
    const newUser: Profile = {
      id: `u_${Date.now()}`,
      email,
      full_name: fullName,
      phone: phone || '+91 9876543210',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(newUser);
    setRole(newRole);
    localStorage.setItem('aspire_user', JSON.stringify(newUser));
    localStorage.setItem('aspire_role', newRole);
  };

  const loginWithGoogle = async (customEmail?: string, customName?: string) => {
    setIsLoading(true);
    // Simulate real Google OAuth authentication handshake
    await new Promise((resolve) => setTimeout(resolve, 600));
    const googleEmail = customEmail || 'student.aspire@gmail.com';
    const googleName = customName || 'Google Student';
    const googleUser: Profile = {
      id: `google_${Date.now()}`,
      email: googleEmail,
      full_name: googleName,
      phone: '+91 9876543210',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(googleUser);
    setRole('student');
    localStorage.setItem('aspire_user', JSON.stringify(googleUser));
    localStorage.setItem('aspire_role', 'student');
    setIsLoading(false);
  };

  const loginWithPhone = async (phone: string, fullName?: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const cleanPhone = phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\D/g, '')}`;
    const name = fullName || `Student (${cleanPhone.slice(-4)})`;
    const email = `student_${phone.replace(/\D/g, '').slice(-10)}@mobile.aspireacademy.in`;
    const phoneUser: Profile = {
      id: `phone_${Date.now()}`,
      email,
      full_name: name,
      phone: cleanPhone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(phoneUser);
    setRole('student');
    localStorage.setItem('aspire_user', JSON.stringify(phoneUser));
    localStorage.setItem('aspire_role', 'student');
    setIsLoading(false);
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
        loginWithGoogle,
        loginWithPhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
