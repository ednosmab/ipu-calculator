// src/core/auth/AuthProvider.tsx
// Restaura sessão ao iniciar app; expõe signIn e signOut

import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext, AuthContextValue, UserProfile, AuthSession } from './AuthContext';
import { sessionStorage } from './sessionStorage';

const API_BASE = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL ?? '';

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
          // para garantir que o role e status continuam válidos
          try {
            const res = await fetch(`${API_BASE}/auth-validate`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (res.ok) {
              const { profile: freshProfile } = await res.json();
              const parsedProfile: UserProfile = JSON.parse(storedProfileRaw);

              // Atualiza com dados frescos do servidor
              setSession({ access_token: storedToken });
              setUser({ id: freshProfile.id });
              setProfile(freshProfile);

              // Persiste o profile atualizado no storage
              await sessionStorage.setProfile(JSON.stringify(freshProfile));
            } else {
              // Token invalidado pelo servidor (ex: role mudou, conta suspensa)
              console.warn('[Auth] Sessão invalidada pelo servidor, limpando local');
              await sessionStorage.clearAll();
            }
          } catch (validateError) {
            // Fallback: usa o profile cacheado se a validação falhar
            // (ex: offline, Edge Function indisponível)
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

  // ── signIn ───────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Propaga o código de erro para a tela de login tratar
      throw new Error(data.error ?? 'INTERNAL_ERROR');
    }

    const { session: newSession, profile: newProfile } = data;

    // Persiste no storage seguro
    await Promise.all([
      sessionStorage.setToken(newSession.access_token),
      sessionStorage.setProfile(JSON.stringify(newProfile)),
    ]);

    setSession(newSession);
    setUser({ id: newProfile.id });
    setProfile(newProfile);
  }, []);

  // ── signOut ──────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      // Invalida sessão no servidor — mesmo que falhe, limpa o estado local
      if (session?.access_token) {
        await fetch(`${API_BASE}/auth-logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch (e) {
      console.warn('[Auth] Falha no logout remoto:', e);
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
