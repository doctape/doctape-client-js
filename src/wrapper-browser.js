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

  self.init();

  return self;

};
