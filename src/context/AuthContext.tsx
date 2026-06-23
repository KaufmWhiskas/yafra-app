import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  requiresPasswordChange: boolean;
  setRequiresPasswordChange: React.Dispatch<React.SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  requiresPasswordChange: false,
  setRequiresPasswordChange: () => {},
});

/**
 * Manages the global authentication state via Supabase.
 * Listens to session changes and provides state to the application tree.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setIsLoading(false);

      if (event === 'PASSWORD_RECOVERY') {
        setRequiresPasswordChange(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        requiresPasswordChange,
        setRequiresPasswordChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
