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

  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 3000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

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
            const res = await fetchWithTimeout(`${CONFIG.SUPABASE_URL}/auth/v1/user`, {
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
              setUser({ id: userData.id, email: userData.email, role: freshProfile.role });
              setProfile(freshProfile);

              await sessionStorage.setProfile(JSON.stringify(freshProfile));
            } else {
              console.warn('[Auth] Token rejeitado pelo servidor, limpando local');
              await sessionStorage.clearAll();
            }
          } catch (validateError) {
            console.warn('[Auth] Falha na validação (offline ou timeout), usando cache:', validateError);
            const storedProfile: UserProfile = JSON.parse(storedProfileRaw);
            setSession({ access_token: storedToken });
            setUser({ id: storedProfile.id, email: undefined, role: storedProfile.role });
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
    try {
      // Tenta primeiro via REST API (mais rápido se RLS estiver OK)
      const res = await fetchWithTimeout(
        `${CONFIG.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,name,role,active`,
        {
          headers: {
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        const profileData = data?.[0];
        if (profileData) {
          return {
            id: userId,
            name: profileData.name,
            role: profileData.role,
            active: profileData.active,
          };
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn('[Auth] Falha no profile via REST:', res.status, errorData);
      }
    } catch (restError) {
      console.warn('[Auth] Erro na REST API de profile:', restError);
    }

    // Fallback: Tenta via Edge Function (mais robusto, bypass RLS)
    try {
      console.log('[Auth] Tentando fallback via auth-validate...');
      const validateRes = await fetchWithTimeout(
        `${CONFIG.EDGE_FUNCTIONS_URL}/auth-validate`,
        {
          headers: {
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (validateRes.ok) {
        const validateData = await validateRes.json();
        return validateData.profile;
      }
      console.warn('[Auth] Falha no fallback auth-validate:', validateRes.status);
    } catch (validateError) {
      console.error('[Auth] Erro crítico no fallback de profile:', validateError);
    }

    // Default fallback (mínimo privilégio)
    return {
      id: userId,
      name: 'Usuário',
      role: 'viewer',
      active: true,
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
    setUser({ id: userData.id, email: userData.email, role: newProfile.role });
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
