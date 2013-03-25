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
      window.location = self.authURL + '#state=' + encodeURIComponent(hash.state);
    } else {
      self.useToken({
        token_type:   'Bearer',
        expires_in:   3600,
        access_token: hash.access_token
      }, cb);
    }
  };

  return self;

};
