(function () {

  // ## Simple Constructor

  // The DoctapeSimple class holds the DoctapeCore object
  // and exposes just a few simple methods.

  var DoctapeSimple = this['DoctapeSimple'] = function (config) {

    if (typeof config      !== 'object'  ||
        config.scope       === undefined ||
        config.appType     === undefined ||
        config.appId       === undefined ||
        config.callbackURL === undefined) {
      throw 'Incomplete Doctape Configuration!';
    }

    if (config.appType !== 'server' &&
        config.appType !== 'client') {
      throw 'Invalid App Type!';
    }

    var core = this.core = new DoctapeCore();
    core.options.scope         = config.scope;
    core.options.client_id     = config.appId;
    core.options.client_secret = config.appSecret || null;

    this.authURL = core.authUrl(config.callbackURL,
                                (config.appType === 'server') ? 'code' : 'token');

    this.onauthfail = null;

  };

  /*
  ** Method for initialization using a previously obtained
  ** authCode.
  */

  DoctapeSimple.prototype.useCode = function (code, cb) {
    var _this = this;
    var _cb = function () {
      _this.core.unsubscribe('auth.refresh', _cb);
      if (typeof cb === 'function') {
        cb.call(_this);
      }
    };
    this.core.subscribe('auth.fail', function () {
      _this.core.unsubscribe('auth.refresh', _cb);
      if (typeof _this.onauthfail === 'function') {
        _this.onauthfail.call(this);
      }
    });
    this.core.subscribe('auth.refresh', _cb);
    this.core.exchange(code);
  };

  /*
  ** Method for initialization with an implicit token.
  */

  DoctapeSimple.prototype.useToken = function (token, cb) {
    var _this = this;
    this.core.subscribe('auth.fail', function () {
      if (typeof _this.onauthfail === 'function') {
        _this.onauthfail.call(this);
      }
    });
    this.core.setToken(token);
    cb.call(this);
  }

  var mkResourceCallbackHandler = function (cb) {
    return function (err, data) {
      if (err) {
        throw err.toString();
      } else {
        return cb(data);
      }
    };
  }

  var mkResourceCallbackHandlerForJSON = function (cb) {
    return mkResourceCallbackHandler(function (data) {
      json = JSON.parse(data);
      if (json.error) {
        throw json.error.toString();
      } else {
        return cb(json.result);
      }
    });
  };

  var mkResourceCallbackHandlerForBinary = function (cb) {
    return mkResourceCallbackHandler(function (data) {
      return cb(data);
    });
  };

  DoctapeSimple.prototype.getAccount = function (cb) {
    this.core.getResource('/account', mkResourceCallbackHandlerForJSON(cb));
  };

  DoctapeSimple.prototype.getAvatar = function (size, cb) {
    this.core.getResource('/account/avatar/' + size, mkResourceCallbackHandlerForBinary(cb));
  };

  DoctapeSimple.prototype.getDocumentList = function (cb) {
    this.core.getResource('/doc?include_meta=false', mkResourceCallbackHandlerForJSON(cb));
  };

  DoctapeSimple.prototype.getDocumentListWithMetadata = function (cb) {
    this.core.getResource('/doc?include_meta=true', mkResourceCallbackHandlerForJSON(cb));
  };

}).call(this);