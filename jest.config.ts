export default {  
  testTimeout: 10000,
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts'
  ],
};
