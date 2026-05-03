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

// Store em memória para testes de AsyncStorage
const memoryStore: Record<string, string> = {};

// Mock manual do AsyncStorage com store em memória
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key: string, value: string) => {
    memoryStore[key] = value;
    return Promise.resolve();
  }),
  getItem: jest.fn((key: string) => {
    return Promise.resolve(memoryStore[key] ?? null);
  }),
  removeItem: jest.fn((key: string) => {
    delete memoryStore[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(memoryStore))),
  multiGet: jest.fn((keys: string[]) =>
    Promise.resolve(keys.map(k => [k, memoryStore[k] ?? null]))
  ),
  multiSet: jest.fn((pairs: [string, string][]) => {
    pairs.forEach(([k, v]) => { memoryStore[k] = v; });
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach(k => delete memoryStore[k]);
    return Promise.resolve();
  }),
  multiMerge: jest.fn(() => Promise.resolve()),
}));

// Expor store para reset nos testes
export { memoryStore };

// Mock do Supabase Client
jest.mock('@/core/infra/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
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

// Mock para i18n useTranslation
jest.mock('@/i18n/TranslationContext', () => {
  const actual = jest.requireActual('@/i18n/TranslationContext');
  const ptLabels: Record<string, string> = {
    isocyanate: 'Isocianato',
    polyol: 'Poliol',
    calculateInjection: 'Calcular Injeção',
    saveAsModel: 'Salvar como Modelo',
    modelName: 'Nome do Modelo',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    deleteModel: 'Excluir Modelo',
    calibrateFlow: 'Calibrar Vazão',
    weightHelper: 'Assistente de Peso Real',
    extractedWeight: 'Peso extraído',
    averageValue: 'Valor Média',
    targetWeight: 'Peso desejado',
    machineValue: 'Valor da máquina',
    actualWeight: 'Peso real',
    calculateAdjustment: 'Calcular Ajuste',
    clear: 'Limpar',
    back: 'Voltar',
    goToCalculator: 'Calcular Injeção',
    goToCalibration: 'Calibrar Vazão',
    result: 'Valor Calculado',
  };

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => ptLabels[key] || key,
      language: 'pt',
      toggleLanguage: jest.fn(),
    }),
  };
});
