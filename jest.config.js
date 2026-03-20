module.exports = {
  preset: 'react-native',
  setupFilesAfterSetup: ['./jest.setup.js'],
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/src/**/__tests__/**/*.test.(ts|tsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated|react-native-gesture-handler)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    'react-native-reanimated': '<rootDir>/src/__tests__/__mocks__/react-native-reanimated.ts',
    'react-native-gesture-handler': '<rootDir>/src/__tests__/__mocks__/react-native-gesture-handler.tsx',
  },
};
