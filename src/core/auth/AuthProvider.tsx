// src/core/auth/AuthProvider.tsx
// Restaura sessão ao iniciar app; expõe signIn e signOut

import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext, AuthContextValue, UserProfile, AuthSession } from './AuthContext';
import { sessionStorage } from './sessionStorage';
import { CONFIG } from '@/core/config';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restaura sessão ao montar ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedProfileRaw] = await Promise.all([
          sessionStorage.getToken(),
          sessionStorage.getProfile(),
        ]);

        if (storedToken && storedProfileRaw) {
          // Valida o token e obtém profile fresco do servidor
          try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/user`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'apikey': CONFIG.SUPABASE_ANON_KEY,
              },
            });

            if (res.ok) {
              const userData = await res.json();
              const freshProfile = await fetchProfile(storedToken, userData.id);

              setSession({ access_token: storedToken });
              setUser({ id: userData.id });
              setProfile(freshProfile);

              await sessionStorage.setProfile(JSON.stringify(freshProfile));
            } else {
              console.warn('[Auth] Token rejeitado pelo servidor, limpando local');
              await sessionStorage.clearAll();
            }
          } catch (validateError) {
            console.warn('[Auth] Falha na validação, usando cache:', validateError);
            const storedProfile: UserProfile = JSON.parse(storedProfileRaw);
            setSession({ access_token: storedToken });
            setUser({ id: storedProfile.id });
            setProfile(storedProfile);
          }
        }
      } catch (e) {
        console.warn('[Auth] Falha ao restaurar sessão:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const fetchProfile = async (token: string, userId: string): Promise<UserProfile> => {
    const res = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,name,role,active`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    const profileData = data?.[0];
    return {
      id: userId,
      name: profileData?.name ?? 'Usuário',
      role: profileData?.role ?? 'viewer',
      active: profileData?.active ?? true,
    };
  };

  // ── signIn ───────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    console.log(`[AuthProvider] signIn — email: ${email}`);

    const res = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log(`[AuthProvider] signIn response — status: ${res.status}`);

    if (!res.ok) {
      const errorCode = data?.error_description ?? 'INVALID_CREDENTIALS';
      console.error(`[AuthProvider] signIn error: ${errorCode}`);
      throw new Error(errorCode);
    }

    const { access_token, user: userData } = data;
    const newProfile = await fetchProfile(access_token, userData.id);

    await Promise.all([
      sessionStorage.setToken(access_token),
      sessionStorage.setProfile(JSON.stringify(newProfile)),
    ]);

    setSession({ access_token });
    setUser({ id: userData.id });
    setProfile(newProfile);
  }, []);

  // ── signOut ──────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      if (session?.access_token) {
        await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'apikey': CONFIG.SUPABASE_ANON_KEY,
          },
        });
      }
    } catch (e) {
      console.warn('[Auth] Falha no logout:', e);
    } finally {
      await sessionStorage.clearAll();
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{ user, profile, session, isLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
