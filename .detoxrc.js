/**
 * Detox Jest Configuration
 * Configuration for running E2E tests with Jest and Detox
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'detox/runners/jest',
  testTimeout: 120000,
  maxWorkers: 1,
  verbose: true,
  
  // Test files pattern
  testMatch: ['**/__tests__/e2e/**/*.test.ts'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/e2e/setup.ts'],
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/unit/',
    '<rootDir>/__tests__/integration/',
  ],
  
  // Coverage settings (disabled for E2E tests)
  collectCoverage: false,
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports/e2e',
      outputName: 'junit.xml',
    }],
  ],
  
  // Global setup/teardown
  globalSetup: './detox/globalSetup.js',
  globalTeardown: './detox/globalTeardown.js',
};
