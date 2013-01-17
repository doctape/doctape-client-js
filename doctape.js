(function () {

  // ## Core Constructor

  // The Doctape core module consists of a platform-independent
  // DoctapeCore-class which holds the configuration and owns also
  // the platform-independent front-end functions.

  /** @constructor */
  var DoctapeCore = function () {

    // The API configuration is currently hard-coded.

    this.options = {
      protocol: 'https',
      host:  'my.doctape.com',
      port:  null,
      base:  '/v1',
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

  // We currently use this to register with the top-level.
  // It may be worthwhile to find a way to also abstract this
  // into the environments.

  if (typeof exports !== 'undefined' && module && module['exports']) {
    module['exports'] = DoctapeCore;
  } else {
    window['DoctapeCore'] = DoctapeCore;
  }


  // ## Getter / Setter Functions

  var clearScope = DoctapeCore.prototype.clearScope = function () {
    this.options.scope = [];
  };

  var setScope = DoctapeCore.prototype.setScope = function (scope_array) {
    this.options.scope = scope_array;
  };

  var addScope = DoctapeCore.prototype.addScope = function (scope) {
    this.options.scope.push(scope);
  };

  var scope = DoctapeCore.prototype.scope = function () {
    return this.options.scope;
  };

  var setCredentials = DoctapeCore.prototype.setCredentials = function (id, secret) {
    this.options.client_id = id;
    this.options.client_secret = secret;
  };

  var clientId = DoctapeCore.prototype.clientId = function () {
    return this.options.client_id;
  };

  var clientSecret = DoctapeCore.prototype.clientSecret = function () {
    return this.options.client_secret;
  };

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

  var setBaseUrl = DoctapeCore.prototype.setBaseUrl = function (url) {
    var parts = url.match(/([a-z]+):\/\/([^:]+):?([0-9]+)?/);
    this.options.protocol = parts[1]               || null;
    this.options.host     = parts[2]               || null;
    this.options.port     = parseInt(parts[3], 10) || null;
  };

  var baseUrl = DoctapeCore.prototype.baseUrl = function () {
    return this.options.protocol + '://' +
           this.options.host + (this.options.port ? ':' + this.options.port : '');
  };

  var authUrl = DoctapeCore.prototype.authUrl = function (redirect) {
    var uri = rediect || 'urn:ietf:wg:oauth:2.0:oob';
    return '/' + 'oauth2' +
           '?' + 'response_type=' + 'code' +
           '&' + 'client_id='     + encodeURIComponent(this.options.client_id) +
           '&' + 'scope='         + encodeURIComponent(this.options.scope.join(' ')) +
           '&' + 'redirect_uri='  + uri;
  };


  // ## Core Functions

  // Not for direct use.

  /**
   * Perform a standard POST-request with raw form post data.
   *
   * @param {string} path
   * @param {Object} data
   * @param {function (Object, Object=)} cb
   */
  var postRaw = function (path, data, cb) {
    var lines = [];
    var field;
    for (field in data) {
      lines.push(field + '=' + encodeURIComponent(data[field]));
    }
    this.env.req({
      method:   'POST',
      host:     this.options.host,
      port:     this.options.port,
      path:     path,
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
  var getAuthorized = DoctapeCore.prototype.getAuthorized = function (endpoint, cb) {
    var self = this;
    withValidAccessToken.call(this, function (token) {
      self.env.req({
        method:  'GET',
        host:    self.options.host,
        port:    self.options.port,
        path:    self.options.base + endpoint,
        headers: {'Authorization': 'Bearer ' + token}
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
  var postAuthorized = DoctapeCore.prototype.postAuthorized = function (endpoint, data, cb) {
    var self = this;
    withValidAccessToken.call(this, function (token) {
      self.env.req({
        method:   'POST',
        host:     self.options.host,
        port:     self.options.port,
        path:     self.options.base + endpoint,
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
  var deleteAuthorized = DoctapeCore.prototype.deleteAuthorized = function (endpoint, cb) {
    var self = this;
    withValidAccessToken.call(this, function (token) {
      self.env.req({
        method:  'DELETE',
        host:    self.options.host,
        port:    self.options.port,
        path:    self.options.base + endpoint,
        headers: {'Authorization': 'Bearer ' + token}
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
      oauthRefresh.call(this);
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
      return emit.call(self, 'auth.fail', error + ': ' + JSON.stringify(err));
    };
  };

  /**
   * Exchange an authorization code for an access token and a
   * refresh token.
   *
   * @param {string} code
   */
  var oauthExchange = DoctapeCore.prototype.oauthExchange = function (code) {
    if (this._lock_refresh === undefined) {
      this._lock_refresh = true;
      postRaw.call(this, '/oauth2/token',
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
  var oauthRefresh = DoctapeCore.prototype.oauthRefresh = function () {
    if (this._lock_refresh === undefined) {
      this._lock_refresh = true;
      postRaw.call(this, '/oauth2/token',
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


  // ## API functions

  // What follows are functions as a frontend to our API.
  // When working with this client, please only use these functions
  // and don't depend on the lower-level architecture.

  /**
   * Fetch Account Data, returns `cb(err, jsonData)`.
   *
   * @param {function (Object, Object=)} cb
   */
  DoctapeCore.prototype.account = function (cb) {
    getAuthorized.call(this, '/account',
                       function (err, data) {
      if (err) { return cb(err); }
      data = JSON.parse(data);
      if (data.error) {
        return cb(data.error);
      }
      return cb(null, data.result);
    });
  };

  /**
   * Fetch Documentlist, returns `cb(err, jsonData)`.
   *
   * @param {function (Object, Object=)} cb
   */
  DoctapeCore.prototype.list = function (cb) {
    getAuthorized.call(this, '/doc',
                       function (err, data) {
      if (err) { return cb(err); }
      data = JSON.parse(data);
      if (data.error) {
        return cb(data.error);
      }
      return cb(null, data.result);
    });
  };

  /**
   * Fetch Document data, returns `cb(err, docData)
   *
   * @param {Object} docId
   * @param {function (Object, Object=)} cb
   */
  DoctapeCore.prototype.get = function (docId, cb) {
    getAuthorized.call(this, '/doc/' + docId,
                       function (err, data) {
      if (err) { return cb(err); }
      data = JSON.parse(data);
      if (data.error) {
        return cb(data.error);
      }
      return cb(null, data.result);
    });
  };

  /**
   *
   * Download `filename` of given `docId`, put content in (cb);
   *
   * @param {string} docId
   * @param {string} filename
   * @param {function (Object, Object=)} cb
   */
  DoctapeCore.prototype.download = function (docId, filename, cb) {
    getAuthorized.call(this, '/doc/' + docId + '/' + filename,
                       function (err, data) {
      if (err) { return cb(err); }
      return cb(null, data);
    });
  };

  /**
   *
   * Update `docId` with `params`
   *
   * @param {Object} docId
   * @param {Object} params
   * @param {function (Object, Object=)} cb
   */
  DoctapeCore.prototype.update = function (docId, params, cb) {
    postAuthorized.call(this, '/doc/' + docId,
                        params,
                        function (err, data) {
      if (err) { return cb(err); }
      data = JSON.parse(data);
      if (data.error) {
        return cb(data.error);
      }
      return cb(null, data.result);
    });
  };
  
  /**
   * Destroy given docId
   *
   * @param {Object} docId
   * @param {function (Object, Object=)} cb
   */
  DoctapeCore.prototype.destroy = function (docId, cb) {
    deleteAuthorized.call(this, '/doc/' + docId,
                          function (err, data) {
      if (err) { return cb(err); }
      data = JSON.parse(data);
      if (data.error) {
        return cb(data.error);
      }
      return cb(null, data.result);
    });
  };
  
  /**
   *
   *
   *
   * @param {Object} docId
   * @param {Object} state
   * @param {function (Object, Object=)} cb
   */
  DoctapeCore.prototype.setPublic = function (docId, state, cb) {
    postAuthorized.call(this, '/doc/' + docId + '/public',
                        {'public': state},
                        function (err, data) {
      if (err) { return cb(err); }
      data = JSON.parse(data);
      if (data.error) {
        return cb(data.error);
      }
      return cb(null, data.result);
    });
  };

}).call(this);