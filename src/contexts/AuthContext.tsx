import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppUser, UserRole } from '@/types/auth';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  isAdmin: boolean;
  isGuru: boolean;
  isSiswa: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'fadam_auth_user';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (identifier: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { identifier, password }
      });

      if (error) {
        console.error('Login error:', error);
        return { error: 'Terjadi kesalahan saat login' };
      }

      if (!data.success) {
        return { error: data.error || 'Login gagal' };
      }

      const appUser: AppUser = data.user;
      setUser(appUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
      
      return { error: null };
    } catch (e) {
      console.error('Login exception:', e);
      return { error: 'Terjadi kesalahan koneksi' };
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isGuru = user?.role === 'guru';
  const isSiswa = user?.role === 'siswa';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isAdmin,
        isGuru,
        isSiswa,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
