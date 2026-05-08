// src/core/auth/sessionStorage.ts
// Adapter de sessão por plataforma:
//   nativo → expo-secure-store (nunca AsyncStorage para tokens)
//   web    → window.sessionStorage (nunca localStorage — some ao fechar aba)

import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'ipu_session';
const PROFILE_KEY = 'ipu_profile';

const isWeb = typeof window !== 'undefined';

export const sessionStorage = {
  async getToken(): Promise<string | null> {
    if (isWeb) {
      return window.sessionStorage.getItem(SESSION_KEY);
    }
    return SecureStore.getItemAsync(SESSION_KEY);
  },

  async setToken(token: string): Promise<void> {
    if (isWeb) {
      window.sessionStorage.setItem(SESSION_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(SESSION_KEY, token);
  },

  async clearToken(): Promise<void> {
    if (isWeb) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },

  async getProfile(): Promise<string | null> {
    if (isWeb) {
      return window.sessionStorage.getItem(PROFILE_KEY);
    }
    return SecureStore.getItemAsync(PROFILE_KEY);
  },

  async setProfile(profile: string): Promise<void> {
    if (isWeb) {
      window.sessionStorage.setItem(PROFILE_KEY, profile);
      return;
    }
    await SecureStore.setItemAsync(PROFILE_KEY, profile);
  },

  async clearProfile(): Promise<void> {
    if (isWeb) {
      window.sessionStorage.removeItem(PROFILE_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(PROFILE_KEY);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      sessionStorage.clearToken(),
      sessionStorage.clearProfile(),
    ]);
  },
};
