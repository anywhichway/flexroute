const responseOrRequestToJSON = async (value) => {
    if(!value) return;
    value = value.clone();
    const object = {};
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
    if(value instanceof Request) {
        if(["PUT","POST"].includes(value.method)) object.body = await value.text();
    } else {
        object.body = await value.text();
    }
    return object;
}
const browser = (router) => {
        const handler = async (req) => {
            if(typeof(req)==="string") {
                if(req[0]==="#") {
                    const el = document.getElementById(req.substring(1));
                    if (el) {
                        if (el.tagName === "TEMPLATE") {
                            const content = el.innerHTML;
                            return new Response(content, {headers: {"content-type": "text/html"}});
                        }
                        el.scrollIntoView();
                        return el;
                    }
                    return;
                }
                const url = new URL(req,document.baseURI);
                req = new Request(url.href);
            }
            return router.handle(req).then((value) => {
                if(value instanceof Request) return window.fetch(value);
                return value;
            })
        }
        handler.withSockets = (host=window.location.host) => {
            const _fetch = fetch;
            let ws;
            globalThis.fetch = async (url,request) => {
                const type = typeof url;
                if(type==="object" && url instanceof Request) {
                    request = url;
                    url = new URL(request.url);
                } else if(type==="string") {
                    url = new URL(url);
                    request ||= new Request(url.href);
                }
                if(["ws:","wss:"].includes(url.protocol)) {
                    const json = responseOrRequestToJSON(request) || {url:url.pathname,method:"GET"};
                    json.url ||= url.pathname;
                    if(!ws) {
                        ws = new WebSocket(`ws://${host}`);
                        return new Promise((resolve) => {
                            ws.addEventListener("open", async () => {
                                ws.addEventListener("close", () => ws = null);
                                const messageListener = (message) => {
                                    const json = JSON.parse(message.data),
                                        body = json.body;
                                    delete json.body;
                                    resolve(new Response(body, json));
                                    ws.removeEventListener("message", messageListener);
                                }
                                ws.addEventListener("message", messageListener);
                                ws.send(JSON.stringify(json)); // should support post etc
                            });
                        })
                    }
                    return new Promise((resolve) => {
                        const messageListener = (message) => {
                            const json = JSON.parse(message.data),
                                body = json.body;
                            delete json.body;
                            resolve(new Response(body, json));
                            ws.removeEventListener("message", messageListener);
                        }
                        ws.addEventListener("message", messageListener);
                        ws.send(JSON.stringify(json)); // should support post etc
                    })
                }
                return _fetch(url,request);
            }
            return handler;
        }
        handler.handle = handler;
        return handler;
    };


export {browser,browser as default};