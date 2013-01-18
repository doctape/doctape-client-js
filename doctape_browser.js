window.Doctape = function () {

  // jQuery is already here with name jQuery, dont load it
  if (!jQuery) {
    alert("Jquery not loaded!");
    return;
  }

  var self = new DoctapeCore();
  self.prototype = DoctapeCore;

  self.env.emit = function (event, data) {
    $('body').trigger(event, [data]);
  };

  self.env.subscribe = function (event, fn) {
    $('body').bind(event, fn);
  };

  self.env.unsubscribe = function (event, fn) {
    $('body').unbind(event, fn);
  };

  self.env.req = function (options, cb) {
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

  return self;

};