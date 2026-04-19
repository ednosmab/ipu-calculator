module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/utils/**/*.test.ts',
        '<rootDir>/src/services/**/*.test.ts'
      ],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
    },
    {
      preset: 'jest-expo',
      displayName: 'integration',
      testMatch: [
        '<rootDir>/src/**/*.test.tsx',
        '<rootDir>/src/**/__tests__/**/*.test.ts'
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/src/services/',
        '/src/utils/'
      ],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
      ],
    },
  ],
};
