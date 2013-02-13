(function () {

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

    this.authBase = core.authBase();
    this.authPath = core.authPath(config.callbackURL, (config.appType === 'server') ? 'code' : 'token');
    this.authURL = this.authBase + this.authPath;

    this.onauthfail = null;

  };

  /*
  ** Method to be called from the environment after mixin.
  */

  DoctapeSimple.prototype.init = function () {
    var self = this;
    this.core.subscribe('auth.fail', function () {
      if (typeof self.onauthfail === 'function') {
        self.onauthfail();
      }
    });
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
    });
    this.core.subscribe('auth.refresh', _cb);
    this.core.exchange(code);
  };

  /*
  ** Method for initialization with an implicit token.
  */

  DoctapeSimple.prototype.useToken = function (token, cb) {
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
