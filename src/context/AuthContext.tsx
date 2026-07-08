import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import * as Linking from 'expo-linking';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  requiresPasswordReset: boolean;
  setRequiresPasswordReset: React.Dispatch<React.SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  requiresPasswordReset: false,
  setRequiresPasswordReset: () => {},
});

/**
 * Manages the global authentication state via Supabase.
 * Listens to session changes and provides state to the application tree.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);

  useEffect(() => {
    const handleDeepLinkUrl = async (url: string | null) => {
      if (!url) return;

      // Manually extract the fragment from the URL, as expo-linking does not parse it.
      const fragment = url.split('#')[1];
      if (fragment?.includes('access_token=')) {
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          setIsLoading(true);
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          } catch (error) {
            console.error(
              'Failed to parse and apply deep link token payload:',
              error,
            );
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    Linking.getInitialURL().then((url) => handleDeepLinkUrl(url));

    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLinkUrl(event.url);
    });

    return () => subscription.remove();
  }, []);

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
        setRequiresPasswordReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        requiresPasswordReset,
        setRequiresPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
