import getRollupOptions from '../config/rollup.config';
import pkg from './package.json';

export default getRollupOptions(
    'src/index.tsx',
    pkg.main,
    pkg.module,
    pkg.styles
);
