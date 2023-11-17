import type { Config } from 'jest';

export class SomeClass {
  constructor(
    public type: number,
    public anotherType: number = -1
  ) {}

  logType(): void {
    console.log('type:       ', this.type);
    console.log('anotherType:', this.anotherType);
  }
}

export class Variant1 extends SomeClass {
  type = 1;
}

export class Variant2 extends SomeClass {
  type = 2;
  anotherType = 3;
}

const config: Config = {
  preset: 'ts-jest',
  verbose: true,
  clearMocks: true,
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverage: true,
  coverageReporters: ['json', 'text', 'text-summary', 'lcov'],
  collectCoverageFrom: ['./src/**'],
  coverageThreshold: {
    global: { branches: 0, functions: 0, lines: 0 },
  },
  // These are needed due to an ongoing issue with jest:
  // https://github.com/jestjs/jest/issues/9324
  detectOpenHandles: true,
  forceExit: true,
};

export default config;
