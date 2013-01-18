var repl = require('repl');

global.Doctape = require('../doctape_node.js');

global.dt = new Doctape();

dt.setScope(['docs', 'account']);
dt.setCredentials(null /* INSERT CLIENT ID HERE */,
                  null /* INSERT CLIENT SECRET HERE */);

console.log('Please visit ' + dt.authUrl('http://github.com/'));

repl.start({
  prompt: 'dt> ',
  useGlobal: true
});