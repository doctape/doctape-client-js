var dtC = new DoctapeCore();

/*
** EVENT ARCHITECTURE
*/

(function () {

  var evcb = {};

  this.env.emit = function (event, data) {
    setTimeout(function () {
      var i, l;
      if (evcb[event] !== undefined && (l = evcb[event].length) > 0) {
        for (i = 0; i < l; i++) {
          if (typeof evcb[event][i] === 'function') {
            evcb[event][i](data);
          }
        }
      }
    }, 0);
  }

  this.env.subscribe = function (event, fn) {
    if (evcb[event] === undefined) {
      evcb[event] = [fn];
    } else if (evcb[event].indexOf(fn) === -1) {
      evcb[event].push(fn);
    }
  }

  this.env.unsubscribe = function (event, fn) {
    var idx;
    if (evcb[event] !== undefined && (idx = evcb[event].indexOf(fn)) !== -1) {
      evcb[event].splice(idx, 1);
    }
  }

}).call(dtC);

/*
** REQUEST ARCHITECTURE
*/

dtC.env.req = function (options, cb) {
  var header,
      headers = options.headers || {},
      method  = options.method  || 'GET',
      url     = options.protocol + '://' + options.host +
                (options.port ? ':' + options.port : '') + options.path;
      xhr     = new XMLHttpRequest(),
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
  }
  xhr.send(options.postData);
}

/*
** EXPOSE AUTH EVENTS
*/

dtC.subscribe('auth.fail', function () {
  postMessage('auth.fail');
});

dtC.subscribe('auth.refresh', function () {
  postMessage('auth.refresh');
});

/*
** MESSAGE / COMMAND HANDLING
*/

self.onmessage = function (ev) {

  var data = ev.data;

  /** SETTER / GETTERS **/

  if (typeof data === 'object') {

    if (data.scope) {
      dtC.setScope(data.scope);
      postMessage({scope: dtC.scope()});
    }

    if (data.clientId && data.clientSecret) {
      dtC.setCredentials(data.clientId, data.clientSecret);
      postMessage({clientId:     dtC.clientId(),
                   clientSecret: dtC.clientSecret()});
    }

    if (data.token) {
      dtC.setToken(data.token);
      postMessage({token: dtC.token()});
    }

    if (data.authPt) {
      dtC.setAuthPt(data.authPt);
      postMessage({authPt: dtC.authPt()});
    }

    if (data.resourcePt) {
      dtC.setResourcePt(data.resourcePt);
      postMessage({resourcePt: dtC.resourcePt()});
    }

    if (data.authUrl) {
      postMessage({authUrl: dtC.authUrl(data.authUrl.uri, data.authUrl.type)});
    }

  }

  if (typeof data === 'string') {

    if (data === 'scope') postMessage({scope: dtC.scope()});

    if (data === 'clientId') postMessage({clientId: dtC.clientId()});

    if (data === 'clientSecret') postMessgae({clientSecret: dtC.clientSecret()});

    if (data === 'token') postMessage({token: dtC.token()});

    if (data === 'authPt') postMessage({authPt: dtC.authPt()});

    if (data === 'resourcePt') postMessage({resourcePt: dtC.resourcePt()});

  }

  /** OAUTH METHODS */

  if (typeof data === 'object') {

    if (data.oauthExchange) {
      dtC.oauthExchange(data.oauthExchange);
    }

    if (data.oauthRefresh) {
      dtC.oauthRefresh();
    }

  }

  /** RESOURCE ACCESS **/

  if (typeof data === 'object') {

    if (data.getResource) {
      dtC.getResource(data.getResource.path, function (err, dat) {
        postMessage({getResource: {path: data.getResource.path, error: err, data: dat}});
      });
    }

    if (data.postResource) {
      dtC.postResource(data.postResource.path, data.postResource.data, function (err, dat) {
        postMessage({postResource: {path: data.postResource.path, error: err, data: dat}});
      });
    }

    if (data.deleteResource) {
      dtC.deleteResource(data.deleteResource.path, function (err, dat) {
        postMessage({deleteResource: {path: data.deleteResource.path, error: err, data: dat}});
      });
    }

  }

}