import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  // Only treat *.test.ts files as test suites — helpers/ are excluded
  testMatch: ['**/*.test.ts'],
  globalSetup:        '<rootDir>/src/__tests__/helpers/globalSetup.ts',
  setupFiles:         ['<rootDir>/src/__tests__/helpers/env.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/helpers/jest.setup.ts'],
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
};

export default config;
