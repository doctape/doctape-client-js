var util   = require('util');
var events = require('events');
var http   = require('http');
var https  = require('https');

var DoctapeCore = this.DoctapeCore;

var Doctape = module.exports = function () {

  var self = new DoctapeCore();
  self.prototype = DoctapeCore;

  self.env.isNode = true;

  self.env.emitter = new events.EventEmitter();

  self.env.emit = function (event, data) {
    self.env.emitter.emit(event, data);
  };

  self.env.subscribe = function (event, fn) {
    self.env.emitter.addListener(event, fn);
  };

  self.env.unsubscribe = function (event, fn) {
    self.env.emitter.removeListener(event, fn);
  };

  self.env.req = function (options, cb) {

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