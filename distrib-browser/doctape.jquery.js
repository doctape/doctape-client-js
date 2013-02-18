(function () {

  // ## Core Constructor

  // The Doctape core module consists of a platform-independent
  // DoctapeCore-class which holds the configuration and performs
  // the OAuth procedures.

  var DoctapeCore = this['DoctapeCore'] = function () {

    this.options = {
      authPt: {
        protocol: 'https',
        host:  'my.doctape.com',
        port:  null,
        base:  '/oauth2'
      },
      resourcePt: {
        protocol: 'https',
        host:  'api.doctape.com',
        port:  null,
        base:  '/v1'
      },
      scope: [],
      client_id:     null,
      client_secret: null
    };

    this._token = {
      type:      null,
      timeout:   null,
      timestamp: null,
      access:    null,
      refresh:   null
    };

    // This library factors the platform-dependent back-end including
    // functions like http-request or getting an access token
    // into "environments". The following object has to be filled by
    // the environment.

    this.env = {
      emit:        null,
      subscribe:   null,
      unsubscribe: null,
      req:         null
    };

  };


  // ## Getter / Setter Functions

  var setToken = DoctapeCore.prototype.setToken = function (obj) {
    this._token.type      = obj.token_type;
    this._token.timeout   = obj.expires_in;
    this._token.timestamp = obj.timestamp || (new Date()).getTime();
    this._token.access    = obj.access_token;
    this._token.refresh   = obj.refresh_token;
  };

  var token = DoctapeCore.prototype.token = function () {
    return {
      token_type:    this._token.type,
      expires_in:    this._token.timeout,
      timestamp:     this._token.timestamp,
      access_token:  this._token.access,
      refresh_token: this._token.refresh
    };
  };

  var setAuthPt = DoctapeCore.prototype.setAuthPt = function (url) {
    var parts = url.match(/([a-z]+):\/\/([^:]+):?([0-9]+)?(\/.*)/);
    this.options.authPt.protocol = parts[1]               || null;
    this.options.authPt.host     = parts[2]               || null;
    this.options.authPt.port     = parseInt(parts[3], 10) || null;
    this.options.authPt.base     = parts[4]               || null;
  };

  var authPt = DoctapeCore.prototype.authPt = function () {
    return this.options.authPt.protocol + '://' + this.options.authPt.host +
           (this.options.authPt.port ? ':' + this.options.authPt.port : '') +
           this.options.authPt.base;
  };

  var authUrl = DoctapeCore.prototype.authUrl = function (redirect, type) {
    var uri  = redirect || 'urn:ietf:wg:oauth:2.0:oob';
    return authPt.call(this) +
           '?' + 'response_type=' + (type || 'code') +
           '&' + 'client_id='     + encodeURIComponent(this.options.client_id) +
           '&' + 'scope='         + encodeURIComponent(this.options.scope.join(' ')) +
           '&' + 'redirect_uri='  + uri;
  };

  var setResourcePt = DoctapeCore.prototype.setResourcePt = function (url) {
    var parts = url.match(/([a-z]+):\/\/([^:]+):?([0-9]+)?(\/.*)/);
    this.options.resourcePt.protocol = parts[1]               || null;
    this.options.resourcePt.host     = parts[2]               || null;
    this.options.resourcePt.port     = parseInt(parts[3], 10) || null;
    this.options.resourcePt.base     = parts[4]               || null;
  };

  var resourcePt = DoctapeCore.prototype.resourcePt = function () {
    return this.options.resourcePt.protocol + '://' + this.options.resourcePt.host +
           (this.options.resourcePt.port ? ':' + this.options.resourcePt.port : '') +
           this.options.resourcePt.base;
  };


  // ## Core Functions

  // Not for direct use.

  /**
   * Perform a standard POST-request to the auth point with raw form post data.
   *
   * @param {string} path
   * @param {Object} data
   * @param {function (Object, Object=)} cb
   */
  var postAuth = function (path, data, cb) {
    var lines = [];
    var field;
    for (field in data) {
      lines.push(field + '=' + encodeURIComponent(data[field]));
    }
    this.env.req({
      method:   'POST',
      protocol: this.options.authPt.protocol,
      host:     this.options.authPt.host,
      port:     this.options.authPt.port,
      path:     this.options.authPt.base + path,
      headers:  {'Content-Type': 'application/x-www-form-urlencoded'},
      postData: lines.join('&')
    }, cb);
  };


  // ## OAuth functions

  // These functions will authorize the client on a doctape
  // API server.

  /**
   * Perform an authorized GET-request using an access-token.
   *
   * @param {string} endpoint
   * @param {function (Object, Object=)} cb
   */
  var getResource = DoctapeCore.prototype.getResource = function (endpoint, cb) {
    var self = this;
    withValidAccessToken.call(this, function (token) {
      self.env.req({
        method:   'GET',
        protocol: self.options.resourcePt.protocol,
        host:     self.options.resourcePt.host,
        port:     self.options.resourcePt.port,
        path:     self.options.resourcePt.base + endpoint,
        headers:  {'Authorization': 'Bearer ' + token}
      }, cb);
    });
  };

  /**
   * Perform an authorized POST-request using an access-token.
   *
   * @param {string} endpoint
   * @param {Object} data
   * @param {function (Object, Object=)} cb
   */
  var postResource = DoctapeCore.prototype.postResource = function (endpoint, data, cb) {
    var self = this;
    withValidAccessToken.call(this, function (token) {
      self.env.req({
        method:   'POST',
        protocol: self.options.resourcePt.protocol,
        host:     self.options.resourcePt.host,
        port:     self.options.resourcePt.port,
        path:     self.options.resourcePt.base + endpoint,
        headers:  {'Authorization': 'Bearer ' + token,
                   'Content-Type': 'application/json; charset=UTF-8'},
        postData: JSON.stringify(data)
      }, cb);
    });
  };

   /**
   * Perform an authorized DELETE-request using an access-token.
   *
   * @param {string} endpoint
   * @param {function (Object, Object=)} cb
   */
  var deleteResource = DoctapeCore.prototype.deleteResource = function (endpoint, cb) {
    var self = this;
    withValidAccessToken.call(this, function (token) {
      self.env.req({
        method:   'DELETE',
        protocol: self.options.resourcePt.protocol,
        host:     self.options.resourcePt.host,
        port:     self.options.resourcePt.port,
        path:     self.options.resourcePt.base + endpoint,
        headers:  {'Authorization': 'Bearer ' + token}
      }, cb);
    });
  };

  /**
   * Ensure a valid access token, then continue.
   *
   * @param {function (?string)} fn
   */
  var withValidAccessToken = DoctapeCore.prototype.withValidAccessToken = function (fn) {
    if (this._token.timestamp + this._token.timeout * 1000 > (new Date()).getTime()) {
      return fn(this._token.access);
    } else {
      var self = this;
      var on_refresh = function () {
        withValidAccessToken.call(self, fn);
        unsubscribe.call(self, 'auth.refresh', on_refresh);
      };
      subscribe.call(this, 'auth.refresh', on_refresh);
      refresh.call(this);
    }
  };

  /**
   * Private helper function for registering a new token.
   * @param {string} error_msg
   */
  var mkTokenRegistry = function (error_msg) {
    var self = this;
    return function (err, resp) {
      self._lock_refresh = undefined;
      if (!err) {
        var auth = JSON.parse(resp);
        if (!auth.error) {
          setToken.call(self, auth);
          return emit.call(self, 'auth.refresh', token.call(self));
        }
        return emit.call(self, 'auth.fail', error_msg + ': ' + JSON.stringify(auth.error));
      }
      return emit.call(self, 'auth.fail', error_msg + ': ' + JSON.stringify(err));
    };
  };

  /**
   * Exchange an authorization code for an access token and a
   * refresh token.
   *
   * @param {string} code
   */
  var exchange = DoctapeCore.prototype.exchange = function (code) {
    if (this._lock_refresh === undefined) {
      this._lock_refresh = true;
      postAuth.call(this, '/token',
        { code:          code,
          client_id:     this.options.client_id,
          client_secret: this.options.client_secret,
          redirect_uri:  'urn:ietf:wg:oauth:2.0:oob',
          grant_type:    'authorization_code' },
        mkTokenRegistry.call(this, 'error exchanging token'));
    }
  };

  /**
   * Get a new access token by using the already-received refresh
   * token.
   */
  var refresh = DoctapeCore.prototype.refresh = function () {
    if (this._lock_refresh === undefined) {
      this._lock_refresh = true;
      postAuth.call(this, '/token',
        { refresh_token: this._token.refresh,
          client_id:     this.options.client_id,
          client_secret: this.options.client_secret,
          grant_type:    'refresh_token' },
        mkTokenRegistry.call(this, 'error refreshing token'));
    }
  };


  // ## Misc functions

  /**
   * Emit an event.
   */
  var emit = DoctapeCore.prototype.subscribe = function (ev, data) {
    this.env.emit(ev, data);
  };

  /**
   * Subscribe to a specific event.
   */
  var subscribe = DoctapeCore.prototype.subscribe = function (ev, fn) {
    this.env.subscribe(ev, fn);
  };

  /*
   * Unsubscribe from a specific event.
   */
  var unsubscribe = DoctapeCore.prototype.unsubscribe = function (ev, fn) {
    this.env.unsubscribe(ev, fn);
  };

}).call(this);(function () {

  var DoctapeCore = this.DoctapeCore;

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
  };

  var mkResourceCallbackHandler = function (cb, errcb, handler) {
    var noerr = true;
    return function (err, data) {
      try {
        if (!err) { data = handler(data); }
        else      { throw err.toString(); }
      } catch (e) {
        noerr = false;
        if (typeof errcb === 'function') { errcb(e); }
        else { throw e; }
      }
      if (noerr) {
        if (typeof cb === 'function') { cb(data); }
        else if (typeof errcb === 'function') { errcb(null,  data); }
      }
    };
  };

  var mkResourceCallbackHandlerForJSON = function (cb, errcb) {
    return mkResourceCallbackHandler(cb, errcb, function (data) {
      json = JSON.parse(data);
      if (json.error) {
        throw json.error.toString();
      } else {
        return json.result;
      }
    });
  };

  var mkResourceCallbackHandlerForBinary = function (cb, errcb) {
    return mkResourceCallbackHandler(cb, errcb, function (data) {
      return data;
    });
  };

  DoctapeSimple.prototype.getAccount = function (cb, errcb) {
    this.core.getResource('/account',
                          mkResourceCallbackHandlerForJSON(cb, errcb));
  };

  DoctapeSimple.prototype.getAvatar = function (size, cb, errcb) {
    this.core.getResource('/account/avatar/' + size,
                          mkResourceCallbackHandlerForBinary(cb, errcb));
  };

  DoctapeSimple.prototype.getDocumentList = function (cb, errcb) {
    this.core.getResource('/doc?include_meta=false',
                          mkResourceCallbackHandlerForJSON(cb, errcb));
  };

  DoctapeSimple.prototype.getDocumentListWithMetadata = function (cb, errcb) {
    this.core.getResource('/doc?include_meta=true',
                          mkResourceCallbackHandlerForJSON(cb, errcb));
  };

  DoctapeSimple.prototype.getDocumentInfo = function (id, cb, errcb) {
    this.core.getResource('/doc/' + id,
                          mkResourceCallbackHandlerForJSON(cb, errcb));
  };

  DoctapeSimple.prototype.setDocumentInfo = function (id, data, cb, errcb) {
    this.core.postResource('/doc/' + id, data,
                           mkResourceCallbackHandlerForJSON(cb, errcb));
  };

  DoctapeSimple.prototype.setDocumentTags = function (id, tags, cb, errcb) {
    this.setDocumentInfo(id, {tags: tags}, cb, errcb);
  };

  DoctapeSimple.prototype.setDocumentName = function (id, name, cb, errcb) {
    this.setDocumentInfo(id, {name: name}, cb, errcb);
  };

  DoctapeSimple.prototype.getDocumentOriginal = function (id, cb, errcb) {
    this.core.getResource('/doc/' + id + '/original',
                          mkResourceCallbackHandlerForBinary(cb, errcb));
  };

  DoctapeSimple.prototype.getDocumentThumbnail = function (id, cb, errcb) {
    this.core.getResource('/doc/' + id + '/thumb_120.jpg',
                          mkResourceCallbackHandlerForBinary(cb, errcb));
  };

  DoctapeSimple.prototype.getDocumentThumbnailLarge = function (id, cb, errcb) {
    this.core.getResource('/doc/' + id + '/thumb_320.jpg',
                          mkResourceCallbackHandlerForBinary(cb, errcb));
  };

  DoctapeSimple.prototype.cloneDocument = function (id, cb, errcb) {
    this.core.postResource('/doc/' + id + '/clone',
                           mkResourceCallbackHandlerForJSON(cb, errcb));
  };

  DoctapeSimple.prototype.setDocumentPublicState = function (id, state, cb, errcb) {
    this.core.postResource('/doc/' + id + '/public', {public: state},
                           mkResourceCallbackHandlerForJSON(cb, errcb));
  }

  DoctapeSimple.prototype.publishDocument = function (id, cb, errcb) {
    this.setDocumentPublicState(id, true, cb, errcb);
  };

  DoctapeSimple.prototype.unpublishDocument = function (id, cb, errcb) {
    this.setDocumentPublicState(id, false, cb, errcb);
  };

  DoctapeSimple.prototype.deleteDocument = function (id, cb, errcb) {
    this.core.deleteResource('/doc/' + id,
                             mkResourceCallbackHandlerForJSON(cb, errcb));
  };

  DoctapeSimple.prototype.extractArchiveContents = function (id, cb, errcb) {
    this.core.postResource('/doc/' + id + '/extract',
                           mkResourceCallbackHandlerForJSON(cb, errcb));
  };

}).call(this);
window.Doctape = function (config) {

  // jQuery is already here with name jQuery, dont load it
  if (!jQuery) {
    throw "JQuery not loaded!";
  }

  var self = new DoctapeSimple(config);
  self.prototype = DoctapeSimple;

  self.core.env.emit = function (event, data) {
    $('body').trigger(event, [data]);
  };

  self.core.env.subscribe = function (event, fn) {
    $('body').bind(event, fn);
  };

  self.core.env.unsubscribe = function (event, fn) {
    $('body').unbind(event, fn);
  };

  self.core.env.req = function (options, cb) {
    var ajaxOptions = {
      url: options.protocol + '://' + options.host +
           (options.port ? ':' + options.port : '') + options.path,
      type: options.method || 'GET',
      headers: options.headers || {}
    };
    if (options.postData) {
      ajaxOptions.data = options.postData;
      ajaxOptions.contentType = options.headers['Content-Type'];
      ajaxOptions.processData = false;
    }
    var req = $.ajax(ajaxOptions);
    req.done(function (x){
      return cb(null, JSON.stringify(x));
    });
    req.fail(function (xhr, text, err) {
      return cb(err);
    });
  };

  self.run = function (cb) {
    var token;
    try { token = window.location.hash.match(/access_token=([a-z0-9\-]+)/)[1]; } catch (e) {};
    if (!token) {
      window.location = self.authURL;
    } else {
      self.useToken({
        token_type:   'Bearer',
        expires_in:   3600,
        access_token: token
      }, cb);
    }
  }

  return self;

};