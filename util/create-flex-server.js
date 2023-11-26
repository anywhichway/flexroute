import flexroute from "../flexroute.js";
const createFlexServer = function(router,adapter,options={}) {
    const handler = adapter(router,options);
    handler.all = function(path,...args) {
        const route = flexroute((item) => (item.URL?.pathname||item.url)===path,...args);
        if(router.handleNext) route.useNext();
        router.push(route);
        return handler;
    };
    ["DELETE","GET","HEAD","OPTIONS","PATCH","POST","PUT","TRACE"].forEach((method) => {
        handler[method.toLowerCase()] = function(path,...args) {
            const type = typeof path;
            /*if(type==="object" && path instanceof Route) {
                const {method,test,schemas,handler} = test;
                if(!handler) throw new TypeError("handler is required");
                if(method || test || schemas) {
                    return async (req) => {
                        const testtype = typeof test;
                        if(method && req.method !== method) return;
                        if(!test(req)) return;
                        if(schemas.request && !schemas.request.validate(req)) return;
                        const response = await handler(req);
                        if(schemas.response && !schema.response.validate(response)) return;
                        return response;
                    };
                }
            }*/
            const route = flexroute((item) => {
                if(item.method === method) {
                    const pathname = item.URL?.pathname||item.url;
                    if(type=== "string" && path.includes(":")) {
                        const pathparts = path.split("/"),
                            pathnameparts = pathname.split("/");
                        if(pathparts.length !== pathnameparts.length) return false;
                        for(let i=0;i<pathparts.length;i++) {
                            const part = pathparts[i];
                            if(part.startsWith(":")) {
                                item.params ||= {};
                                item.params[part.slice(1)] = pathnameparts[i];
                                continue;
                            }
                            if(part !== pathnameparts[i]) return false;
                        }
                        return true;
                    }
                    if(pathname === path) return true;
                    if(type === "string" && path.endsWith("/*")) {
                        if(pathname.startsWith(path.slice(0,-2))) return true;
                    }
                    if(type==="object" && path instanceof RegExp) return path.test(pathname);
                }
                return false;
            },...args);
            if(router.handleNext) route.useNext();
            router.push(route);
            return handler;
        }
    });
    handler.handle = handler;
    return handler;
}

export {createFlexServer,createFlexServer as default}