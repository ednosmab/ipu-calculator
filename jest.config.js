module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/src/**/*.test.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
    },
    {
      preset: 'jest-expo',
      displayName: 'integration',
      testMatch: ['**/src/**/*.test.tsx', '**/hooks/__tests__/**/*.test.ts'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
      ],
    },
  ],
};
