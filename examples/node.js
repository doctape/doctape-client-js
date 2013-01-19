var repl = require('repl');

global.Doctape = require('../distrib-node/doctape.js');

global.dt = Doctape({
  appType:     'server',
  appId:       'a6015f8e-9f62-4d08-80fe-8969c53f566b',
  appSecret:   '6767689e-2f64-4575-b364-37956ca0cda9',
  callbackURL: 'urn:ietf:wg:oauth:2.0:oob',
  scope:       ['docs', 'account']
});

console.log('Please visit ...');
console.log(dt.authURL);
console.log('... and then call proceed(code) with the obtained code!');

global.proceed = function (code) {
  dt.useCode(code, function () {
    this.getAccount(function (acc) {
      console.log(acc);
    });
  });
};

repl.start({
  prompt: 'dt> ',
  useGlobal: true
});