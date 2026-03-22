import getRollupOptions from '../config/rollup.config';
import pkg from './package.json';

export default getRollupOptions(
    'src/index.tsx',
    pkg.main,
    pkg.module,
    pkg.styles,
    // we need to bundle these packages, because these are imported in web workers
    // otherwise web workers cannot find these packages in runtime
    {
        exclude: ['tayden-clusterfck', 'jstat'],
    }
);
