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

}).call(this);