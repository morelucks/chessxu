module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.jest.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage-jest',
  collectCoverageFrom: ['src/**/*.ts', '!src/simulation.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
    }],
  },
};
