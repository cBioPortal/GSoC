import { InitialOptionsTsJest } from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
    preset: 'ts-jest/presets/js-with-ts',
    moduleNameMapper: {
        '\\.(css|sass|less|scss)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/../config/fileMock.js',
        'web-worker:*': 'identity-obj-proxy',
    },
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.test.json',
        },
    },
    setupFiles: ['jest-canvas-mock', '<rootDir>/../config/setupTests.ts'],
    testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.spec.tsx'],
};

export default config;
