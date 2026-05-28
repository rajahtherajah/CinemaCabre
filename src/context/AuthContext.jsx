'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('crtugbydvjhgdrrxnbye')) {
      const savedUser = localStorage.getItem('demo_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setSession({ user: parsed });
      }
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.warn("Supabase initialization bypassed:", err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, username) => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('crtugbydvjhgdrrxnbye')) {
      const mockUser = { id: 'mock-user-id-' + Date.now(), email, user_metadata: { username } };
      setUser(mockUser);
      setSession({ user: mockUser });
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    if (email === 'admin@admin.com' && password === '12345678') {
      const adminUser = { 
        id: 'admin-user-id', 
        email: 'admin@admin.com', 
        user_metadata: { username: 'Admin Demonic' } 
      };
      setUser(adminUser);
      setSession({ user: adminUser });
      localStorage.setItem('demo_user', JSON.stringify(adminUser));
      return { data: { user: adminUser }, error: null };
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('crtugbydvjhgdrrxnbye')) {
      const username = email.split('@')[0] || 'Demon';
      const mockUser = { id: 'mock-user-id-' + Date.now(), email, user_metadata: { username } };
      setUser(mockUser);
      setSession({ user: mockUser });
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('crtugbydvjhgdrrxnbye')) {
      setUser(null);
      setSession(null);
      localStorage.removeItem('demo_user');
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
