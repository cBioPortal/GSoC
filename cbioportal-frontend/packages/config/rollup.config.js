import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
// import external from 'rollup-plugin-peer-deps-external';
import externals from 'rollup-plugin-node-externals';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import image from '@rollup/plugin-image';
import postcssUrl from 'postcss-url';
import workerLoader from 'rollup-plugin-web-worker-loader';

// common rollup config options for all libraries under packages
export default function getRollupOptions(
    input,
    mainOutput,
    moduleOutput,
    styles,
    nodeExternalsOptions
) {
    return {
        input: input,
        output: [
            {
                file: mainOutput,
                format: 'cjs',
                exports: 'named',
                sourcemap: true,
            },
            {
                file: moduleOutput,
                format: 'es',
                exports: 'named',
                sourcemap: true,
            },
        ],
        plugins: [
            externals(nodeExternalsOptions),
            postcss({
                autoModules: true,
                extract: styles,
                plugins: [
                    postcssUrl({
                        url: 'inline',
                    }),
                ],
            }),
            image(),
            typescript({
                clean: true,
            }),
            json(),
            workerLoader(),
            commonjs(),
            resolve(),
            sourcemaps(),
        ],
        watch: {
            chokidar: {
                usePolling: true,
            },
        },
    };
}
