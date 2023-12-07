# flexroute
Possibly the world's most flexible router.

Early alpha release.  Not ready for production use.

Supports `whatwg` and in browser `#`, Node.js, and `express` style routing.

In `whatwg` mode on the server `flexroute` supports sharing route logic between WebSockets and HTTP. When used in
combination with a flexroute in the browser, it provides WebSocket performance for HTTP requests. Our testing shows this 
is never slower and is usually 2x to 3x faster than HTTP for small text files, e.g. HTML, JSON, txt. See the 
example `./example/browser.html`.

Can also be used for data transformation and validation.

Comes with middleware:

- `sse` server side events
- `useStatic` static file serving
- `proxy` for proxying or falling back to another server
  
Core module is just 1K minified and 562 bytes gzipped.

Support for express, node or whatwg styles will add between 225 bytes and 1K.

# Installation

```bash
npm install flexroute
```

or use from CDN

```html
<script type="module">
    import flexroute from "https://unpkg.com/flexroute";
</script>
```

# Usage

`flexroute` is a function that returns a highly specialized array of arrays with a method called `handle`. Each child 
array is a route. The first item in each array is a test function to see if the route applies to the item being routed. 
Any object can be routed, although typically it is a request. The rest of the items are child routes or functions to be 
executed if the test function returns true. These functions receive the item being routed and any additional arguments 
to the initial `handle` call.

Although a flexroute can be used directly, it is typically wrapped by an environment specific adapter which returns a 
router. There are adapters for:

- browser
- whatwwg (serveless functions, web workers, or modern Node.js)
- node.js (legacy Node.js without the overhead of express)
- express (express compatible ... at some point, many methods are not yet implemented)

## In Browser

A browser flexroute will do one of three things by default:

1. return the content of a template with the id requested when calling `router.route`
2. scroll to the element with the id requested when calling `router.route`
3. return the content of a file with the path requested when calling `router.route`

The steps you specify in a route can implement any other behavior you desire.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <script type="module">
        import flexroute from '../flexroute.js';
        import adapter from '../adapters/browser.js';
        window.router = adapter(flexroute())
    </script>
    <template id="hello-world">
        Hello World!
    </template>
</head>
<body>
<p>Run this command in the examples directory in order to have this file work: "node browser-server.js"</p>
Template: <div id="content"></div>
Remote JSON:<div id="json"></div>
<script type="module">
    let response = await router.handle("#hello-world");
    document.getElementById("content").innerHTML = await response.text();
    response = await router.handle("./browser.json");
    document.getElementById("json").innerText = `${await response.text()}`;
</script>
</body>
</html>
```

If you modify the router to use WebSockets, you can also fetch paths over WebSockets instead of HTTP, which will be much 
faster. See the example `./example/browser.html`.

## In Backend

On the back-end, in addition to an adapter, you will need a server, i.e. a router that understands HTTP verbs, parsing URLS
for parameters and is attached to a native listener. These are created by passing an adapted flexroute to `createFlexServer`.

### Whatwg style

Whatwg style routing is becoming the dominant style due to its prevalence in serverless functions and popularization 
through `Hono` and `itty-router`.

The below example uses whatwg wrapped around node's native `http` server; but it can be used in serverless or Deno 
environments as well.

```javascript
import process from "node:process";
import {createServer} from "node:http";
import {flexroute} from "../flexroute.js";
import adapter from "../adapters/whatwg.js";
import createFlexServer from "../util/create-flex-server.js";

const flexServer = createFlexServer(flexroute(),adapter);
flexServer.get("/hello/:name", (req) => {
    return new Response(`hello ${req.params.name}`);
})

const port = 3000,
    host = process.env.HOST || "localhost";
const httpServer = createServer(flexServer);
httpServer.listen(port,host,port, async () => {
    console.log(`http server listening on port ${port}`);
    let response = await fetch(`http://${host}:${port}/hello/joe`);
    console.log(await response.text());
});
```

Under the hood, you can access the native response object at `req.rawResponse`. There are some things that are hard
or inefficient to do with the whatwg response object, so this is provided as a convenience. If you do something
with the `rawResponse` you MUST return the `rawResponse` from your route handler at some point. See the implementation
of the `./middleware/server/sse.js` for an example.

Also see `./examples/whatwg.js`.

### Node.js style

The Node.js style is similar to the whatwg style, but uses the native Node.js `http` server and `request` and `response`.
If any of your routes return the `response` object, routing stops.

```javascript
import process from "node:process";
import {createServer} from "node:http";
import {flexroute} from "../flexroute.js";
import adapter from "../adapters/node.js";
import createFlexServer from "../util/create-flex-server.js";

const flexServer = createFlexServer(flexroute(),adapter);
flexServer.get("/hello/:name", (req,res) => {
    res.end(`hello ${req.params.name}`);
    return res;
})

const port = 3000,
    host = process.env.HOST || "localhost";
const httpServer = createServer(flexServer);
httpServer.listen(port,host,port, async () => {
    console.log(`http server listening on port ${port}`);
    let response = await fetch(`http://${host}:${port}/hello/joe`);
    console.log(await response.text());
});
```

Also see `./examples/node.js`.

### Express style

Express style routing uses the `next()` convention to continue routing. And, the `request` and `response` objects are
heavily enhanced with utility functions.

```javascript
import process from "node:process";
import {createServer} from "node:http";
import {flexroute} from "../flexroute.js";
import adapter from "../adapters/express.js";
import createFlexServer from "../util/create-flex-server.js";

const flexServer = createFlexServer(flexroute(),adapter);
flexServer.get("/", (req,res,next) => { res.write("start ")}, (req,res,next) => { return next()}, (req,res,next) => res.write("fail"))
flexServer.get("/", (req,res,next) => {
    res.status(200).end("hello world");
    return res;
})

const port = 3000,
    host = process.env.HOST || "localhost";
const httpServer = createServer(flexServer);
httpServer.listen(port,host,port, async () => {
    console.log(`http server listening on port ${port}`);
    let response = await fetch(`http://${host}:${port}/`);
    console.log(await response.text());
});
```

Also see `./examples/express.js`.

## Data Transformation

When using `flexroute` for transformation, the first item in a route is used to check if the route applies to the object
being transformed. The remaining itmes are the steps do the transformation. Transformation is complete when any step
return a value.

Make sure the final step simply returns a value.

```javascript
import {flexroute} from "../flexroute.js";

const transformer = flexroute().use(
    // if name is missing, add it
    [(item)=>item.name==null,(item) => { item.name = "Joe"}],
    // if age is missing, add it
    [(item)=> item.age==null, (item) => { item.age = 21; }],
    // return the item
    [true,(item) => { return item }]
);

console.log(await transformer.handle({name:"Bob"}));
console.log(await transformer.handle({age:30}));
console.log(await transformer.handle({name:"Bob",age:30}));
console.log(await transformer.handle({}));
```

Also see `./examples/datatransform.js`.

# Middleware

See the examples for each router style in `./examples`.

## Server Side Events

## Static File Serving

## Proxy and Fall Back

# Utilities

## createFlexServer

## MIME Types


# Rationale

Flexroute was written:

- so that developers could share route logic between WebSockets and HTTP
- get WebSocket performance for HTTP requests from the browser
- have choice about the style of routing they use within the context of a single package

It was originally implemented to support choice of routing style in [lazui](https://lazui.org), the lazy UI toolkit.

Data transformation ability was an accidental discovery.

# Change History (Reverse Chronological Order)

## 2023-12-07 v0.0.4-a added ability for server routes to start with a function in addition to path string or RegExp

## 2023-11-26 v0.0.3-a Resolved issues related to WebSockets and added an example for it. Substantial documentation
additions.

## 2023-11-25 v0.0.2-a Fixed issues with browser version and created an example for it

## 2023-11-25 v0.0.1-a Initial public release
