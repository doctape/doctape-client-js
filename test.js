var should = require('should');

var Doctape = require('./distrib-node/doctape.js');

var target = {
  authPt: {
    url: 'https://my.doctape.com/oauth2',
    protocol: 'https',
    host: 'my.doctape.com',
    port: null,
    base: '/oauth2'
  },
  resourcePt: {
    url: 'https://api.doctape.com/v1',
    protocol: 'https',
    host: 'api.doctape.com',
    port: null,
    base: '/v1'
  },
  scope: ['docs', 'account'],
  client_id: null /* INSERT CLIENT ID HERE */,
  client_secret: null /* INSERT CLIENT SECRET HERE */,
  auth_code: null /* INSERT VALID AUTH CODE HERE */
};

describe('Doctape', function () {

  var dt;

  describe('Uninitialized Object', function () {

    beforeEach(function () {
      dt = new Doctape();
    });

    afterEach(function () {
      dt = undefined;
    });

    it('should contain a complete options object', function () {
      should.exist(dt.options);
      dt.options.should.have.property('authPt');
      dt.options.should.have.property('resourcePt');
      dt.options.should.have.property('scope').and.be.empty;
      dt.options.should.have.property('client_id', null);
      dt.options.should.have.property('client_secret', null);
    });

    it('should contain a complete token object', function () {
      should.exist(dt._token);
      dt._token.should.have.property('type', null);
      dt._token.should.have.property('timeout', null);
      dt._token.should.have.property('timestamp', null);
      dt._token.should.have.property('access', null);
      dt._token.should.have.property('refresh', null);
    });

    it('should return an empty scope', function () {
      dt.scope().should.be.empty;
    });

    it('should return null credentials', function () {
      should.not.exist(dt.clientId());
      should.not.exist(dt.clientSecret());
    });

  });

  describe('Getter / Setter Functions', function () {

    beforeEach(function () {
      dt = new Doctape();
    });

    afterEach(function () {
      dt = undefined;
    });

    it('should add and get scope', function () {
      dt.addScope('foo');
      dt.options.scope.should.include('foo');
      dt.scope().should.include('foo');
    });

    it('should set and get scope', function () {
      dt.setScope(['a', 1, 'foo', null]);
      dt.options.scope.should.eql(['a', 1, 'foo', null]);
      dt.scope().should.eql(['a', 1, 'foo', null]);
    });

    it('should clear and get scope', function () {
      dt.setScope(['a', 'b']);
      dt.clearScope();
      dt.options.scope.should.be.empty;
      dt.scope().should.be.empty;
    });

    it('should set and get credentials', function () {
      dt.setCredentials('foo', 'bar');
      dt.options.client_id.should.eql('foo');
      dt.clientId().should.eql('foo');
      dt.options.client_secret.should.eql('bar');
      dt.clientSecret().should.eql('bar');
    });

    it('should set and return valid and correct authPt', function () {
      dt.setAuthPt('https://foo.com:42/bar');
      dt.options.authPt.protocol.should.eql('https');
      dt.options.authPt.host.should.eql('foo.com');
      dt.options.authPt.port.should.eql(42);
      dt.options.authPt.base.should.eql('/bar');
      dt.authPt().should.eql('https://foo.com:42/bar');
    });

    it('should set and return valid and correct resourcePt', function () {
      dt.setResourcePt('https://foo.com:42/bar');
      dt.options.resourcePt.protocol.should.eql('https');
      dt.options.resourcePt.host.should.eql('foo.com');
      dt.options.resourcePt.port.should.eql(42);
      dt.options.resourcePt.base.should.eql('/bar');
      dt.resourcePt().should.eql('https://foo.com:42/bar');
    });

    it('should return valid and correct authUrl');

  });

  describe('Configured Object', function () {

    beforeEach(function () {
      dt = new Doctape();
      dt.setAuthPt(target.authPt.url);
      dt.setResourcePt(target.resourcePt.url)
      dt.setScope(target.scope);
      dt.setCredentials(target.client_id, target.client_secret);
    });

    afterEach(function () {
      dt = undefined;
    });

    it('should be configured', function () {
      dt.options.should.have.property('authPt');
      dt.options.should.have.property('resourcePt');
      dt.options.should.have.property('scope').and.be.a('object');
      dt.options.should.have.property('client_secret').and.be.a('string').and.be.not.empty;
      dt.options.should.have.property('client_id').and.be.a('string').and.be.not.empty;
    });

    describe('Access Token Exchange Server', function () {

      it('should deny wrong access codes', function (done) {
        dt.subscribe('auth.refresh', function () { throw true; });
        dt.subscribe('auth.fail', function () { done(); });
        dt.oauthExchange('foorabc');
      });

      it('should deny wrong client ids', function (done) {
        dt.subscribe('auth.refresh', function () { throw true; });
        dt.subscribe('auth.fail', function () { done(); });
        dt.options.client_id = 'foo';
        dt.oauthExchange(target.auth_code);
      });

      it('should deny wrong client ids that are uuids', function (done) {
        dt.subscribe('auth.refresh', function () { throw true; });
        dt.subscribe('auth.fail', function () { done(); });
        dt.options.client_id = 'f19fe3ce-093a-4654-808e-2c4394a70199';
        dt.oauthExchange(target.auth_code);
      });

      it('should deny wrong client secrets', function (done) {
        dt.subscribe('auth.refresh', function () { throw true; });
        dt.subscribe('auth.fail', function () { done(); });
        dt.options.client_secret = 'foo';
        dt.oauthExchange(target.auth_code);
      });

      it('should deny wrong client secrets that are uuids', function (done) {
        dt.subscribe('auth.refresh', function () { throw true; });
        dt.subscribe('auth.fail', function () { done(); });
        dt.options.client_secret = 'f19fe3ce-093a-4654-808e-2c4394a70199';
        dt.oauthExchange(target.auth_code);
      });

      it('should allow correct authentication', function (done) {
        dt.subscribe('auth.fail', function (fail) { throw new Error(fail); });
        dt.subscribe('auth.refresh', function () { done(); });
        dt.oauthExchange(target.auth_code);
      });

    });

  });

});