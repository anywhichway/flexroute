import WebSocket, {WebSocketServer} from "ws";
import {TextDecoder, TextEncoder} from "util";
import sendFile from "../util/send-file.js";

const encoder = new TextEncoder(),
    decoder = new TextDecoder();

const responseOrRequestToJSON = async (value) => {
    if(!value) return;
    //value = value.clone();
    const object = {};
    if(value instanceof Request) {
        if(["PUT","POST"].includes(value.method)) object.body = await value.text();
    } else {
        object.body = await value.text();
    }
    for(const key in value) {
        if(typeof value[key] === "function" || key==="signal") continue;
        if(key==="headers") {
            object.headers = {};
            value.headers.forEach((value,key)=> {
                object.headers[key] = value;
            });
        } else if(!key.startsWith("body")) {
            object[key] = value[key];
        }
    }
    return object;
}
let prototyped, nativePrototyped;
const whatwg = (router,{methods={}}={}) => {
    if(!prototyped) {
        prototyped = true;
        Object.assign(Request.prototype, methods.request);
        Object.assign(Response.prototype, methods.response);
    }
    const handler = async (req, env) => {
        let res;
        if(typeof req === "string") req = new Request(req);
        if (req.constructor.name==="IncomingMessage") {
            const {headers, method, url, host} = req,
                options = {method, headers};
            if(["PUT","POST"].includes(method)) options.body = req.body;
            req = new Request(`http${req.socket?.encrypted ? "s" : ""}://${headers.host}${url}`, options);
            const res = env;
            Object.defineProperty(req, "rawResponse", {value: res});
            if(!nativePrototyped) {
                nativePrototyped = true;
                let proto = Object.getPrototypeOf(req);
                Object.assign(proto, methods.request);
                proto = Object.getPrototypeOf(res);
                Object.assign(proto, methods.response);
                proto.sendFile = sendFile;
            }
        } else if(env) {
            if(env.waitUntil) Object.defineProperty(req, "waitUntil", {value: env.waitUntil.bind(env)});
        }
        req.URL = new URL(req.url);
        res = await router.handle(req);
        if(req.rawResponse && res instanceof Response && res!==req.rawResponse) {
            [...res.headers?.entries()].forEach(([key,value]) => {
                req.rawResponse.setHeader(key,value);
            })
            req.rawResponse.statusCode = res.status;
            req.rawResponse.statusMessage = res.statusText;
            const reader = res.body.getReader();
            do {
                const {done,value} = await reader.read();
                if(done) break;
                req.rawResponse.write(value);
            } while(true);
            req.rawResponse.end();
        }
        return res;
    }
    handler.withSockets = async (httpServer,{host,port,callback}) => {
        const _fetch = fetch;
        let ws;
        globalThis.fetch = async (url,request) => {
            url = new URL(url);
            if(["ws:","wss:"].includes(url.protocol)) {
                return new Promise((resolve) => {
                    ws ||= new WebSocket(`ws://${host}:${port}`); // need to track if port open and reopen, etc
                    ws.on("open",async () => {
                        ws.on("close",() => ws = null);
                        ws.on("message",(message) => {
                            const json = JSON.parse(decoder.decode(message));
                            return resolve(new Response(json.body,json));
                        });
                        const json = responseOrRequestToJSON(request) || {url:url.pathname,method:"GET"};
                        json.url ||= url.pathname;
                        ws.send(JSON.stringify(json)); // should support post etc
                    });
                })
            }
            return _fetch(url,request);
        }
        const wss = handler.wss = new WebSocketServer({server:httpServer}),
            subscriptions = {};
        wss.on("connection", (ws) => {
            ws.on("error",console.error);
            ws.on("message", async (message) => {
                const decoded = decoder.decode(message),
                    {url, topic, ...rest} = JSON.parse(decoded);
                if (url) {
                    let pathname = url;
                    try {
                        pathname = new URL(url).pathname;
                    } catch {

                    }
                    const request = new Request(`http${ws._socket.encrypted ? "s" :""}://${host}${port ? ":"+port : ""}${pathname}`, rest);
                    Object.defineProperty(request,"URL",{value:new URL(request.url)});
                    Object.defineProperty(request, "rawResponse", {value: ws});
                    Object.assign(ws, {sendFile,...methods.response});
                    const response = await router.handle(request);
                    if(response instanceof Response) {
                        const object = await responseOrRequestToJSON(response);
                        object.url = url;
                        const string = JSON.stringify(object);
                        //console.log(url,string);
                        ws.send(encoder.encode(string))
                    }
                } else if(topic) {
                    const subscribers = subscriptions[topic] ||= new Set();
                    if(topic==="subscribe") {
                        subscribers.add(ws);
                    } else if(topic==="unsubscribe") {
                        subscribers.delete(ws);
                    } else if(topic==="echo") {
                        ws.send(decoded);
                    } else {
                        subscribers.forEach((client) => {
                            if (client!==ws && client.readyState === WebSocket.OPEN) {
                                client.send(decoded);
                            }
                        });
                    }
                }
            })
        })
        if(callback) callback(wss);
        return this;
    }
    handler.handle = handler;
    return handler
}


export {whatwg, whatwg as default};