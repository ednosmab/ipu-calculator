module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/core/**/*.test.ts',
        '<rootDir>/src/features/**/domain/**/*.test.ts'
      ],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      preset: 'jest-expo',
      displayName: 'integration',
      testMatch: [
        '<rootDir>/src/**/*.test.tsx',
        '<rootDir>/src/hooks/**/__tests__/**/*.test.ts',
        '<rootDir>/src/features/**/hooks/**/*.test.ts',
        '<rootDir>/src/design-system/__tests__/**/*.test.tsx'
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/src/core/',
        '/src/features/.*/domain/'
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
      ],
    },
  ],
};
