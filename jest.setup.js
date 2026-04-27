require('@testing-library/react-native/matchers');

// Mocks essenciais para Expo 54
global.__ExpoImportMetaRegistry = {};
global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

jest.mock('expo-router/head', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  };
});

// Trava de segurança para o erro do Winter Runtime do Expo 54
jest.mock('expo/src/winter/installGlobal', () => ({
  installGlobal: jest.fn(),
  getValue: jest.fn(() => ({})),
}));

jest.mock('expo/src/winter/runtime.native', () => ({}));
jest.mock('expo/src/winter/runtime.native.ts', () => ({}));

jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
}));

// Mock do Modal para renderizar os filhos nos testes
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Modal = ({ children, visible }: any) => (visible ? (children) : null);
  return RN;
});

// Mock manual do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  multiMerge: jest.fn(() => Promise.resolve()),
}));

// Mock do NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// Mock do Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
}));

// Mock do Expo Haptics
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
}));

// Mock do Expo Icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    FontAwesome5: (props) => React.createElement('FontAwesome5', props, props.children),
  };
});

// Mock para o Logger
jest.mock('@/core/logging/LogService', () => ({
  logService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
