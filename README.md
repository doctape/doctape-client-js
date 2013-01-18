# doctape Javascript Client Library


This library manifests a javascript module providing asynchronous method calls against doctapes API.


## Installing for Node.JS via NPM

The latest stable release is available via `npm install doctape`.


## Installing for client side via jQuery

Just include `distrib-browser/doctape.js` in your web project.


## Usage

The first step in using the library is creating an instance of the `Doctape` prototype and setting it up via `setScope(array)` and `setCredentials(id, secret)`.

Then you may retrieve an authorization code via the OAuth endpoint. You can do so via the [Passport](http://passportjs.org/guide/) Provider we created, or by directing your users to the URL returned by `authUrl()` (to which you can optionally pass a redirect_uri parameter).

Once you are in possession of such authorization code, you use it as a parameter to `oauthExchange(code)`, which will perform an OAuth token exchange and save the retrieved token in your object. If this procedure fails, an `auth.fail` w/ error data, otherwise an `auth.refresh` event w/ the token data will be emitted.

You may subscribe and unsubscribe to these events either via means of your platform-capabilities, or use the `subscribe` and `unsubscribe` methods.

If the exchange procedure was successful, you can use the resource methods to access the data provided by our API. Every call will itself check if the token is still valid, and, if not, try to request one anew. This means that the `auth.*` events may potentially be fired at every method call.

If you wish to perform an action not provided by this library, you may:

- Either: Use `getResource`, `postResource` and `deleteResource` methods to perform authorized network requests to resources. See section *Contributing* / *Extending the set of resource methods* for more information. If you think your addition may be useful to others, please consider issuing a Pull Request to us.
- Or: Use the method `withValidAccessToken` to execute a function retrieving as parameter a valid access token.


## Testing

There exist several test for the basic infrastructure and OAuth authentication. You launch these by running [`mocha`](http://visionmedia.github.com/mocha/) (together with [should.js](http://github.com/visionmedia/should.js)) inside the top directory. You need to insert valid credentials and a valid authorization code into `test.js` to make all tests pass successfully.


## Building

### Node.JS / npm

To build the library for npm, just run `make node` from inside the top directory. You'll find the npm package structure in `distrib-node`.

### Browser / jQuery

To build a javascript file to include alongside jQuery, run `make browser` and then require `distrib-browser/doctape.js` from your web page.


## Project Structure

### Brief Description

The library consist of a core module, and several platform-dependent wrappers, currently for Node.JS and Browsers supporting jQuery.

### Core Module

The core-module (`DoctapeCore` in `doctape.js`) contains the infrastructure for authenticating with the doctape OAuth server and then performing authorized calls against the API.

Furthermore it provides several methods which map to HTTP resources exposed by the API. These are documented in the section *Usage*.

_These resource methods are at this point incomplete_, but new ones can be added with ease. See section *Contributing* for more information.

### Wrappers

Platform-dependent wrappers (`doctape_*.js`, currently only `doctape_node.js` and `doctape_browser.js`) enrich the core-module with an event-infrastructure providing methods for emitting, and (un)subscribing from, events as well as a method for performing HTTP(S) requests.

When using this library on a platform which is neither of the two, it is easy to write and plug-in another submodule. See section *Contributing* for more information.


## Contributing

### Issues and Pull Requests

We gladly accept Issues as well as Pull Requests via our [GitHub Repository](http://github.com/doctape/doctape-client-js).

### Extending the set of resource methods

The current set of methods mapping to resources on our API is incomplete. A documentation of all our API resources can be found in the [doctape devcenter](https://developer.doctape.com/resources).

When creating a new wrapper-method one uses the methods `getResource`, `postResource` and `deleteResource` all of which accept a string indicating API endpoint (i.e. `/doc`) and a callback function in the form of (`function cb(err, data)`). When the callback is called, the data may be `JSON.parse`d and, if the field `data.error` is not set, the data can be evaluated.

The structure of the JSON data can be examined in the [doctape devcenter](https://developer.doctape.com/resources), also.

See `doctape.js`, from line 319 on, for examples.

### Creating a wrapper for a new platform

A wrapper should subclass the `DoctapeCore` module and add its specific methods as mixins into the `env` object.

See `doctape_node.js` and `doctape_browser.js` for examples.
