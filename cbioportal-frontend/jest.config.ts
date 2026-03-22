import { InitialOptionsTsJest } from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
    preset: 'ts-jest/presets/js-with-ts',
    moduleNameMapper: {
        '\\.(css|sass|less|scss)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/fileMock.js',
        '^containers(.*)$': '<rootDir>/src/containers$1',
        '^components(.*)$': '<rootDir>/src/components$1',
        '^config(.*)$': '<rootDir>/src/config$1',
        '^utils(.*)$': '<rootDir>/src/utils$1',
        '^styles(.*)$': '<rootDir>/src/styles$1',
        '^pages(.*)$': '<rootDir>/src/pages$1',
        '^shared(.*)$': '<rootDir>/src/shared$1',
        '^test(.*)$': '<rootDir>/src/test$1',
    },
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.test.json',
        },
    },
    setupFiles: ['<rootDir>/src/setupTests.ts', 'jest-canvas-mock'],
    testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.spec.tsx'],
};

export default config;
