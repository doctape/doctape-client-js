window.Doctape = function (config) {

  var self = new DoctapeSimple(config);
  self.prototype = DoctapeSimple;

  /*
  ** EVENT ARCHITECTURE
  */

  (function () {

    var evcb = {};

    this.emit = function (event, data) {
      setTimeout(function () {
        var i, l;
        if (evcb[event] !== undefined && (l = evcb[event].length) > 0) {
          for (i = 0; i < l; i++) {
            if (typeof evcb[event][i] === 'function') {
              evcb[event][i](data);
            }
          }
        }
      }, 0);
    };

    this.subscribe = function (event, fn) {
      if (evcb[event] === undefined) {
        evcb[event] = [fn];
      } else if (evcb[event].indexOf(fn) === -1) {
        evcb[event].push(fn);
      }
    };

    this.unsubscribe = function (event, fn) {
      var idx;
      if (evcb[event] !== undefined && (idx = evcb[event].indexOf(fn)) !== -1) {
        evcb[event].splice(idx, 1);
      }
    };

  }).call(self.core.env);

  /*
  ** REQUEST ARCHITECTURE
  */

  self.core.env.req = function (options, cb) {
    var header,
        headers = options.headers || {},
        method  = options.method  || 'GET',
        url     = options.protocol + '://' + options.host +
                  (options.port ? ':' + options.port : '') + options.path,
        xhr     = new XMLHttpRequest();
    xhr.open(method, url);
    for (header in headers) {
      xhr.setRequestHeader(header, headers[header]);
    }
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.responseText !== null) {
          cb(null, xhr.responseText);
        } else {
          cb(xhr.statusText);
        }
      }
    };
    xhr.send();
  };

  var getHashObject = function () {
    var i, obj = {}, part, parts = window.location.hash.substr(1).split('&');
    for (i = 0; i < parts.length; i++) {
      part = parts[i].split('=');
      obj[decodeURIComponent(part[0])] = decodeURIComponent(part[1]);
    }
    return obj;
  };

  self.run = function (cb) {
    var hash = getHashObject();
    if (typeof hash.access_token === 'undefined' && typeof hash.error === 'undefined') {
      window.location = self.authURL + '&state=' + encodeURIComponent(hash.state);
    } else {
      self.useToken({
        token_type:   'Bearer',
        expires_in:   3600,
        access_token: hash.access_token
      }, cb);
    }
  };

  self.init();

  return self;

};
