// allow these file patterns to be imported
declare module '*.scss';
declare module '*.json';
declare module '*.md';
declare module '*.svg';

// these packages are missing typings
declare module 'fmin';
declare module 'deep-equal-in-any-order';
declare module 'object-sizeof';
declare module 'save-svg-as-png';
declare module 'react-file-download';
declare module 'react-zeroclipboard';
declare module 'reactableMSK';
declare module 'redux-seamless-immutable';
declare module 'render-if';
declare module 'react-if';
declare module 'webpack-raphael';
declare module 'javascript-natural-sort';
declare module 'expect';
declare module 'expect-jsx';
declare module 'parameter-validator';
declare module 'better-react-spinkit';
declare module 'recompose/withContext';
declare module 'react-text-truncate';
declare module 'react-resize-detector';
declare module 'react-rangeslider';
declare module 'jStat';
declare module 'svgsaver';
declare module 'addthis-snippet';
declare module 'd3-dsv';
declare module 'd3';
declare module 'victory';
declare module 'universal-ga';
declare module 'mixpanel-browser';
declare module 'measure-text';
declare module 'contrast';
declare module 'react-spinkit';
declare module 'react-portal';
declare module 'little-loader';
declare module 'igv';
declare module 'react-mfb';
declare module 'regression';
declare module 'react-select1';
declare module 'react-select';
declare module 'react-select/async';
declare module 'pluralize';
declare module 'svg2pdf.js';
declare module 'jspdf-yworks';
declare module '3dmol';
declare module 'reactour';
declare module 'react-reveal';
declare module 'react-column-resizer';
declare module 'linear-algebra';
declare module 'Cheerio';
declare module 'superagent-cache';

// this is to silence annoying Cheerio ts error from enzyme
type Cheerio = any;
