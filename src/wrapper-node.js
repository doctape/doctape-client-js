var util   = require('util');
var events = require('events');
var http   = require('http');
var https  = require('https');

var DoctapeSimple = this.DoctapeSimple;

var Doctape = module.exports = function (config) {

  var self = new DoctapeSimple(config);
  self.prototype = DoctapeSimple;

  var emitter = new events.EventEmitter();

  self.core.env.emit = function (event, data) {
    emitter.emit(event, data);
  };

  self.core.env.subscribe = function (event, fn) {
    emitter.addListener(event, fn);
  };

  self.core.env.unsubscribe = function (event, fn) {
    emitter.removeListener(event, fn);
  };

  self.core.env.req = function (options, cb) {

    var mod = (options.protocol === 'http') ? http : https;
    options.protocol = undefined;

    var req = mod.request(options, function (resp) {

      var responseData = '';

      resp.setEncoding('utf8');

      resp.on('data', function (chunk) {
        responseData += chunk;
      });

      resp.on('end', function () {
        cb(null, responseData);
      });

    });

    req.on('error', function (err) {
      cb(err);
    });

    if (options.postData) {
      req.write(options.postData);
    }

    req.end();

  };

  return self;

};