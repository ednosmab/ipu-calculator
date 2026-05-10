import { Platform } from 'react-native';

export const sessionStorage = {
  async getToken() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.sessionStorage.getItem('token');
    }

    return null;
  },

  async setToken(token: string) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.sessionStorage.setItem('token', token);
    }
  },

  async clearToken() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.sessionStorage.removeItem('token');
    }
  },
};
