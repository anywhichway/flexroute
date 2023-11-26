let prototyped;
const express = (router,{methods={}}={}) => {
    router.useNext();
    return async (req,res) => {
        if(!prototyped) {
            prototyped = true;
            let proto = Object.getPrototypeOf(req);
            Object.assign(proto,methods.request);
            proto = Object.getPrototypeOf(res);
            proto.get = function(field)  {
                this.getHeader(field);
            }
            proto.json = function(body) {
                this.setHeader("content-type","application/json");
                this.end(JSON.stringify(body));
                return this;
            }
            proto.send = function(body) {
                this.end(body);
                return this;
            }
            proto.set = function(field,value) {
                this.setHeader(field,value);
            }
            proto.status = function(code)  {
                this.statusCode = code;
                return this;
            }
            Object.assign(proto,methods.response);
        }
        req.rawResponse = res;
        return router.handle(req,res);
    }
};

export {express,express as default};