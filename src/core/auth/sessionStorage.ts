// src/core/auth/sessionStorage.ts
// Adapter de sessão por plataforma:
//   nativo → expo-secure-store (nunca AsyncStorage para tokens)
//   web    → window.sessionStorage (nunca localStorage — some ao fechar aba)

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'ipu_session';
const PROFILE_KEY = 'ipu_profile';

export const sessionStorage = {
  // ── Token de sessão ────────────────────────────────────────

  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return window.sessionStorage.getItem(SESSION_KEY);
    }
    return SecureStore.getItemAsync(SESSION_KEY);
  },

  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      window.sessionStorage.setItem(SESSION_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(SESSION_KEY, token);
  },

  async clearToken(): Promise<void> {
    if (Platform.OS === 'web') {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },

  // ── Profile cacheado (para restauração de sessão) ──────────

  async getProfile(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return window.sessionStorage.getItem(PROFILE_KEY);
    }
    return SecureStore.getItemAsync(PROFILE_KEY);
  },

  async setProfile(profile: string): Promise<void> {
    if (Platform.OS === 'web') {
      window.sessionStorage.setItem(PROFILE_KEY, profile);
      return;
    }
    await SecureStore.setItemAsync(PROFILE_KEY, profile);
  },

  async clearProfile(): Promise<void> {
    if (Platform.OS === 'web') {
      window.sessionStorage.removeItem(PROFILE_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(PROFILE_KEY);
  },

  // ── Clear completo (usado no signOut) ──────────────────────

  async clearAll(): Promise<void> {
    await Promise.all([
      sessionStorage.clearToken(),
      sessionStorage.clearProfile(),
    ]);
  },
};
