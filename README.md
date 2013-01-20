# doctape Javascript Client Library


This library manifests a javascript module providing asynchronous method calls against doctapes API.


## Installing for Node.JS via NPM

The latest stable release is available via `npm install doctape`.


## Installing for client side via jQuery

Just include `distrib-browser/doctape.js` in your web project.


## Usage

### Client-Type Apps

When creating a single-page javascript app that should use the Doctape API, you create a new `Doctape`-object using the configuration from the Doctape Developer Center.

After that, you can call the method `use`, passing it a function that will be bound to the Doctape object once it retrieved a valid access token. In that function you are able to make resource method calls:

    Doctape({

      appType:     'client',
      appId:       '6ca7209c-9250-4073-a927-700d9ccbce33',
      callbackURL: 'http://localhost:8000/examples/client.html',
      scope:       ['docs', 'account']

    }).run(function () {

      this.getAccount(function (acc) {
        document.write('Welcome, ' + acc.username + '!');
      });

    });

The available resource methods are documented in the sub-section *Resource Methods*.

If you are, for any reason, building a client-type app which is not a single-page javascript app (but really - you shouldn't) and/or already retrieved your token via the Implicit Grant OAuth flow, you can instead of `run` use the `useToken` method like this:

    Doctape({

      appType:     'client',
      appId:       '6ca7209c-9250-4073-a927-700d9ccbce33',
      callbackURL: 'http://localhost:8000/examples/client.html',
      scope:       ['docs', 'account']

    }).useToken(implicit_grant_access_token, function () {

      this.getAccount(function (acc) {
        // …;
      });

    });

### Server-Type Apps

When using this library in a Server-Type app, you'll first create a `Doctape`-object from the config you received in the Doctape Developer Center:

    var dt = Doctape({

      appType:     'server',
      appId:       'a6015f8e-9f62-4d08-80fe-8969c53f566b',
      appSecret:   '6767689e-2f64-4575-b364-37956ca0cda9',
      callbackURL: 'http://example.org/',
      scope:       ['docs', 'account']
 
    });

After that, you have to redirect your users to the URL stored the objects `authURL` property. Through that, your flow will continue on the page pointed to by the `callbackURL` parameter, retrieving as url query part an authorization code. Using that code, you call the method `useCode`, passing it a function that will be bound to the Doctape object once it retrieved a valid access token. In that function you are able to make resource method calls:

    dt.useCode(authorization_code, function () {

      this.getAccount(function (acc) {
      	// …;
      });

    });

### Resource Methods

You'll find more information concerning the JSON object structures in the Doctape Developer Center.

#### Account
- `getAccount (cb)` passes the callback a JSON structure containing the account data of the currently logged-in user.
- `getAvatar (cb)` passes the callback a string of binary image data representing the users avatar.

#### Multiple Documents
- `getDocumentList (cb)` passes the callback a JSON object containing a list of all documents.
- `getDocumentListWithMetadata (cb)` passes the callback a JSON object containing a list of all documents, enriched with metadata.

#### Specific Document
- `getDocumentInfo (id, cb)` passes the callback a JSON structure with information about the document given by `id`.
- `setDocumentInfo (id, info, cb)` sets the information `info` of the document given by `id`, passes the callback the updated information as a JSON object.
- `setDocumentTags (id, tags, cb)` sets the tags of the document given by `id` to the list `tags`, passes the callback the updated information as a JSON object.
- `setDocumentName (id, name, cb)` sets the name of the document given by `id` to the string given by `name`, passes the callback the updated information as a JSON object.
- `getDocumentOriginal (id, cb)` passes the callback binary data representing the original data of the document given by `id`.
- `getDocumentThumbnail (id, cb)` passes the callback binary data representing a thumbnail (jpg, 120px) of the document given by `id`.
- `getDocumentThumbnailLarge (id, cb)` passes the callback binary data representing a thumbnail (jpg, 320px) of the document given by `id`.
- `cloneDocument (id, cb)` clones the document given by `id`, passes the callback a JSON object containing the cloned documents id.
- `setDocumentPublicState (id, state, cb)` sets the published-state of the document given by `id` to true/false according to `state`, passes the callback a JSON object containing the new state and the public url.
- `publishDocument (id, cb)` publishes the document given by `id`, passes the callback a JSON object containing the new public state and the public url.
- `unpublishDocument (id, cb)` unpublishes the document given by `id`, passes the callback a JSON object containing the new public state and the public url.
- `deleteDocument (id, cb)` deletes the object given by `id`, passes the callback a JSON object indicating the success.
- `extractArchiveContents (id, cb)` extracts the contents of the archive-type document given by `id`, passes the callback a JSON object indicating the success.

### Error Handling

In case the authorization fails, the function registered as `onauthfail` will be called:

    var dt = Doctape(…);
    dt.onauthfail = function () {…};


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

The core-module (`DoctapeCore` in `core.js`) contains the infrastructure for authenticating with the doctape OAuth server and then performing authorized calls against the API.

### Simple Module

This (`DoctapeSimple` in `simple.js`) is currently the main interface to the code module, providing methods for easily working with the resources provided by the Doctape API.

### Wrappers

Platform-dependent wrappers (`wrapper-*.js`, currently only `wrapper-node.js` and `wrapper-browser.js`) enrich the simple- and core-modules with an event-infrastructure providing methods for emitting, and (un)subscribing from, events as well as a method for performing HTTP(S) requests.

When using this library on a platform which is neither of the two, it is easy to write and plug-in another submodule. See section *Contributing* for more information.


## Contributing

### Issues and Pull Requests

We gladly accept Issues as well as Pull Requests via our [GitHub Repository](http://github.com/doctape/doctape-client-js).

### Extending the set of resource methods

The current set of methods mapping to resources on our API is incomplete. A documentation of all our API resources can be found in the [doctape devcenter](https://developer.doctape.com/resources).

When creating a new wrapper-method one uses the methods `getResource`, `postResource` and `deleteResource` all of which accept a string indicating API endpoint (i.e. `/doc`) and a callback function in the form of (`function cb (err, data)`). When the callback is called, the data may be `JSON.parse`d and, if the field `data.error` is not set, the data can be evaluated.

The structure of the JSON data can be examined in the [doctape devcenter](https://developer.doctape.com/resources), also.

### Creating a wrapper for a new platform

A wrapper should subclass the `DoctapeSimple` module and add its specific methods as mixins into the `core.env` object.

See `wrapper-node.js` and `wrapper-browser.js` for examples.
