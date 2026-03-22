let { context, file, mocha, options } = module.parent.context;
let { describe, it } = context;

const ipc = require('node-ipc');

// ipc.config.id = 'a-unique-process-name2';
// ipc.config.retry = 1500;
// ipc.config.silent = true;

// ipc.connectTo('a-unique-process-name1', () => {
//     ipc.of['jest-observer'].on('connect', () => {
//         ipc.of['jest-observer'].emit('a-unique-message-name', "The message we send");
//     });
// });

const oldIt = it;
const oldSkip = oldIt.skip;

// context.it = function(...args) {
//     ipc.connectTo('runnerProcess', () => {
//         ipc.of['runnerProcess'].on('connect', () => {
//             ipc.of['runnerProcess'].emit('test_it', args[0]);
//         });
//     });
//     return oldIt.apply(this, args);
// };

// context.it.skip = function(...args) {
//     ipc.connectTo('runnerProcess', () => {
//         ipc.of['runnerProcess'].on('connect', () => {
//             ipc.of['runnerProcess'].emit('test_skipped', args[0]);
//         });
//     });
//     return oldSkip.apply(this, arguments);
// };

//context.it.only = it.only;
